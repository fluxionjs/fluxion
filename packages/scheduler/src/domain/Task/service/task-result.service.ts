import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { NotFoundError } from 'common-errors';
import { defaultPagination } from '@/utils/orm';
import { TaskResultCreateDTO } from '../dto/TaskResult.dto';
import { TaskResultEntity } from '../entity/TaskResult';
import { TaskResultRepository } from '../repo/task-result.repository';
import { TaskService } from './task.service';

@Injectable()
export class TaskResultService {
  constructor(
    private repo: TaskResultRepository,
    @Inject(forwardRef(() => TaskService))
    private taskService: TaskService,
  ) {}

  async create<T>(data: TaskResultCreateDTO<T>) {
    const taskEntity = await this.taskService.getById(
      data.taskId,
      data.creatorId,
    );

    if (!taskEntity) {
      throw new NotFoundError(`Task ${data.taskId}`);
    }

    const entity = TaskResultEntity.create({
      task: taskEntity,
      status: data.status,
      content: data.content,
      creatorId: data.creatorId,
    });

    return this.repo.save(entity);
  }

  async getById(id: number, creatorId: string) {
    return this.repo.getById(id, creatorId);
  }

  async getByIds(ids: number[], creatorId: string) {
    return this.repo.getByIds(ids, creatorId);
  }

  async getByTask(taskId: number, creatorId: string) {
    return this.repo.getByTask(taskId, creatorId);
  }

  async findByCreatorId(creatorId: string, pagination = defaultPagination) {
    return this.repo.findByCreatorId(creatorId, pagination);
  }

  // TODO: update
}
