import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { TaskCreateDTO, TaskStatus, TaskUpdateDTO } from '../dto/Task.dto';
import { TaskRepository } from '../repo/task.repository';
import { AtomService } from '@/domain/Atom/service/atom.service';
import { NotFoundError, ValidationError } from 'common-errors';
import { TaskEntity } from '../entity/task.entity';
import { Pagination } from '@/utils/orm';
import { TaskResultService } from './task-result.service';
import { isNil } from 'lodash';
import { PipelineTaskService } from './pipeline-task.service';

@Injectable()
export class TaskService {
  constructor(
    private repo: TaskRepository,
    @Inject(forwardRef(() => AtomService))
    private atomService: AtomService,
    @Inject(forwardRef(() => TaskResultService))
    private taskResultService: TaskResultService,
    @Inject(forwardRef(() => PipelineTaskService))
    private pipelineTaskService: PipelineTaskService,
  ) {}

  async create(data: TaskCreateDTO, creatorId: string) {
    const atomId = data.atomId;
    if (!atomId) {
      throw new ValidationError('Atom Id should be positive');
    }

    const atomEntity = await this.atomService.getById(atomId, creatorId);
    const params: any = {
      atom: atomEntity,
      status: TaskStatus.pending,
      creatorId,
    };

    if (data.pipelineTaskId) {
      params.pipelineTask = await this.pipelineTaskService.getById(
        data.pipelineTaskId,
        creatorId,
      );
    }

    if (data.resultId) {
      params.result = await this.taskResultService.getById(
        data.resultId,
        creatorId,
      );
    }

    if (data.parentTaskId) {
      params.parentTask = await this.getById(data.parentTaskId, creatorId);
    }

    const entity = TaskEntity.create(params);

    return this.repo.save(entity);
  }

  async getById(id: number, creatorId: string) {
    return this.repo.getById(id, creatorId);
  }

  async getByIds(ids: number[], creatorId: string) {
    return this.repo.getByIds(ids, creatorId);
  }

  async findByAtom(atomId: number, creatorId: string, pagination: Pagination) {
    return this.repo.findByAtom(atomId, creatorId, pagination);
  }

  async findByCreatorId(creatorId: string, pagination: Pagination) {
    return this.repo.findByCreatorId(creatorId, pagination);
  }

  async findByParentTask(
    parentTaskId: number,
    creatorId: string,
    pagination: Pagination,
  ) {
    return this.repo.findByParentTask(parentTaskId, creatorId, pagination);
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
      const taskResultEntity = await this.taskResultService.getById(
        data.resultId,
        creatorId,
      );

      if (!taskResultEntity) {
        throw new NotFoundError(`TaskResult ${data.resultId}`);
      }

      entity.result = taskResultEntity;
      updated = true;
    }

    return updated ? this.repo.save(entity) : entity;
  }
}
