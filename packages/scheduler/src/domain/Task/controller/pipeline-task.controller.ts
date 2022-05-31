import {
  Controller,
  Get,
  Query,
  ClassSerializerInterceptor,
  UseInterceptors,
  Param,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { ServiceResult } from '@/common/service-result.dto';
import { PipelineTaskService } from '../service/pipeline-task.service';

@ApiTags('pipeline-task')
@Controller('/api/pipeline-task')
@UseInterceptors(ClassSerializerInterceptor)
export class PipelineTaskController {
  constructor(private pipelineTaskService: PipelineTaskService) {}

  @MessagePattern('fluxion.pipelineTask.getById')
  async getById(
    @Payload('id') id: number,
    @Payload('loadTasks') loadTasks: boolean,
    @Payload('userId') creatorId: string,
  ) {
    try {
      const pipelineTaskEntity = await this.pipelineTaskService.getById(
        id,
        creatorId,
        loadTasks,
      );
      return ServiceResult.successful(pipelineTaskEntity);
    } catch (err) {
      return ServiceResult.failure(err);
    }
  }

  @Get('/:id')
  async getByIdHTTP(
    @Param('id', ParseIntPipe) id: number,
    @Query('load-tasks', ParseBoolPipe) loadTasks: boolean,
    @Query('user-id') creatorId: string,
  ) {
    return this.getById(id, loadTasks, creatorId);
  }
}
