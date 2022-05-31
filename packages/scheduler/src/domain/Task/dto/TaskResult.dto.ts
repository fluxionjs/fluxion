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

  input: T;

  output: K | Error;
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
  input?: T;

  @IsBoolean()
  @IsOptional()
  only?: boolean;
}

export class WorkerTaskResult<T = unknown> {
  @IsBoolean()
  success: boolean;

  output: T | Error;

  @IsArray()
  @Type(() => NextAtomOption)
  @IsOptional()
  nextAtoms?: NextAtomOption[];

  static is(obj: unknown): obj is WorkerTaskResult {
    return obj instanceof WorkerTaskResult;
  }

  static create<T>(output: T, nextAtoms?: NextAtomOption[]);
  static create<T>(success: boolean, output: T, nextAtoms?: NextAtomOption[]);
  static create<T>(
    successOrOutput: boolean | T,
    outputOrNextAtoms: T | NextAtomOption[],
    nextAtoms?: NextAtomOption[],
  ) {
    const result = new WorkerTaskResult();

    if (isBoolean(successOrOutput)) {
      result.success = successOrOutput;
      result.output = outputOrNextAtoms;
      result.nextAtoms = nextAtoms;
    }

    if (!nextAtoms && isObject(successOrOutput)) {
      result.success = true;
      result.output = successOrOutput;
      if (Array.isArray(outputOrNextAtoms)) {
        result.nextAtoms = outputOrNextAtoms;
      }
    }

    return result;
  }

  static triggerNextAtom<T>(id: number, input: T): NextAtomOption<T>;
  static triggerNextAtom<T>(name: string, input: T): NextAtomOption<T>;
  static triggerNextAtom<T>(idOrName: number | string, input: T) {
    const opt = new NextAtomOption();
    opt.input = input;

    if (isNumber(idOrName)) {
      opt.atomId = idOrName;
    }

    if (isString(idOrName)) {
      opt.atomName = idOrName;
    }

    return opt;
  }
}
