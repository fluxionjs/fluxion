import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectQueue, Processor, Process } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { AtomEntity } from '../entity/atom.entity';
import { URL } from 'url';
import { AtomExecuteOptions, AtomWorker } from '../worker/base-worker';
import { HttpAtomWorker } from '../worker/http.worker';
import { NotFoundError, ValidationError } from 'common-errors';
import { TaskResultService } from '@/domain/Task/service/task-result.service';
import { TaskService } from '@/domain/Task/service/task.service';
import { TaskStatus } from '@/domain/Task/dto/Task.dto';
import { AtomService } from './atom.service';
import { isInteger, isString } from 'lodash';
import { NextAtomOption } from '@/domain/Task/dto/TaskResult.dto';
import { JavaScriptAtomWorker } from '../worker/javascript.worker';

export interface AtomExecuteJobData<T = unknown> {
  atomId: number;
  connectUrl: string;
  taskId: number;
  userId: string;
  payload: T;
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
    private httpWorker: HttpAtomWorker,
    private jsCodeWorker: JavaScriptAtomWorker,
    @InjectQueue('atom-task') private taskQueue: Queue,
  ) {}

  async execute<T>(
    atomEntity: AtomEntity,
    payload: T,
    options?: AtomExecuteOptions,
  ) {
    const userId = options?.userId || atomEntity.creatorId;

    const taskEntity = await this.taskService.create(
      {
        atomId: atomEntity.id,
        pipelineTaskId: options?.pipelineTaskId,
        status: TaskStatus.pending,
      },
      userId,
    );

    this.taskQueue.add('execute', {
      atomId: atomEntity.id,
      connectUrl: atomEntity.connectUrl,
      taskId: taskEntity.id,
      userId,
      payload,
      options,
    } as AtomExecuteJobData<T>);

    return taskEntity;
  }

  @Process('execute')
  async executeQueueTask(job: Job<AtomExecuteJobData>) {
    const { atomId, connectUrl, taskId, userId, payload, options } = job.data;

    try {
      const atomEntity = await this.atomService.getById(atomId, userId);

      if (!atomEntity) {
        throw new NotFoundError(`Atom ${atomId}`);
      }

      const worker = this.detectWorker(connectUrl);

      await this.taskService.update(taskId, userId, {
        status: TaskStatus.running,
      });

      const workerResult = await worker.execute(atomEntity, payload, options);
      if (!workerResult.success) {
        throw workerResult.payload;
      }

      const nextAtoms = workerResult.nextAtoms;

      const replyPayload = workerResult.payload;

      const successfulResultEntity = await this.taskResultService.create(
        {
          taskId,
          status: TaskStatus.succeed,
          payload,
          content: replyPayload,
        },
        userId,
      );

      await this.taskService.update(taskId, userId, {
        status: TaskStatus.succeed,
        resultId: successfulResultEntity.id,
      });

      await this.processNextAtoms(nextAtoms, userId, options);
      return {};
    } catch (err) {
      const failedResultEntity = await this.taskResultService.create(
        {
          taskId,
          status: TaskStatus.failed,
          payload,
          content: err,
        },
        userId,
      );
      await this.taskService.update(taskId, userId, {
        status: TaskStatus.failed,
        resultId: failedResultEntity.id,
      });
      return {};
    }
  }

  async processNextAtoms(
    nextAtoms: NextAtomOption[],
    userId: string,
    options?: AtomExecuteOptions,
  ) {
    if (Array.isArray(nextAtoms) && nextAtoms.length > 0) {
      for (const atomOption of nextAtoms) {
        const { atomId, atomName, payload: nextPayload } = atomOption;

        let nextAtomEntity: AtomEntity;

        if (isInteger(atomId) && atomId > 0) {
          nextAtomEntity = await this.atomService.getById(atomId, userId);
        } else if (isString(atomName) && atomName.length > 0) {
          nextAtomEntity = await this.atomService.getByName(atomName, userId);
        }

        if (!nextAtomEntity) {
          // TODO: log not found error
          continue;
        }

        await this.execute(nextAtomEntity, nextPayload || {}, options);
      }
    }
  }

  detectWorker(connectUrl): AtomWorker {
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
