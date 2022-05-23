import { IsOptional, IsNumber, Min } from 'class-validator';

export class PipelineAtomCreateDTO {
  @IsNumber()
  @Min(1)
  @IsOptional()
  parentAtomId?: number;

  @IsNumber()
  @Min(1)
  pipelineId: number;

  @IsNumber()
  @Min(1)
  atomId: number;
}

export class PipelineQueryDTO {
  @IsNumber()
  @Min(1)
  @IsOptional()
  parentAtomId?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  pipelineId?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  atomId?: number;
}

export class PipelineAtomUpdateDTO {
  @IsNumber()
  @Min(1)
  @IsOptional()
  parentAtomId?: number;
}
