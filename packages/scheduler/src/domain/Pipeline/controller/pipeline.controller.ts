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
  Inject,
  forwardRef,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { pick } from 'lodash';
import { ServiceResult } from '@/common/service-result.dto';
import {
  PipelineAndAtomsCreateDTO,
  PipelineCreateDTO,
  PipelineQueryDTO,
  PipelineUpdateDTO,
} from '../dto/Pipeline.dto';
import { PipelineService } from '../service/pipeline.service';
import { defaultPagination, Pagination } from '@/utils/orm';
import { ParseInstance } from '@/utils/dto';
import { NotFoundError } from 'common-errors';
import { PipelineTaskService } from '@/domain/Task/service/pipeline-task.service';

@ApiTags('pipeline')
@Controller('/api/pipeline')
@UseInterceptors(ClassSerializerInterceptor)
export class PipelineController {
  constructor(
    private pipelineService: PipelineService,
    @Inject(forwardRef(() => PipelineTaskService))
    private pipelineTaskService: PipelineTaskService,
  ) {}

  @MessagePattern('fluxion.pipeline.create')
  async create(
    @Payload('userId') creatorId: string,
    @Payload('data', ParseInstance()) data: PipelineCreateDTO,
  ) {
    try {
      const pipelineEntity = await this.pipelineService.create(data, creatorId);
      return ServiceResult.successful(pipelineEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipeline.createPipelineAndAtoms')
  async createPipelineAndAtoms(
    @Payload('userId') creatorId: string,
    @Payload('data', ParseInstance()) data: PipelineAndAtomsCreateDTO,
  ) {
    try {
      const result = await this.pipelineService.createPipelineAndAtoms(
        data,
        creatorId,
      );
      return ServiceResult.successful(result);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipeline.listTasks')
  async listTasks(
    @Payload('id') id: number,
    @Payload('userId') creatorId: string,
    @Payload('pagination', ParseInstance())
    pagination: Pagination = defaultPagination,
  ) {
    try {
      const [list, total] = await this.pipelineTaskService.findByPipeline(
        id,
        creatorId,
        pagination,
      );
      return ServiceResult.successfuls(list, total);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipeline.getTask')
  async getTask(
    @Payload('taskId') taskId: number,
    @Payload('userId') creatorId: string,
  ) {
    try {
      const pipelineTaskEntity = await this.pipelineTaskService.getById(
        taskId,
        creatorId,
        true,
      );
      return ServiceResult.successful(pipelineTaskEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipeline.update')
  async update(
    @Payload('id') id: number,
    @Payload('userId') creatorId: string,
    @Payload('data', ParseInstance()) data: PipelineUpdateDTO,
  ) {
    try {
      const pipelineEntity = await this.pipelineService.update(
        id,
        creatorId,
        data,
      );
      return ServiceResult.successful(pipelineEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipeline.getById')
  async get(@Payload('id') id: number, @Payload('userId') creatorId: string) {
    try {
      const pipelineEntity = await this.pipelineService.getById(id, creatorId);
      return ServiceResult.successful(pipelineEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipeline.getByName')
  async getByName(
    @Payload('name') name: string,
    @Payload('userId') creatorId: string,
  ) {
    try {
      const pipelineEntity = await this.pipelineService.getByName(
        name,
        creatorId,
      );
      return ServiceResult.successful(pipelineEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipeline.query')
  async query(
    @Payload('userId') creatorId: string,
    @Payload(ParseInstance()) query: PipelineQueryDTO,
  ) {
    const pagination: Pagination = pick(query, ['page', 'perPage']);
    const [list, total] = await this.pipelineService.findByQuery(
      query,
      creatorId,
      pagination,
    );

    return ServiceResult.successfuls(list, total, pagination.page || 1);
  }

  @MessagePattern('fluxion.pipeline.enable')
  async enable(
    @Payload('id') id: number,
    @Payload('userId') creatorId: string,
  ) {
    try {
      const pipelineEntity = await this.pipelineService.enable(id, creatorId);
      return ServiceResult.successful(pipelineEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipeline.disable')
  async disable(
    @Payload('id') id: number,
    @Payload('userId') creatorId: string,
  ) {
    try {
      const pipelineEntity = await this.pipelineService.disable(id, creatorId);
      return ServiceResult.successful(pipelineEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @MessagePattern('fluxion.pipeline.execute')
  async execute<T = unknown>(
    @Payload('id') id: number,
    @Payload('userId') creatorId: string,
    @Payload('input') input: T,
  ) {
    const pipelineEntity = await this.pipelineService.getById(id, creatorId);
    if (!pipelineEntity) {
      return ServiceResult.failure(new NotFoundError(`Pipeline ${id}`));
    }

    try {
      const taskEntity = await this.pipelineService.execute(
        id,
        creatorId,
        input,
      );
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
    @Body(ParseInstance()) data: PipelineCreateDTO,
  ) {
    return this.create(creatorId, data);
  }

  @Post('/batch')
  async createPipelineAndAtomsHTTP(
    @Query('user-id') creatorId: string,
    @Body(ParseInstance()) data: PipelineAndAtomsCreateDTO,
  ) {
    return this.createPipelineAndAtoms(creatorId, data);
  }

  @Put('/:id')
  async updateHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
    @Body(ParseInstance()) data: PipelineUpdateDTO,
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

  @Get('/:id/task')
  async listTasksHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Query('user-id') creatorId: string,
    @Query(ParseInstance()) pagination: Pagination,
  ) {
    return this.listTasks(id, creatorId, pagination);
  }

  @Get('/:id/task/:taskId')
  async getTaskHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query('user-id') creatorId: string,
  ) {
    return this.getTask(taskId, creatorId);
  }

  @Get()
  @ApiOperation({
    description: 'Query atoms',
  })
  async queryHTTP(
    @Query('user-id') creatorId: string,
    @Query(ParseInstance()) query: PipelineQueryDTO,
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
