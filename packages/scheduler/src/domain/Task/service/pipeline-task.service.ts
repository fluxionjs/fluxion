import { Injectable } from '@nestjs/common';
import { NotFoundError } from 'common-errors';
import { defaultPagination } from '@/utils/orm';
import { TaskService } from './task.service';
import { PipelineTaskRepository } from '../repo/pipeline-task.repository';
import { PipelineTaskCreateDTO } from '../dto/PipelineTask.dto';
import { PipelineService } from '@/domain/Pipeline/service/pipeline.service';
import { PipelineTaskEntity } from '../entity/PipelineTask';

@Injectable()
export class PipelineTaskService {
  constructor(
    private repo: PipelineTaskRepository,
    private pipelineService: PipelineService,
    private taskService: TaskService,
  ) {}

  async create(data: PipelineTaskCreateDTO) {
    const pipelineEntity = await this.pipelineService.getById(
      data.pipelineId,
      data.creatorId,
    );

    if (!pipelineEntity) {
      throw new NotFoundError(`Pipeline ${data.pipelineId}`);
    }

    const entity = PipelineTaskEntity.create({
      pipeline: pipelineEntity,
      status: data.status,
      rootTask: data.rootTaskId
        ? await this.pipelineService.getById(data.rootTaskId, data.creatorId)
        : null,
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

  // TODO: update
}
