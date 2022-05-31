import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { PipelineTaskEntity } from '../entity/pipeline-task.entity';
import { TaskEntity } from '../entity/task.entity';
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

export class NestAtomTask extends TaskEntity {
  nextTasks?: NestAtomTask[];
}

export class PipelineTaskDTO extends PipelineTaskEntity {
  rootTask: NestAtomTask;
}
