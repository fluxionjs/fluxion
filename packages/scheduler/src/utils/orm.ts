import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import * as dayjs from 'dayjs';

export const dateTransformer = {
  from: (value: string) => dayjs(value).toDate(),
  to: (value: Date) => dayjs(value).toISOString(),
};

export class Pagination {
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  perPage?: number = 20;

  static from<T = unknown>(data: T) {
    const dto = new Pagination();
    dto.page = data['page'] || 1;
    dto.perPage = data['perPage'] || 20;
    return dto;
  }
}

export const defaultPagination: Pagination = {
  page: 1,
  perPage: 20,
};
