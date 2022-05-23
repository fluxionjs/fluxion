import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isBoolean, isNil } from 'lodash';
import { PipelineQueryDTO, PipelineUpdateDTO } from '../dto/Pipeline.dto';
import { PipelineEntity } from '../entity/pipeline.entity';
import { Pagination } from '@/utils/orm';
import { NotFoundError } from 'common-errors';

@Injectable()
export class PipelineRepository {
  constructor(
    @InjectRepository(PipelineEntity)
    private repo: Repository<PipelineEntity>,
  ) {}

  async save(entity: PipelineEntity) {
    return this.repo.save(entity);
  }

  async update(id: number, creatorId: string, data: PipelineUpdateDTO) {
    const entity = await this.getById(id, creatorId);
    let updated = false;

    if (!entity) {
      throw new NotFoundError(`Pipeline ${id}`);
    }

    if (!isNil(data.name)) {
      entity.name = data.name;
      updated = true;
    }

    if (!isNil(data.description)) {
      entity.description = data.description;
      updated = true;
    }

    if (isBoolean(data.enabled)) {
      entity.enabled = data.enabled;
      updated = true;
    }

    return updated ? this.save(entity) : entity;
  }

  async getById(id: number, creatorId: string) {
    return this.repo.findOne({
      where: { id, creatorId },
    });
  }

  async getByName(name: string, creatorId: string) {
    return this.repo.findOne({
      where: {
        name,
        creatorId,
      },
    });
  }

  async findByCreatorId(
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: PipelineEntity[], total: number]> {
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
    });

    return [list, total];
  }

  async findByQuery(
    query: PipelineQueryDTO,
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: PipelineEntity[], total: number]> {
    const builder = this.repo.createQueryBuilder();
    builder.andWhere('creator_id = :creatorId', { creatorId });

    if (query.name) {
      builder.andWhere('name LIKE :name', { name: `%${query.name}%` });
    }

    if (!isNil(query.enabled)) {
      builder.andWhere('enabled = :enabled', { enabled: query.enabled });
    }

    const total = await builder.getCount();

    builder.take(pagination.perPage);
    builder.skip((pagination.page - 1) * pagination.perPage);

    const list = await builder.getMany();

    return [list, total];
  }

  async enable(id: number, creatorId: string) {
    const entity = await this.getById(id, creatorId);
    entity.enabled = true;
    return this.save(entity);
  }

  async disable(id: number, creatorId: string) {
    const entity = await this.getById(id, creatorId);
    entity.enabled = false;
    return this.save(entity);
  }
}
