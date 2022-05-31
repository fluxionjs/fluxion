import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { defaultPagination } from '@/utils/orm';
import { Logger } from '@/common/logger.service';
import {
  PipelineAndAtomsCreateDTO,
  PipelineCreateDTO,
  PipelineQueryDTO,
  PipelineUpdateDTO,
} from '../dto/Pipeline.dto';
import { PipelineEntity } from '../entity/pipeline.entity';
import { PipelineRepository } from '../repo/pipeline.repository';
import { NotFoundError, ValidationError } from 'common-errors';
import { PipelineTaskService } from '@/domain/Task/service/pipeline-task.service';
import { TaskStatus } from '@/domain/Task/dto/Task.dto';
import { AtomService } from '@/domain/Atom/service/atom.service';
import { PipelineAtomService } from './pipeline-atom.service';

@Injectable()
export class PipelineService {
  constructor(
    private repo: PipelineRepository,
    @Inject(forwardRef(() => PipelineTaskService))
    private pipelineTaskService: PipelineTaskService,
    @Inject(forwardRef(() => PipelineAtomService))
    private pipelineAtomService: PipelineAtomService,
    @Inject(forwardRef(() => AtomService))
    private atomService: AtomService,
  ) {}

  private readonly logger = new Logger(PipelineService.name);

  async create(data: PipelineCreateDTO, userId: string) {
    const entity = PipelineEntity.create({ ...data, creatorId: userId });
    return this.repo.save(entity);
  }

  async createPipelineAndAtoms(
    data: PipelineAndAtomsCreateDTO,
    userId: string,
  ) {
    const { pipeline, atoms } = data;
    let pipelineEntity = await this.create(pipeline, userId);
    const { root, atoms: atomEntities } =
      await this.pipelineAtomService.batchCreate(atoms, userId);
    pipelineEntity = await this.update(pipelineEntity.id, userId, {
      rootAtomId: root.id,
    });

    return {
      pipeline: pipelineEntity,
      atoms: atomEntities,
    };
  }

  async getById(id: number, creatorId: string) {
    return this.repo.getById(id, creatorId);
  }

  async getByName(name: string, creatorId: string) {
    return this.repo.getByName(name, creatorId);
  }

  async findByQuery(
    query: PipelineQueryDTO,
    creatorId: string,
    pagination = defaultPagination,
  ) {
    return this.repo.findByQuery(query, creatorId, pagination);
  }

  async enable(id: number, creatorId: string) {
    return this.repo.enable(id, creatorId);
  }

  async disable(id: number, creatorId: string) {
    return this.repo.disable(id, creatorId);
  }

  async update(id: number, creatorId: string, data: PipelineUpdateDTO) {
    return this.repo.update(id, creatorId, data);
  }

  async execute<T = unknown>(id: number, creatorId: string, input: T) {
    const pipelineEntity = await this.getById(id, creatorId);
    if (!pipelineEntity) {
      const err = new NotFoundError(`Pipeline ${id}`);
      this.logger.error(err);
      throw err;
    }

    if (!pipelineEntity.rootAtom) {
      const err = new ValidationError(
        `Pipeline ${id} does not have a root atom`,
      );
      this.logger.error(err);
      throw err;
    }
    this.logger.log(`Start to execute pipeline ${id}`);

    this.logger.debug('Creating pipeline task');
    let pipelineTaskEntity = await this.pipelineTaskService.create(
      {
        pipelineId: id,
        status: TaskStatus.running,
      },
      creatorId,
    );

    this.logger.debug('Executing the root pipeline atom');

    const pipelineAtomEntity = await this.pipelineAtomService.getById(
      pipelineEntity.rootAtom.id,
      pipelineEntity.rootAtom.creatorId,
    );

    const rootAtomTask = await this.atomService.execute(
      pipelineAtomEntity.atom,
      input,
      {
        userId: creatorId,
        pipelineId: id,
        pipelineTaskId: pipelineTaskEntity.id,
      },
    );

    pipelineTaskEntity = await this.pipelineTaskService.update(
      pipelineTaskEntity.id,
      creatorId,
      {
        rootTaskId: rootAtomTask.id,
      },
    );

    return pipelineTaskEntity;
  }
}
