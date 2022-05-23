import { Transform } from 'class-transformer';
import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { transformBool } from '@/utils/dto';

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

export class PipelineQueryDTO {
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
}
