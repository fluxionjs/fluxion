import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotFoundError } from 'common-errors';
import { PipelineAtomEntity } from '../entity/pipeline-atom.entity';
import { AtomRepository } from '@/domain/Atom/repo/atom.repository';
import { PipelineRepository } from './pipeline.repository';
import { Pagination } from '@/utils/orm';
import { PipelineAtomUpdateDTO } from '../dto/PipelineAtom.dto';
import { isNil } from 'lodash';

@Injectable()
export class PipelineAtomRepository {
  constructor(
    @InjectRepository(PipelineAtomEntity)
    private repo: Repository<PipelineAtomEntity>,
  ) {}

  @Inject()
  atomRepo: AtomRepository;

  @Inject()
  pipelineRepo: PipelineRepository;

  async save(entity: PipelineAtomEntity) {
    return this.repo.save(entity);
  }

  async getById(id: number, creatorId: string) {
    return this.repo.findOne({
      where: { id, creatorId },
      relations: ['parentAtom', 'pipeline', 'atom'],
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

  async getByAtom(atomId: number, creatorId: string) {
    const atomEntity = await this.atomRepo.getById(atomId, creatorId);

    if (!atomEntity) {
      throw new NotFoundError(`Atom ${atomId}`);
    }

    return this.repo.findOne({
      where: {
        atom: atomEntity,
        creatorId,
      },
      relations: ['parentAtom', 'pipeline', 'atom'],
    });
  }

  async findByParentAtom(
    atomId: number,
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: PipelineAtomEntity[], total: number]> {
    const atomEntity = await this.atomRepo.getById(atomId, creatorId);

    if (!atomEntity) {
      throw new NotFoundError(`Atom ${atomId}`);
    }

    const where = {
      where: {
        parentAtom: atomEntity,
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
      relations: ['parentAtom', 'pipeline', 'atom'],
    });
    return [list, total];
  }

  async findByPipeline(
    pipelineId: number,
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: PipelineAtomEntity[], total: number]> {
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
      relations: ['parentAtom', 'atom'],
    });
    return [list, total];
  }

  async findByCreatorId(
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: PipelineAtomEntity[], total: number]> {
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
      relations: ['parentAtom', 'pipeline', 'atom'],
    });

    return [list, total];
  }

  async update(id: number, creatorId: string, data: PipelineAtomUpdateDTO) {
    const entity = await this.getById(id, creatorId);
    let updated = false;

    if (!entity) {
      throw new NotFoundError(`PipelineAtom ${id}`);
    }

    if (!isNil(data.parentAtomId)) {
      const parentAtom = await this.getById(data.parentAtomId, creatorId);

      if (!parentAtom) {
        throw new NotFoundError(`PipelineAtom ${data.parentAtomId}`);
      }

      entity.parentAtom = parentAtom;
      updated = true;
    }

    return updated ? this.save(entity) : entity;
  }
}
