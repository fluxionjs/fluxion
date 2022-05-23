import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';

export enum TaskStatus {
  pending,
  running,
  succeed,
  failed,
}

export class TaskCreateDTO {
  @IsNumber()
  @Min(1)
  atomId: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  pipelineTaskId?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  resultId?: number;

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
