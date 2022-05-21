import { isString, isBoolean } from 'lodash';
import type { PipeTransform } from '@nestjs/common';
import { plainToInstance, ClassConstructor } from 'class-transformer';

export const ParseInstance = <T>(cls?: ClassConstructor<T>): PipeTransform => ({
  transform(value, metadata) {
    return plainToInstance(cls || metadata.metatype || Object, value);
  },
});

export function transformBool({ value }) {
  if (isString(value)) {
    return value === 'true';
  }

  if (isBoolean(value)) {
    return value;
  }

  return true;
}
