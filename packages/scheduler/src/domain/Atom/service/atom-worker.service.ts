import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Queue, Job } from 'bull';
import { isInteger, isString } from 'lodash';
import { URL } from 'url';
import { AtomEntity } from '../entity/atom.entity';
import { AtomExecuteOptions, AtomWorker } from '../worker/base-worker';
import { HttpAtomWorker } from '../worker/http.worker';
import { NotFoundError, ValidationError } from 'common-errors';
import { TaskResultService } from '@/domain/Task/service/task-result.service';
import { TaskService } from '@/domain/Task/service/task.service';
import { TaskStatus } from '@/domain/Task/dto/Task.dto';
import { AtomService } from './atom.service';
import { NextAtomOption } from '@/domain/Task/dto/TaskResult.dto';
import { JavaScriptAtomWorker } from '../worker/javascript.worker';
import {
  AtomExecuteFailedEvent,
  AtomExecuteStartEvent,
  AtomExecuteSuccessEvent,
} from '../events/atom-execution.event';
import { Logger } from '@/common/logger.service';
import { PipelineAtomService } from '@/domain/Pipeline/service/pipeline-atom.service';

export interface AtomExecuteJobData<T = unknown> {
  atomId: number;
  connectUrl: string;
  taskId: number;
  userId: string;
  input: T;
  options?: AtomExecuteOptions;
}

@Injectable()
@Processor('atom-task')
export class AtomWorkerService {
  constructor(
    @Inject(forwardRef(() => AtomService))
    private atomService: AtomService,
    private taskService: TaskService,
    private taskResultService: TaskResultService,
    @Inject(forwardRef(() => PipelineAtomService))
    private pipelineAtomService: PipelineAtomService,
    private httpWorker: HttpAtomWorker,
    private jsCodeWorker: JavaScriptAtomWorker,
    @InjectQueue('atom-task') private taskQueue: Queue,
    private eventEmitter: EventEmitter2,
  ) {}

  private readonly logger = new Logger(AtomWorkerService.name);

  /**
   * Execute an atom and return a task entity
   *
   * @param atomEntity Atom Entity
   * @param input Execution Payload
   * @param options Execution Options
   * @returns Task Entity
   */
  async execute<T>(
    atomEntity: AtomEntity,
    input: T,
    options?: AtomExecuteOptions,
  ) {
    const userId = options?.userId || atomEntity.creatorId;
    const { parentTaskId } = options || {};

    const taskEntity = await this.taskService.create(
      {
        atomId: atomEntity.id,
        pipelineTaskId: options?.pipelineTaskId,
        status: TaskStatus.pending,
        parentTaskId,
      },
      userId,
    );

    this.taskQueue.add('execute', {
      atomId: atomEntity.id,
      connectUrl: atomEntity.connectUrl,
      taskId: taskEntity.id,
      userId,
      input,
      options: options || {},
    } as AtomExecuteJobData<T>);

    return taskEntity;
  }

  /**
   * Queue Task process function
   * @param job Bull queue job
   * @returns
   */
  @Process('execute')
  async executeQueueTask(job: Job<AtomExecuteJobData>) {
    const { atomId, connectUrl, taskId, userId, input, options } = job.data;
    const { pipelineId, pipelineTaskId } = options || {};
    const isExecutedByPipeline =
      isInteger(pipelineTaskId) && pipelineTaskId > 0;

    try {
      const atomEntity = await this.atomService.getById(atomId, userId);
      if (!atomEntity) {
        throw new NotFoundError(`Atom ${atomId}`);
      }

      let inputMappingCode: string = null;
      let outputMappingCode: string = null;

      if (isExecutedByPipeline) {
        const pipelineAtom = await this.pipelineAtomService.getByAtom(
          atomId,
          pipelineId,
          userId,
        );
        if (pipelineAtom) {
          inputMappingCode = pipelineAtom.inputMappingCode;
          outputMappingCode = pipelineAtom.outputMappingCode;
        }
      }

      // Execute input mapping
      this.logger.debug(`Executing pipeline atom input`);
      const atomInput = await this.executeMapping(
        atomEntity,
        inputMappingCode,
        input,
        options,
      );
      this.logger.debug(
        `Executed pipeline atom input: ${JSON.stringify(atomInput)}`,
      );

      // Initialize the atom worker
      const worker = this.detectWorker(connectUrl);

      await this.taskService.update(taskId, userId, {
        status: TaskStatus.running,
      });

      // Emitting start event
      const startEvent = new AtomExecuteStartEvent();
      startEvent.atomId = atomId;
      startEvent.taskId = taskId;
      startEvent.userId = userId;
      startEvent.pipelineTaskId = options.pipelineTaskId;
      startEvent.pipelineId = pipelineId;
      startEvent.parentAtomId = options.parentAtomId;
      startEvent.parentTaskId = options.parentTaskId;
      this.eventEmitter.emit('atom.execute.start', startEvent);
      this.logger.verbose(
        `Emitting atom execute start event: Atom ${atomId}, Task ${taskId}`,
      );

      // Executing by worker
      this.logger.debug(
        `Executing atom ${atomEntity.name} (id: ${atomEntity.id})`,
      );
      const workerResult = await worker.execute(atomEntity, atomInput, options);
      if (!workerResult.success) {
        throw workerResult.output;
      }

      // Execution succeed
      this.logger.verbose(
        `Executed atom ${atomEntity.name} (id: ${atomEntity.id}) success`,
      );

      // Execute output mapping
      this.logger.debug(`Executing pipeline atom output`);
      const replyOutput = await this.executeMapping(
        atomEntity,
        outputMappingCode,
        workerResult.output,
      );
      this.logger.debug(
        `Executed pipeline atom output: ${JSON.stringify(replyOutput)}`,
      );

      this.logger.debug(`Creating task result entity for task ${taskId}`);
      const successfulResultEntity = await this.taskResultService.create(
        {
          taskId,
          status: TaskStatus.succeed,
          input,
          output: replyOutput,
        },
        userId,
      );

      this.logger.debug(
        `Updating task entity ${taskId} with result ${successfulResultEntity.id}`,
      );
      await this.taskService.update(taskId, userId, {
        status: TaskStatus.succeed,
        resultId: successfulResultEntity.id,
      });

      // Next atoms
      const nextAtoms = workerResult.nextAtoms;

      // By default, Fluxion will execute pipeline atoms that defined in the current pipeline.
      // If worker return a special array of execute option for the next atoms,
      // Fluxion will ignore the options that not defined in the pipeline
      if (nextAtoms && !isExecutedByPipeline) {
        // Only execute if current task is executed by atom directly
        this.logger.verbose(`Directly execute next atoms of atom ${atomId}`);
        await this.processNextAtoms(nextAtoms, userId, input, {
          ...options,
          output: replyOutput,
          parentAtomId: atomId,
          parentTaskId: taskId,
        });
      }

      // Emitting success event, and trigger next pipeline atoms
      this.logger.verbose(
        `Emitting atom execute success event: Atom ${atomId}, Task ${taskId}`,
      );
      const successfulEvent = new AtomExecuteSuccessEvent();
      successfulEvent.atomId = atomId;
      successfulEvent.taskId = taskId;
      successfulEvent.input = input;
      successfulEvent.output = replyOutput;
      successfulEvent.isExecutedByPipeline = isExecutedByPipeline;
      successfulEvent.pipelineId = pipelineId;
      successfulEvent.pipelineTaskId = pipelineTaskId;
      successfulEvent.nextAtoms = nextAtoms;
      successfulEvent.userId = userId;
      this.eventEmitter.emit('atom.execute.success', successfulEvent);

      return {};
    } catch (err) {
      this.logger.error(`Executed atom ${atomId} failed: ${err.message}`);
      const failedResultEntity = await this.taskResultService.create(
        {
          taskId,
          status: TaskStatus.failed,
          input,
          output: err,
        },
        userId,
      );
      await this.taskService.update(taskId, userId, {
        status: TaskStatus.failed,
        resultId: failedResultEntity.id,
      });

      // Emitting failed event
      const failureEvent = new AtomExecuteFailedEvent();
      failureEvent.atomId = atomId;
      failureEvent.taskId = taskId;
      failureEvent.userId = userId;
      failureEvent.input = input;
      failureEvent.pipelineId = pipelineId;
      failureEvent.pipelineTaskId = pipelineTaskId;
      failureEvent.output = err;
      this.eventEmitter.emit('atom.execute.failed', failureEvent);
      return {};
    }
  }

  private async executeMapping<T = unknown, K = unknown>(
    atomEntity: AtomEntity,
    code: string,
    input: T,
    options?: AtomExecuteOptions,
  ) {
    if (!code || !isString(code)) {
      return input;
    } else {
      const worker = this.detectWorker(code);
      const workerResult = await worker.execute(atomEntity, input, options);
      if (!workerResult.success) {
        return input;
      }

      return workerResult.output;
    }
  }

  async processNextAtoms<T = unknown>(
    nextAtoms: NextAtomOption[],
    userId: string,
    lastInput: T,
    options?: AtomExecuteOptions,
  ) {
    if (Array.isArray(nextAtoms) && nextAtoms.length > 0) {
      for (const atomOption of nextAtoms) {
        const { atomId, atomName, input: nextInput } = atomOption;

        let nextAtomEntity: AtomEntity;

        if (isInteger(atomId) && atomId > 0) {
          nextAtomEntity = await this.atomService.getById(atomId, userId);
        } else if (isString(atomName) && atomName.length > 0) {
          nextAtomEntity = await this.atomService.getByName(atomName, userId);
        }

        if (!nextAtomEntity) {
          this.logger.error(new NotFoundError(`Atom ${atomId || atomName}`));
          continue;
        }

        await this.execute(nextAtomEntity, nextInput || lastInput, {
          ...options,
          parentTaskId: options?.parentTaskId,
        });
      }
    }
  }

  private detectWorker(connectUrl): AtomWorker {
    const url = new URL(connectUrl);
    if (!url) {
      throw new ValidationError('Connection URL not correct');
    }

    const protocol = url.protocol.slice(0, url.protocol.length - 1);

    switch (protocol) {
      case 'http':
        return this.httpWorker;

      case 'js-code':
        return this.jsCodeWorker;
    }

    throw new NotFoundError(`Worker ${protocol}`);
  }
}
