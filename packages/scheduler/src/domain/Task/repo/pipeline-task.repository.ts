import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundError } from 'common-errors';
import { PipelineTaskEntity } from '../entity/pipeline-task.entity';
import { PipelineRepository } from '@/domain/Pipeline/repo/pipeline.repository';
import { Pagination } from '@/utils/orm';
import {
  NestAtomTask,
  PipelineTaskDTO,
  PipelineTaskUpdateDTO,
} from '../dto/PipelineTask.dto';
import { isNil } from 'lodash';
import { TaskRepository } from './task.repository';
import { TaskEntity } from '../entity/task.entity';

@Injectable()
export class PipelineTaskRepository {
  constructor(
    @InjectRepository(PipelineTaskEntity)
    private repo: Repository<PipelineTaskEntity>,
    @Inject(forwardRef(() => TaskRepository))
    private taskRepo: TaskRepository,
    private pipelineRepo: PipelineRepository,
  ) {}

  async save(entity: PipelineTaskEntity) {
    return this.repo.save(entity);
  }

  async getById(id: number, creatorId: string, loadTasks = false) {
    const pipelineTask: PipelineTaskDTO = await this.repo.findOne({
      where: { id, creatorId },
      relations: ['pipeline', 'rootTask'],
    });

    if (!loadTasks) {
      return pipelineTask;
    }

    const loadTask = async (taskEntity: TaskEntity): Promise<NestAtomTask> => {
      if (!taskEntity.result) {
        taskEntity = await this.taskRepo.getById(taskEntity.id, creatorId, [
          'atom',
          'result',
        ]);
      }
      const [nextAtomTasks] = await this.taskRepo.findByParentTask(
        taskEntity.id,
        creatorId,
        {
          page: 1,
          perPage: 100,
        },
        null,
      );
      return {
        ...taskEntity,
        nextTasks:
          nextAtomTasks && nextAtomTasks.length > 0
            ? await Promise.all(
                nextAtomTasks.map((nextTask) => loadTask(nextTask)),
              )
            : undefined,
      };
    };

    pipelineTask.rootTask = await loadTask(pipelineTask.rootTask);

    return pipelineTask;
  }

  async getByIds(ids: number[], creatorId: string) {
    return this.repo.find({
      where: {
        id: In(ids),
        creatorId,
      },
    });
  }

  async findByPipeline(
    pipelineId: number,
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: PipelineTaskEntity[], total: number]> {
    const pipelineEntity = await this.pipelineRepo.getById(
      pipelineId,
      creatorId,
    );

    if (!pipelineEntity) {
      throw new NotFoundError(`Pipeline ${pipelineId}`);
    }

    const where = {
      where: {
        pipeline: pipelineEntity,
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
      relations: ['rootTask'],
    });

    return [list, total];
  }

  async findByCreatorId(
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: PipelineTaskEntity[], total: number]> {
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
      relations: ['pipeline', 'rootTask'],
    });

    return [list, total];
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
      const rootTask = await this.taskRepo.getById(data.rootTaskId, creatorId);

      if (!rootTask) {
        throw new NotFoundError(`Task ${data.rootTaskId}`);
      }

      entity.rootTask = rootTask;
      updated = true;
    }

    return updated ? this.save(entity) : entity;
  }
}
