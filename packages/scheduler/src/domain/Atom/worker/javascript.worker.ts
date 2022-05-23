import { Injectable } from '@nestjs/common';
import { validate } from 'class-validator';
import * as vm from 'vm';
import { WorkerTaskResult } from '@/domain/Task/dto/TaskResult.dto';
import { AtomEntity } from '../entity/atom.entity';
import { AtomExecuteOptions, AtomWorker } from './base-worker';
import { isFunction } from 'lodash';
import { ValidationError } from 'common-errors';

@Injectable()
export class JavaScriptAtomWorker implements AtomWorker {
  async execute<T, K = unknown>(
    atomEntity: AtomEntity,
    payload: T,
    options?: AtomExecuteOptions,
  ): Promise<WorkerTaskResult<K>> {
    try {
      const url = new URL(atomEntity.connectUrl);
      const encodedCode = url.hostname;
      const jsCode = Buffer.from(encodedCode, 'base64').toString();

      const vmScript = new vm.Script(jsCode);

      const context = vm.createContext({
        module: {},
        require,
        console,
      });

      vmScript.runInContext(context);

      if (!isFunction(context.module.exports)) {
        throw new ValidationError(
          'JavaScript Code should exports a function through module.exports',
        );
        // TODO: add a document link to the error message
      }

      const func = context.module.exports;
      const reply: WorkerTaskResult<K> = await Promise.resolve(
        func(payload, options, {
          createResult: WorkerTaskResult.create,
          triggerNextAtom: WorkerTaskResult.triggerNextAtom,
        }),
      );

      const validation = WorkerTaskResult.is(reply) && validate(reply);

      if (!validation) {
        throw new ValidationError(
          'JavaScript Code should return a WorkerTaskResult by api.createResult',
        );
      }

      return reply;
    } catch (err) {
      const reply = new WorkerTaskResult<K>();
      reply.success = false;
      return reply;
    }
  }
}
