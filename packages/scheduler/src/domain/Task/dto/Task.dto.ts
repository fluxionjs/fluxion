import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';

export enum TaskStatus {
  pending,
  running,
  succeed,
  failed,
}

export class TaskCreateDTO {
  @IsNumber()
  @IsPositive()
  atomId: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  pipelineTaskId?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  resultId?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  parentTaskId?: number;

  @IsEnum(TaskStatus)
  status: TaskStatus;
}

export class TaskUpdateDTO {
  @IsNumber()
  @IsOptional()
  resultId?: number;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
