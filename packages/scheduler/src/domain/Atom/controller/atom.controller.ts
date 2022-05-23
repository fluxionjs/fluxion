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
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { pick } from 'lodash';
import { ServiceResult } from '@/common/service-result.dto';
import { AtomCreateDTO, AtomQueryDTO } from '../dto/Atom.dto';
import { AtomService } from '../service/atom.service';
import { Pagination } from '@/utils/orm';
import { ParseInstance } from '@/utils/dto';
import { NotFoundError } from 'common-errors';

@ApiTags('atom')
@Controller('atom')
@UseInterceptors(ClassSerializerInterceptor)
export class AtomController {
  constructor(private atomService: AtomService) {}

  @MessagePattern('fluxion.atom.create')
  async create(
    @Payload('user-id') creatorId: string,
    @Payload('data', ParseInstance()) data: AtomCreateDTO,
  ) {
    try {
      const atomEntity = await this.atomService.create(data, creatorId);
      return ServiceResult.successful(atomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.atom.getAtom')
  async get(@Payload('id') id: number, @Payload('user-id') creatorId: string) {
    try {
      const atomEntity = await this.atomService.getById(id, creatorId);
      return ServiceResult.successful(atomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.atom.query')
  async query(
    @Payload('user-id') creatorId: string,
    @Payload(ParseInstance()) query: AtomQueryDTO,
  ) {
    const pagination: Pagination = pick(query, ['page', 'perPage']);
    const [list, total] = await this.atomService.findByQuery(
      query,
      creatorId,
      pagination,
    );

    return ServiceResult.successfuls(list, total, pagination.page || 1);
  }

  @MessagePattern('fluxion.atom.execute')
  async execute<T = unknown>(
    @Payload('id') id: number,
    @Payload('user-id') creatorId: string,
    @Payload('payload') payload: T,
  ) {
    const atomEntity = await this.atomService.getById(id, creatorId);
    if (!atomEntity) {
      return ServiceResult.failure(new NotFoundError(`Atom ${id}`));
    }

    try {
      const taskEntity = await this.atomService.execute(atomEntity, payload);
      return ServiceResult.successful(taskEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @Post()
  @ApiOperation({
    description: 'Create Atom',
  })
  async createHTTP(
    @Query('user-id') creatorId: string,
    @Body(ParseInstance()) data: AtomCreateDTO,
  ) {
    return this.create(creatorId, data);
  }

  @Get('/:id')
  async getHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
  ) {
    return this.get(id, creatorId);
  }

  @Get()
  @ApiOperation({
    description: 'Query atoms',
  })
  async queryHTTP(
    @Query('user-id') creatorId: string,
    @Query(ParseInstance()) query: AtomQueryDTO,
  ) {
    return this.query(creatorId, query);
  }

  @Post('/:id/execute')
  async executeHTTP<T = unknown>(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
    @Body('payload') payload: T,
  ) {
    return this.execute(id, creatorId, payload);
  }
}
