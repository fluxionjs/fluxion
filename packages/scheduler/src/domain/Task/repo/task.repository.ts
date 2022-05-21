import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundError } from 'common-errors';
import { AtomRepository } from '@/domain/Atom/repo/atom.repository';
import { PipelineRepository } from '@/domain/Pipeline/repo/pipeline.repository';
import { TaskEntity } from '../entity/Task';
import { PipelineTaskRepository } from './pipeline-task.repository';
import { Pagination } from '@/utils/orm';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private repo: Repository<TaskEntity>,
    private atomRepo: AtomRepository,
    private pipelineRepo: PipelineRepository,
    private pipelineTaskRepo: PipelineTaskRepository,
  ) {}

  async save(entity: TaskEntity) {
    return this.repo.save(entity);
  }

  async getById(id: number, creatorId: string) {
    return this.repo.findOne({
      where: { id, creatorId },
      relations: ['atom', 'pipelineTask', 'result'],
    });
  }

  async getByIds(ids: number[], creatorId: string) {
    return this.repo.find({
      where: {
        id: In(ids),
        creatorId,
      },
      relations: ['atom', 'pipelineTask', 'result'],
    });
  }

  async findByAtom(
    atomId: number,
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: TaskEntity[], total: number]> {
    const atomEntity = await this.atomRepo.getById(atomId, creatorId);

    if (!atomEntity) {
      throw new NotFoundError(`Atom ${atomId}`);
    }

    const where = {
      where: {
        atom: atomEntity,
        creatorId,
      },
    };

    const total = await this.repo.count(where);
    const list = await this.repo.find({
      ...where,
      order: {
        id: 'DESC',
      },
      take: pagination.perPage,
      skip: (pagination.page - 1) * pagination.perPage,
      relations: ['pipelineTask', 'result'],
    });

    return [list, total];
  }

  async findByCreatorId(
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: TaskEntity[], total: number]> {
    const where = {
      where: { creatorId },
    };

    const total = await this.repo.count(where);
    const list = await this.repo.find({
      ...where,
      order: {
        id: 'DESC',
      },
      take: pagination.perPage,
      skip: (pagination.page - 1) * pagination.perPage,
      relations: ['parentAtom', 'pipeline', 'atom', 'nextAtoms'],
    });

    return [list, total];
  }

  // TODO: update
}
