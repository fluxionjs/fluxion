import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundError } from 'common-errors';
import { Pagination } from '@/utils/orm';
import { TaskResultEntity } from '../entity/task-result.entity';
import { TaskRepository } from './task.repository';

@Injectable()
export class TaskResultRepository {
  constructor(
    @InjectRepository(TaskResultEntity)
    private repo: Repository<TaskResultEntity>,
    @Inject(forwardRef(() => TaskRepository))
    private taskRepo: TaskRepository,
  ) {}

  async save(entity: TaskResultEntity) {
    return this.repo.save(entity);
  }

  async getById(id: number, creatorId: string) {
    return this.repo.findOne({
      where: { id, creatorId },
    });
  }

  async getByIds(ids: number[], creatorId: string) {
    return this.repo.find({
      where: {
        id: In(ids),
        creatorId,
      },
    });
  }

  async getByTask(taskId: number, creatorId: string) {
    const taskEntity = await this.taskRepo.getById(taskId, creatorId);

    if (!taskEntity) {
      throw new NotFoundError(`Task ${taskId}`);
    }

    return this.repo.findOneBy({
      task: taskEntity,
      creatorId,
    });
  }

  async findByCreatorId(
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: TaskResultEntity[], total: number]> {
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
      relations: ['task'],
    });

    return [list, total];
  }
}
