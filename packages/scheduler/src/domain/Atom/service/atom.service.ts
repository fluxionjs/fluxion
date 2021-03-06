import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { AtomCreateDTO, AtomQueryDTO, AtomUpdateDTO } from '../dto/Atom.dto';
import { AtomEntity } from '../entity/atom.entity';
import { AtomRepository } from '../repo/atom.repository';
import { defaultPagination } from '@/utils/orm';
import { AtomWorkerService } from './atom-worker.service';
import { AtomExecuteOptions } from '../worker/base-worker';

@Injectable()
export class AtomService {
  constructor(
    private repo: AtomRepository,
    @Inject(forwardRef(() => AtomWorkerService))
    private atomWorkerService: AtomWorkerService,
  ) {}

  async create(data: AtomCreateDTO, userId: string) {
    const entity = AtomEntity.create({ ...data, creatorId: userId });
    return this.repo.save(entity);
  }

  async update(id: number, userId: string, data: AtomUpdateDTO) {
    return this.repo.update(id, userId, data);
  }

  async getById(id: number, userId: string) {
    return this.repo.getById(id, userId);
  }

  async getByName(name: string, userId: string) {
    return this.repo.getByName(name, userId);
  }

  async findByQuery(
    query: AtomQueryDTO,
    creatorId: string,
    pagination = defaultPagination,
  ) {
    return this.repo.findByQuery(query, creatorId, pagination);
  }

  async enable(id: number, userId: string) {
    return this.repo.enable(id, userId);
  }

  async disable(id: number, userId: string) {
    return this.repo.disable(id, userId);
  }

  async execute<T>(entity: AtomEntity, input: T, options?: AtomExecuteOptions) {
    return this.atomWorkerService.execute(entity, input, options);
  }
}
