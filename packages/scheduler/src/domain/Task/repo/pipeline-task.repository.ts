import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { NotFoundError } from 'common-errors';
import { PipelineTaskEntity } from '../entity/PipelineTask';
import { AtomRepository } from '@/domain/Atom/repo/atom.repository';
import { PipelineRepository } from '@/domain/Pipeline/repo/pipeline.repository';
import { Pagination } from '@/utils/orm';

@Injectable()
export class PipelineTaskRepository {
  constructor(
    @InjectRepository(PipelineTaskEntity)
    private repo: Repository<PipelineTaskEntity>,
    private atomRepo: AtomRepository,
    private pipelineRepo: PipelineRepository,
  ) {}

  async save(entity: PipelineTaskEntity) {
    return this.repo.save(entity);
  }

  async getById(id: number, creatorId: string) {
    return this.repo.findOne({
      where: { id, creatorId },
      relations: ['pipeline', 'rootTask'],
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

  // TODO: update
}
