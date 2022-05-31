import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { NotFoundError, ValidationError } from 'common-errors';
import { PipelineAtomEntity } from '../entity/pipeline-atom.entity';
import { AtomRepository } from '@/domain/Atom/repo/atom.repository';
import { PipelineRepository } from './pipeline.repository';
import { Pagination } from '@/utils/orm';
import {
  PipelineAtomBatchCreateDTO,
  PipelineAtomUpdateDTO,
} from '../dto/PipelineAtom.dto';
import { isNil, isNumber, flatten } from 'lodash';
import { AtomEntity } from '@/domain/Atom/entity/atom.entity';

@Injectable()
export class PipelineAtomRepository {
  constructor(
    @InjectRepository(PipelineAtomEntity)
    private repo: Repository<PipelineAtomEntity>,
    @Inject(forwardRef(() => AtomRepository))
    private atomRepo: AtomRepository,
    @Inject(forwardRef(() => PipelineRepository))
    private pipelineRepo: PipelineRepository,
  ) {}

  async save(entity: PipelineAtomEntity) {
    return this.repo.save(entity);
  }

  async batchCreate(data: PipelineAtomBatchCreateDTO, creatorId: string) {
    const { pipelineId } = data;
    if (!isNumber(pipelineId) || pipelineId <= 0) {
      throw new ValidationError('pipelineId has to be positive');
    }

    const pipelineEntity = await this.pipelineRepo.getById(
      pipelineId,
      creatorId,
    );
    if (!pipelineEntity) {
      throw new NotFoundError(`Pipeline ${pipelineId}`);
    }

    async function inner(
      manager: EntityManager,
      createData: PipelineAtomBatchCreateDTO,
      parentAtom?: PipelineAtomEntity,
    ) {
      const pipelineAtomEntity = new PipelineAtomEntity();
      pipelineAtomEntity.inputMappingCode = createData.inputMappingCode;
      pipelineAtomEntity.outputMappingCode = createData.outputMappingCode;
      pipelineAtomEntity.creatorId = creatorId;

      if (!isNumber(createData.atomId) || createData.atomId <= 0) {
        throw new ValidationError('atomId has to be positive');
      }

      const atomEntity = await manager.findOneBy(AtomEntity, {
        id: createData.atomId,
      });
      if (!atomEntity) {
        throw new NotFoundError(`Atom ${createData.atomId}`);
      }

      pipelineAtomEntity.atom = atomEntity;
      pipelineAtomEntity.pipeline = pipelineEntity;

      if (parentAtom) {
        pipelineAtomEntity.parentAtom = parentAtom;
      }

      const savedPipelineAtomEntity = await manager.save(pipelineAtomEntity);
      let nextAtoms: PipelineAtomEntity[] = [];

      if (
        Array.isArray(createData.nextAtoms) &&
        createData.nextAtoms.length > 0
      ) {
        nextAtoms = flatten(
          await Promise.all(
            createData.nextAtoms.map(async (subData) => {
              return inner(manager, subData, savedPipelineAtomEntity);
            }),
          ),
        );
      }

      return [savedPipelineAtomEntity, ...nextAtoms];
    }

    const entities = await this.repo.manager.transaction(async (manager) =>
      inner(manager, data),
    );

    const rootAtomEntity = entities[0];

    return {
      root: rootAtomEntity,
      atoms: entities,
    };
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

  async getByAtom(atomId: number, pipelineId: number, creatorId: string) {
    const atomEntity = await this.atomRepo.getById(atomId, creatorId);
    if (!atomEntity) {
      throw new NotFoundError(`Atom ${atomId}`);
    }

    const pipelineEntity = await this.pipelineRepo.getById(
      pipelineId,
      creatorId,
    );
    if (!pipelineEntity) {
      throw new NotFoundError(`Pipeline ${pipelineId}`);
    }

    return this.repo.findOne({
      where: {
        atom: atomEntity,
        pipeline: pipelineEntity,
        creatorId,
      },
      relations: ['parentAtom', 'pipeline', 'atom'],
    });
  }

  async findByParentAtom(
    atomId: number,
    pipelineId: number,
    creatorId: string,
    pagination: Pagination,
  ): Promise<[list: PipelineAtomEntity[], total: number]> {
    const atomEntity = await this.getByAtom(atomId, pipelineId, creatorId);
    if (!atomEntity) {
      throw new NotFoundError(`Atom ${atomId}`);
    }

    const pipelineEntity = await this.pipelineRepo.getById(
      pipelineId,
      creatorId,
    );
    if (!pipelineEntity) {
      throw new NotFoundError(`Pipeline ${pipelineId}`);
    }

    const where = {
      where: {
        parentAtom: atomEntity,
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
