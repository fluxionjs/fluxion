import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { TaskCreateDTO, TaskStatus } from '../dto/Task.dto';
import { TaskRepository } from '../repo/task.repository';
import { AtomService } from '@/domain/Atom/service/atom.service';
import { ValidationError } from 'common-errors';
import { TaskEntity } from '../entity/Task';
import { defaultPagination } from '@/utils/orm';
import { TaskResultService } from './task-result.service';

@Injectable()
export class TaskService {
  constructor(
    private repo: TaskRepository,
    private atomService: AtomService,
    @Inject(forwardRef(() => TaskResultService))
    private taskResultService: TaskResultService,
  ) {}

  async create(data: TaskCreateDTO, creatorId: string) {
    const atomId = data.atomId;
    if (!atomId) {
      throw new ValidationError('Atom Id should be positive');
    }

    const atomEntity = await this.atomService.getById(atomId, creatorId);

    const entity = TaskEntity.create({
      atom: atomEntity,
      result: data.result
        ? await this.taskResultService.getById(data.result, creatorId)
        : null,
      status: TaskStatus.pending,
      creatorId,
    });

    return this.repo.save(entity);
  }

  async getById(id: number, creatorId: string) {
    return this.repo.getById(id, creatorId);
  }

  async getByIds(ids: number[], creatorId: string) {
    return this.repo.getByIds(ids, creatorId);
  }

  async findByAtom(
    atomId: number,
    creatorId: string,
    pagination = defaultPagination,
  ) {
    return this.repo.findByAtom(atomId, creatorId, pagination);
  }

  async findByCreatorId(creatorId: string, pagination = defaultPagination) {
    return this.repo.findByCreatorId(creatorId, pagination);
  }

  // TODO: update
}
