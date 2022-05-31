import { Transform } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  IsInstance,
} from 'class-validator';
import { transformBool } from '@/utils/dto';
import { Pagination } from '@/utils/orm';
import { PipelineAtomBatchCreateDTO } from './PipelineAtom.dto';

export class PipelineCreateDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(transformBool)
  enabled?: boolean;
}

export class PipelineAndAtomsCreateDTO {
  @IsInstance(PipelineCreateDTO)
  pipeline: PipelineCreateDTO;

  @IsInstance(PipelineAtomBatchCreateDTO)
  atoms: PipelineAtomBatchCreateDTO;
}

export class PipelineQueryDTO extends Pagination {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(transformBool)
  enabled?: boolean;
}

export class PipelineUpdateDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(transformBool)
  enabled?: boolean;

  @IsNumber()
  @Min(1)
  @IsOptional()
  rootAtomId?: number;
}
