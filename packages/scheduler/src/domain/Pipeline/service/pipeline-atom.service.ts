import { Injectable } from '@nestjs/common';
import { defaultPagination } from '@/utils/orm';
import { AtomService } from '@/domain/Atom/service/atom.service';
import {
  PipelineAtomCreateDTO,
  PipelineAtomUpdateDTO,
} from '../dto/PipelineAtom.dto';
import { PipelineAtomEntity } from '../entity/pipeline-atom.entity';
import { PipelineAtomRepository } from '../repo/pipeline-atom.repository';
import { PipelineService } from './pipeline.service';

@Injectable()
export class PipelineAtomService {
  constructor(
    private repo: PipelineAtomRepository,
    private pipelineService: PipelineService,
    private atomService: AtomService,
  ) {}

  async create(data: PipelineAtomCreateDTO, creatorId: string) {
    const parentAtom = data.parentAtomId
      ? await this.getById(data.parentAtomId, creatorId)
      : null;
    const pipeline = data.pipelineId
      ? await this.pipelineService.getById(data.pipelineId, creatorId)
      : null;
    const atom = data.atomId
      ? await this.atomService.getById(data.atomId, creatorId)
      : null;

    const entity = PipelineAtomEntity.create({
      parentAtom,
      pipeline,
      atom,
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

  async getByAtom(atomId: number, creatorId: string) {
    return this.repo.getByAtom(atomId, creatorId);
  }

  async findByParentAtom(
    atomId: number,
    creatorId: string,
    pagination = defaultPagination,
  ) {
    return this.repo.findByParentAtom(atomId, creatorId, pagination);
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

  async update(id: number, creatorId: string, data: PipelineAtomUpdateDTO) {
    return this.repo.update(id, creatorId, data);
  }
}
