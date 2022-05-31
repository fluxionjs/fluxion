import {
  Controller,
  Get,
  Query,
  ClassSerializerInterceptor,
  UseInterceptors,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceResult } from '@/common/service-result.dto';
import { PipelineAtomService } from '../service/pipeline-atom.service';
import { defaultPagination, Pagination } from '@/utils/orm';
import { ParseInstance } from '@/utils/dto';
import {
  PipelineAtomBatchCreateDTO,
  PipelineAtomCreateDTO,
  PipelineAtomUpdateDTO,
} from '../dto/PipelineAtom.dto';

@ApiTags('pipeline-atom')
@Controller('/api/pipeline-atom')
@UseInterceptors(ClassSerializerInterceptor)
export class PipelineAtomController {
  constructor(private pipelineAtomService: PipelineAtomService) {}

  @MessagePattern('fluxion.pipelineAtom.create')
  async create(
    @Payload('user-id') creatorId: string,
    @Payload('data', ParseInstance()) data: PipelineAtomCreateDTO,
  ) {
    try {
      const pipelineAtomEntity = await this.pipelineAtomService.create(
        data,
        creatorId,
      );
      return ServiceResult.successful(pipelineAtomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipelineAtom.batchCreate')
  async batchCreate(
    @Payload('user-id') creatorId: string,
    @Payload('data', ParseInstance()) data: PipelineAtomBatchCreateDTO,
  ) {
    try {
      const { atoms: pipelineAtomEntities } =
        await this.pipelineAtomService.batchCreate(data, creatorId);
      return ServiceResult.successfuls(
        pipelineAtomEntities,
        pipelineAtomEntities.length,
      );
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipelineAtom.update')
  async update(
    @Payload('id') id: number,
    @Payload('user-id') creatorId: string,
    @Payload('data', ParseInstance()) data: PipelineAtomUpdateDTO,
  ) {
    try {
      const pipelineAtomEntity = await this.pipelineAtomService.update(
        id,
        creatorId,
        data,
      );
      return ServiceResult.successful(pipelineAtomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipelineAtom.getById')
  async get(@Payload('id') id: number, @Payload('user-id') creatorId: string) {
    try {
      const pipelineAtomEntity = await this.pipelineAtomService.getById(
        id,
        creatorId,
      );
      return ServiceResult.successful(pipelineAtomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipelineAtom.getByIds')
  async getByIds(
    @Payload('ids') ids: number[],
    @Payload('user-id') creatorId: string,
  ) {
    try {
      const pipelineAtomEntity = await this.pipelineAtomService.getByIds(
        ids,
        creatorId,
      );
      return ServiceResult.successful(pipelineAtomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipelineAtom.getByAtom')
  async getByAtom(
    @Payload('atom-id') atomId: number,
    @Payload('pipeline-id') pipelineId: number,
    @Payload('user-id') creatorId: string,
  ) {
    try {
      const pipelineAtomEntity = await this.pipelineAtomService.getByAtom(
        atomId,
        pipelineId,
        creatorId,
      );
      return ServiceResult.successful(pipelineAtomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipelineAtom.findByParentAtom')
  async findByParentAtom(
    @Payload('atom-id') atomId: number,
    @Payload('pipeline-id') pipelineId: number,
    @Payload('user-id') creatorId: string,
    @Payload(ParseInstance()) pagination: Pagination = defaultPagination,
  ) {
    const [list, total] = await this.pipelineAtomService.findByParentAtom(
      atomId,
      pipelineId,
      creatorId,
      pagination,
    );

    return ServiceResult.successfuls(list, total, pagination.page || 1);
  }

  @MessagePattern('fluxion.pipelineAtom.findByPipeline')
  async findByPipeline(
    @Payload('pipeline-id') pipelineId: number,
    @Payload('user-id') creatorId: string,
    @Payload(ParseInstance()) pagination: Pagination = defaultPagination,
  ) {
    const [list, total] = await this.pipelineAtomService.findByPipeline(
      pipelineId,
      creatorId,
      pagination,
    );

    return ServiceResult.successfuls(list, total, pagination.page || 1);
  }

  @MessagePattern('fluxion.pipelineAtom.findByCreatorId')
  async findByCreatorId(
    @Payload('user-id') creatorId: string,
    @Payload(ParseInstance()) pagination: Pagination = defaultPagination,
  ) {
    const [list, total] = await this.pipelineAtomService.findByCreatorId(
      creatorId,
      pagination,
    );

    return ServiceResult.successfuls(list, total, pagination.page || 1);
  }

  @Post()
  @ApiOperation({
    description: 'Create Pipeline Atom',
  })
  async createHTTP(
    @Query('user-id') creatorId: string,
    @Body(ParseInstance()) data: PipelineAtomCreateDTO,
  ) {
    return this.create(creatorId, data);
  }

  @Post('/batch')
  async batchCreateHTTP(
    @Query('user-id') creatorId: string,
    @Body(ParseInstance()) data: PipelineAtomBatchCreateDTO,
  ) {
    return this.batchCreate(creatorId, data);
  }

  @Put('/:id')
  async updateHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
    @Body(ParseInstance()) data: PipelineAtomUpdateDTO,
  ) {
    return this.update(id, creatorId, data);
  }

  @Get('/:id')
  async getHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
  ) {
    return this.get(id, creatorId);
  }

  @Get('/pipeline/:pipelineId/atom/:atomId')
  async getByAtomHTTP(
    @Param('atomId', ParseIntPipe) atomId: number,
    @Param('pipelineId') pipelineId: number,
    @Query('user-id') creatorId: string,
  ) {
    return this.getByAtom(atomId, pipelineId, creatorId);
  }

  @Get('/pipeline/:pipelineId/parent/:atomId')
  async findByParentAtomHTTP(
    @Param('atomId', ParseIntPipe) atomId: number,
    @Param('pipelineId') pipelineId: number,
    @Query('user-id') creatorId: string,
    @Query(ParseInstance()) pagination: Pagination = defaultPagination,
  ) {
    return this.findByParentAtom(atomId, pipelineId, creatorId, pagination);
  }

  @Get('/pipeline/:pipelineId')
  async findByPipelineHTTP(
    @Param('pipelineId', ParseIntPipe) pipelineId: number,
    @Query('user-id') creatorId: string,
    @Query(ParseInstance()) pagination: Pagination = defaultPagination,
  ) {
    return this.findByPipeline(pipelineId, creatorId, pagination);
  }

  @Get('/creator/:creatorId')
  async findByCreatorHTTP(
    @Param('creatorId') creatorId: string,
    @Query(ParseInstance()) pagination: Pagination = defaultPagination,
  ) {
    return this.findByCreatorId(creatorId, pagination);
  }
}
