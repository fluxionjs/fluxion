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
import { pick } from 'lodash';
import { ServiceResult } from '@/common/service-result.dto';
import { AtomCreateDTO, AtomQueryDTO, AtomUpdateDTO } from '../dto/Atom.dto';
import { AtomService } from '../service/atom.service';
import { Pagination } from '@/utils/orm';
import { ParseInstance } from '@/utils/dto';
import { NotFoundError } from 'common-errors';

@ApiTags('atom')
@Controller('/api/atom')
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

  @MessagePattern('fluxion.atom.update')
  async update(
    @Payload('id') id: number,
    @Payload('user-id') creatorId: string,
    @Payload('data', ParseInstance()) data: AtomUpdateDTO,
  ) {
    try {
      const atomEntity = await this.atomService.update(id, creatorId, data);
      return ServiceResult.successful(atomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.atom.getById')
  async get(@Payload('id') id: number, @Payload('user-id') creatorId: string) {
    try {
      const atomEntity = await this.atomService.getById(id, creatorId);
      return ServiceResult.successful(atomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.atom.getByName')
  async getByName(
    @Payload('name') name: string,
    @Payload('user-id') creatorId: string,
  ) {
    try {
      const atomEntity = await this.atomService.getByName(name, creatorId);
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

  @MessagePattern('fluxion.atom.enable')
  async enable(
    @Payload('id') id: number,
    @Payload('user-id') creatorId: string,
  ) {
    try {
      const atomEntity = await this.atomService.enable(id, creatorId);
      return ServiceResult.successful(atomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.atom.disable')
  async disable(
    @Payload('id') id: number,
    @Payload('user-id') creatorId: string,
  ) {
    try {
      const atomEntity = await this.atomService.disable(id, creatorId);
      return ServiceResult.successful(atomEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.atom.execute')
  async execute<T = unknown>(
    @Payload('id') id: number,
    @Payload('user-id') creatorId: string,
    @Payload('input') input: T,
  ) {
    const atomEntity = await this.atomService.getById(id, creatorId);
    if (!atomEntity) {
      return ServiceResult.failure(new NotFoundError(`Atom ${id}`));
    }

    try {
      const taskEntity = await this.atomService.execute(atomEntity, input);
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

  @Put('/:id')
  async updateHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
    @Body(ParseInstance()) data: AtomUpdateDTO,
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

  @Get('/name/:name')
  async getByNameHTTP(
    @Param('name') name: string,
    @Query('user-id') creatorId: string,
  ) {
    return this.getByName(name, creatorId);
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

  @Put('/:id')
  async enableHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
  ) {
    return this.enable(id, creatorId);
  }

  @Put('/:id')
  async disableHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
  ) {
    return this.disable(id, creatorId);
  }

  @Post('/:id/execute')
  async executeHTTP<T = unknown>(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
    @Body('input') input: T,
  ) {
    return this.execute(id, creatorId, input);
  }
}
