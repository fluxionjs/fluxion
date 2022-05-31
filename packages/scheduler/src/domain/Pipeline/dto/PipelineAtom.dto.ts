import {
  IsOptional,
  IsArray,
  IsString,
  Validate,
  IsNotEmpty,
  IsInt,
  IsPositive,
} from 'class-validator';
import { isUrl } from '@/domain/Atom/dto/Atom.dto';

export class PipelineAtomCreateDTO {
  @IsInt()
  @IsPositive()
  @IsOptional()
  parentAtomId?: number;

  @IsInt()
  @IsPositive()
  pipelineId: number;

  @IsInt()
  @IsPositive()
  atomId: number;

  @IsString()
  @Validate(isUrl)
  @IsNotEmpty()
  @IsOptional()
  inputMappingCode?: string;

  @IsString()
  @Validate(isUrl)
  @IsNotEmpty()
  @IsOptional()
  outputMappingCode?: string;
}

export class PipelineAtomBatchCreateDTO {
  @IsInt()
  @IsPositive()
  @IsOptional()
  pipelineId?: number;

  @IsInt()
  @IsPositive()
  atomId: number;

  @IsString()
  @Validate(isUrl)
  @IsNotEmpty()
  @IsOptional()
  inputMappingCode?: string;

  @IsString()
  @Validate(isUrl)
  @IsNotEmpty()
  @IsOptional()
  outputMappingCode?: string;

  @IsArray()
  @IsOptional()
  nextAtoms?: PipelineAtomBatchCreateDTO[];
}

export class PipelineQueryDTO {
  @IsInt()
  @IsPositive()
  @IsOptional()
  parentAtomId?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  pipelineId?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  atomId?: number;
}

export class PipelineAtomUpdateDTO {
  @IsInt()
  @IsPositive()
  @IsOptional()
  parentAtomId?: number;

  @IsString()
  @Validate(isUrl)
  @IsNotEmpty()
  @IsOptional()
  inputMappingCode?: string;

  @IsString()
  @Validate(isUrl)
  @IsNotEmpty()
  @IsOptional()
  outputMappingCode?: string;
}
