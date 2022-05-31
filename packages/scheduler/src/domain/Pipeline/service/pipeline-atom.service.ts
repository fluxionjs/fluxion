import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { defaultPagination } from '@/utils/orm';
import { Logger } from '@/common/logger.service';
import { AtomService } from '@/domain/Atom/service/atom.service';
import {
  PipelineAtomBatchCreateDTO,
  PipelineAtomCreateDTO,
  PipelineAtomUpdateDTO,
} from '../dto/PipelineAtom.dto';
import { PipelineAtomEntity } from '../entity/pipeline-atom.entity';
import { PipelineAtomRepository } from '../repo/pipeline-atom.repository';
import { PipelineService } from './pipeline.service';
import { OnEvent } from '@nestjs/event-emitter';
import { AtomExecuteSuccessEvent } from '@/domain/Atom/events/atom-execution.event';
import { NextAtomOption } from '@/domain/Task/dto/TaskResult.dto';
import { AtomWorkerService } from '@/domain/Atom/service/atom-worker.service';
import { NotFoundError } from 'common-errors';

@Injectable()
export class PipelineAtomService {
  constructor(
    private repo: PipelineAtomRepository,
    @Inject(forwardRef(() => PipelineService))
    private pipelineService: PipelineService,
    @Inject(forwardRef(() => AtomService))
    private atomService: AtomService,
    @Inject(forwardRef(() => AtomWorkerService))
    private atomWorkerService: AtomWorkerService,
  ) {}

  private readonly logger = new Logger(PipelineAtomService.name);

  async create(data: PipelineAtomCreateDTO, creatorId: string) {
    const parentAtom = data.parentAtomId
      ? await this.getById(data.parentAtomId, creatorId)
      : null;
    const pipeline = data.pipelineId
      ? await this.pipelineService.getById(data.pipelineId, creatorId)
      : null;
    const atom = data.atomId
      ? await this.atomService.getById(data.atomId, creatorId)
      : null;

    const entity = PipelineAtomEntity.create({
      parentAtom,
      pipeline,
      atom,
      creatorId,
    });
    this.logger.debug(`Created a Pipeline Atom ${entity}`);
    return this.repo.save(entity);
  }

  @OnEvent('atom.execute.success')
  async handleAtomExecuteSuccess(event: AtomExecuteSuccessEvent) {
    const {
      atomId,
      taskId,
      userId,
      pipelineId,
      pipelineTaskId,
      input,
      output,
      isExecutedByPipeline,
      nextAtoms,
    } = event;
    if (!isExecutedByPipeline) return;
    this.logger.debug(
      `Received the atom ${atomId} execution success event, Content: ${JSON.stringify(
        output,
      )}`,
    );

    const pipelineAtomEntity = await this.getByAtom(atomId, pipelineId, userId);
    if (!pipelineAtomEntity) {
      this.logger.error(
        new NotFoundError(
          `Pipeline Atom ${atomId} (for pipeline ${pipelineId})`,
        ),
      );
      return;
    }

    const [nextPipelineAtoms] = await this.findByParentAtom(
      pipelineAtomEntity.atom.id,
      pipelineId,
      userId,
      {
        page: 1,
        perPage: 100,
      },
    );

    let nextAtomOptions: NextAtomOption[] = [];

    if (!Array.isArray(nextAtoms) || nextAtoms.length <= 0) {
      // if the special next atom options is not exists,
      // execute all next atoms that defined in the pipeline
      nextAtomOptions = nextPipelineAtoms.map((pipelineAtomEntity) => {
        return {
          atomId: pipelineAtomEntity.atom.id,
        };
      });
    } else {
      // filter not defined pipeline atoms
      nextAtomOptions = nextAtoms.filter((opt) => {
        const index = nextPipelineAtoms.findIndex(
          (row) => row.atom.id === opt.atomId || row.atom.name === opt.atomName,
        );
        return index >= 0;
      });

      // Atom can assign the following routing path with setting `only` in the option
      const hasOnlyOptions = nextAtomOptions.some((opt) => opt.only);

      if (hasOnlyOptions) {
        nextAtomOptions = nextAtomOptions.filter((opt) => opt.only);
      } else {
        // The next atoms defined in the pipeline but not mentioned by the last atom,
        // would be executed with the same input
        const passThroughAtoms = nextPipelineAtoms
          .filter((row) => {
            const index = nextAtoms.findIndex(
              (opt) =>
                opt.atomId === row.atom.id || opt.atomName === row.atom.name,
            );
            return index < 0;
          })
          .map((pipelineAtomEntity) => {
            return {
              atomId: pipelineAtomEntity.atom.id,
              // In pipeline execution, the last atom's output will be the next atom's input by default
              input: output,
            };
          });
        nextAtomOptions = nextAtomOptions.concat(passThroughAtoms);
      }
    }

    if (nextAtomOptions.length > 0) {
      this.logger.debug(
        `Going to execute next atoms (length: ${nextAtomOptions.length})`,
        `Next Atoms: ${JSON.stringify(nextAtomOptions)}`,
      );

      return this.atomWorkerService.processNextAtoms(
        nextAtomOptions,
        userId,
        // In pipeline execution, the last atom's output will be the next atom's input by default
        output,
        {
          userId,
          lastInput: input,
          output,
          parentAtomId: atomId,
          parentTaskId: taskId,
          pipelineId,
          pipelineTaskId,
        },
      );
    }
  }

  async batchCreate(data: PipelineAtomBatchCreateDTO, creatorId: string) {
    return this.repo.batchCreate(data, creatorId);
  }

  async getById(id: number, creatorId: string) {
    return this.repo.getById(id, creatorId);
  }

  async getByIds(ids: number[], creatorId: string) {
    return this.repo.getByIds(ids, creatorId);
  }

  async getByAtom(atomId: number, pipelineId: number, creatorId: string) {
    return this.repo.getByAtom(atomId, pipelineId, creatorId);
  }

  async findByParentAtom(
    atomId: number,
    pipelineId: number,
    creatorId: string,
    pagination = defaultPagination,
  ) {
    return this.repo.findByParentAtom(
      atomId,
      pipelineId,
      creatorId,
      pagination,
    );
  }

  async findByPipeline(
    pipelineId: number,
    creatorId: string,
    pagination = defaultPagination,
  ) {
    return this.repo.findByPipeline(pipelineId, creatorId, pagination);
  }

  async findByCreatorId(creatorId: string, pagination = defaultPagination) {
    return this.repo.findByCreatorId(creatorId, pagination);
  }

  async update(id: number, creatorId: string, data: PipelineAtomUpdateDTO) {
    return this.repo.update(id, creatorId, data);
  }
}
