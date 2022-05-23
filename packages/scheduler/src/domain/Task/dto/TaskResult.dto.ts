import { Type } from 'class-transformer';
import { isString, isNumber, isBoolean, isObject } from 'lodash';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TaskStatus } from './Task.dto';

export class TaskResultCreateDTO<T = unknown, K = unknown> {
  @IsNumber()
  @Min(1)
  taskId: number;

  @IsEnum(TaskStatus)
  status: TaskStatus;

  payload: T;

  content: K | Error;
}

export class NextAtomOption<T = unknown> {
  @IsNumber()
  @Min(1)
  @IsOptional()
  atomId?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  atomName?: string;

  @IsObject()
  @IsNotEmpty()
  @IsOptional()
  payload?: T;
}

export class WorkerTaskResult<T = unknown> {
  @IsBoolean()
  success: boolean;

  payload: T | Error;

  @IsArray()
  @Type(() => NextAtomOption)
  @IsOptional()
  nextAtoms?: NextAtomOption[];

  static is(obj: unknown): obj is WorkerTaskResult {
    return obj instanceof WorkerTaskResult;
  }

  static create<T>(payload: T, nextAtoms?: NextAtomOption[]);
  static create<T>(success: boolean, payload: T, nextAtoms?: NextAtomOption[]);
  static create<T>(
    successOrPayload: boolean | T,
    payloadOrNextAtoms: T | NextAtomOption[],
    nextAtoms?: NextAtomOption[],
  ) {
    const result = new WorkerTaskResult();

    if (isBoolean(successOrPayload)) {
      result.success = successOrPayload;
      result.payload = payloadOrNextAtoms;
      result.nextAtoms = nextAtoms;
    }

    if (!nextAtoms && isObject(successOrPayload)) {
      result.success = true;
      result.payload = successOrPayload;
      if (Array.isArray(payloadOrNextAtoms)) {
        result.nextAtoms = payloadOrNextAtoms;
      }
    }

    return result;
  }

  static triggerNextAtom<T>(id: number, payload: T): NextAtomOption<T>;
  static triggerNextAtom<T>(name: string, payload: T): NextAtomOption<T>;
  static triggerNextAtom<T>(idOrName: number | string, payload: T) {
    const opt = new NextAtomOption();
    opt.payload = payload;

    if (isNumber(idOrName)) {
      opt.atomId = idOrName;
    }

    if (isString(idOrName)) {
      opt.atomName = idOrName;
    }

    return opt;
  }
}
