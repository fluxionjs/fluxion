import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isNil, isBoolean, isString } from 'lodash';
import { AtomQueryDTO, AtomUpdateDTO } from '../dto/Atom.dto';
import { AtomEntity } from '../entity/atom.entity';
import { Pagination } from '@/utils/orm';
import { NotFoundError } from 'common-errors';

@Injectable()
export class AtomRepository {
  constructor(
    @InjectRepository(AtomEntity)
    private repo: Repository<AtomEntity>,
  ) {}

  async save(entity: AtomEntity) {
    return this.repo.save(entity);
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

  async update(id: number, creatorId: string, data: AtomUpdateDTO) {
    const entity = await this.getById(id, creatorId);
    if (!entity) {
      throw new NotFoundError(`Atom ${id}`);
    }

    if (!isNil(data.connectUrl)) {
      entity.connectUrl = data.connectUrl;
    }

    if (!isNil(data.description)) {
      entity.description = data.description;
    }

    if (!isNil(data.enabled)) {
      entity.enabled = data.enabled;
    }

    if (!isNil(data.name)) {
      entity.name = data.name;
    }

    return this.save(entity);
  }

  async findByCreatorId(
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: AtomEntity[], total: number]> {
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
    query: AtomQueryDTO,
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: AtomEntity[], total: number]> {
    const builder = this.repo.createQueryBuilder();
    builder.andWhere('creator_id = :creatorId', { creatorId });

    if (query.name) {
      builder.andWhere('name LIKE :name', { name: `%${query.name}%` });
    }

    if (query.protocol) {
      builder.andWhere('connect_url LIKE :protocol', {
        protocol: `${query.protocol}%`,
      });
    }

    if (!isNil(query.enabled)) {
      builder.andWhere('enabled = :enabled', {
        enabled:
          (isBoolean(query.enabled) && query.enabled) ||
          (isString(query.enabled) && query.enabled === 'true'),
      });
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
