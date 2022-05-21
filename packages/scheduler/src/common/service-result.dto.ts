import { isError } from 'lodash';

export class ServiceResult<T> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
  };
  message?: string;
  stack?: string;

  static successful<T>(data: T) {
    const result = new ServiceResult<T>();
    result.success = true;
    result.data = data;
    return result;
  }

  static successfuls<T>(list: T[], total: number, page?: number) {
    const result = new ServiceResult<T[]>();
    result.success = true;
    result.data = list;
    result.meta = { total, page };
    return result;
  }

  static failure<T = any>(error: Error | string, stack?: string) {
    const result = new ServiceResult<T>();
    result.success = false;
    result.message = isError(error) ? error.message : error;
    result.stack = isError(error) ? error.stack : stack;
    return result;
  }
}
