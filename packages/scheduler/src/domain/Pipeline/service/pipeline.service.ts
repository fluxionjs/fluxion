import { Injectable } from '@nestjs/common';
import { defaultPagination } from '@/utils/orm';
import {
  PipelineCreateDTO,
  PipelineQueryDTO,
  PipelineUpdateDTO,
} from '../dto/Pipeline.dto';
import { PipelineEntity } from '../entity/pipeline.entity';
import { PipelineRepository } from '../repo/pipeline.repository';

@Injectable()
export class PipelineService {
  constructor(private repo: PipelineRepository) {}

  async create(data: PipelineCreateDTO) {
    const entity = PipelineEntity.create(data);
    return this.repo.save(entity);
  }

  async getById(id: number, creatorId: string) {
    return this.repo.getById(id, creatorId);
  }

  async getByName(name: string, creatorId: string) {
    return this.repo.getByName(name, creatorId);
  }

  async findByQuery(
    query: PipelineQueryDTO,
    creatorId: string,
    pagination = defaultPagination,
  ) {
    return this.repo.findByQuery(query, creatorId, pagination);
  }

  async enable(id: number, creatorId: string) {
    return this.repo.enable(id, creatorId);
  }

  async disable(id: number, creatorId: string) {
    return this.repo.disable(id, creatorId);
  }

  async update(id: number, creatorId: string, data: PipelineUpdateDTO) {
    return this.repo.update(id, creatorId, data);
  }
}
