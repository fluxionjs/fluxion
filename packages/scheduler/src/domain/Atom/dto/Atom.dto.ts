import { Transform } from 'class-transformer';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  Validate,
} from 'class-validator';
import * as url from 'url';
import { Pagination } from '@/utils/orm';
import { transformBool } from '@/utils/dto';

export class AtomCreateDTO {
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

  @IsString()
  @Validate((val) => !!url.parse(val))
  @IsNotEmpty()
  connectUrl: string;
}

export class AtomQueryDTO extends Pagination {
  @IsString()
  @IsOptional()
  protocol?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(transformBool)
  enabled?: boolean;
}

export class AtomUpdateDTO {
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

  @IsString()
  @Validate((val) => !!url.parse(val))
  @IsNotEmpty()
  @IsOptional()
  connectUrl?: string;
}
