import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundError } from 'common-errors';
import { AtomRepository } from '@/domain/Atom/repo/atom.repository';
import { TaskEntity } from '../entity/task.entity';
import { Pagination } from '@/utils/orm';
import { TaskUpdateDTO } from '../dto/Task.dto';
import { isNil, pick } from 'lodash';
import { TaskResultRepository } from './task-result.repository';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(TaskEntity)
    private repo: Repository<TaskEntity>,
    private atomRepo: AtomRepository,
    @Inject(forwardRef(() => TaskResultRepository))
    private taskResultRepo: TaskResultRepository,
  ) {}

  async save(entity: TaskEntity) {
    return this.repo.save(entity);
  }

  async getById(
    id: number,
    creatorId: string,
    relations = ['atom', 'pipelineTask', 'result', 'parentTask'],
  ) {
    return this.repo.findOne({
      where: { id, creatorId },
      relations,
    });
  }

  async getByIds(
    ids: number[],
    creatorId: string,
    relations = ['atom', 'pipelineTask', 'result', 'parentTask'],
  ) {
    return this.repo.find({
      where: {
        id: In(ids),
        creatorId,
      },
      relations,
    });
  }

  async findByAtom(
    atomId: number,
    creatorId: string,
    pagination: Pagination,
    relations = ['pipelineTask', 'result', 'parentTask'],
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
      relations,
    });

    return [list, total];
  }

  async findByCreatorId(
    creatorId: string,
    pagination: Pagination,
    relations = ['parentTask', 'pipeline', 'atom', 'result'],
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
      relations,
    });

    return [list, total];
  }

  async findByParentTask(
    parentTaskId: number,
    creatorId: string,
    pagination: Pagination,
    relations = ['parentTask', 'pipeline', 'atom', 'result'],
  ): Promise<[list: TaskEntity[], total: number]> {
    const parentTask = await this.getById(parentTaskId, creatorId);

    const where = {
      where: { parentTask: pick(parentTask, 'id'), creatorId },
    };

    const total = await this.repo.count(where);
    const list = await this.repo.find({
      ...where,
      order: {
        id: 'DESC',
      },
      take: pagination.perPage,
      skip: (pagination.page - 1) * pagination.perPage,
      relations,
    });

    return [list, total];
  }

  async update(id: number, creatorId: string, data: TaskUpdateDTO) {
    const entity = await this.getById(id, creatorId);
    let updated = false;

    if (!entity) {
      throw new NotFoundError(`Task ${id}`);
    }

    if (!isNil(data.status)) {
      entity.status = data.status;
      updated = true;
    }

    if (!isNil(data.resultId)) {
      const resultEntity = await this.taskResultRepo.getById(
        data.resultId,
        creatorId,
      );

      if (!resultEntity) {
        throw new NotFoundError(`TaskResult ${data.resultId}`);
      }

      entity.result = resultEntity;
      updated = true;
    }

    return updated ? this.repo.save(entity) : entity;
  }
}
