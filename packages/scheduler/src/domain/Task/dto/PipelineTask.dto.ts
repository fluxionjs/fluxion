import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { TaskStatus } from './Task.dto';

export class PipelineTaskCreateDTO {
  @IsNumber()
  @Min(1)
  pipelineId: number;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  @IsNumber()
  @Min(1)
  @IsOptional()
  rootTaskId?: number;
}

export class PipelineTaskUpdateDTO {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsNumber()
  @IsOptional()
  rootTaskId?: number;
}
