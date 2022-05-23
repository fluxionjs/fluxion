import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'common-errors';
import { defaultPagination } from '@/utils/orm';
import { TaskService } from './task.service';
import { PipelineTaskRepository } from '../repo/pipeline-task.repository';
import {
  PipelineTaskCreateDTO,
  PipelineTaskUpdateDTO,
} from '../dto/PipelineTask.dto';
import { PipelineService } from '@/domain/Pipeline/service/pipeline.service';
import { PipelineTaskEntity } from '../entity/pipeline-task.entity';
import { isNil } from 'lodash';

@Injectable()
export class PipelineTaskService {
  constructor(
    private repo: PipelineTaskRepository,
    private pipelineService: PipelineService,
    private taskService: TaskService,
  ) {}

  async create(data: PipelineTaskCreateDTO, creatorId: string) {
    const pipelineEntity = await this.pipelineService.getById(
      data.pipelineId,
      creatorId,
    );

    if (!pipelineEntity) {
      throw new NotFoundError(`Pipeline ${data.pipelineId}`);
    }

    const entity = PipelineTaskEntity.create({
      pipeline: pipelineEntity,
      status: data.status,
      rootTask: data.rootTaskId
        ? await this.pipelineService.getById(data.rootTaskId, creatorId)
        : null,
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

  async update(id: number, creatorId: string, data: PipelineTaskUpdateDTO) {
    const entity = await this.getById(id, creatorId);
    let updated = false;

    if (!entity) {
      throw new NotFoundError(`PipelineTask ${id}`);
    }

    if (!isNil(data.status)) {
      entity.status = data.status;
      updated = true;
    }

    if (!isNil(data.rootTaskId)) {
      const rootTaskEntity = await this.taskService.getById(
        data.rootTaskId,
        creatorId,
      );

      if (!rootTaskEntity) {
        throw new NotFoundError(`Task ${data.rootTaskId}`);
      }

      entity.rootTask = rootTaskEntity;
      updated = true;
    }

    return updated ? this.repo.save(entity) : entity;
  }
}
