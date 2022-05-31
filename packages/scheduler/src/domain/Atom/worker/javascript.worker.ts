import { Injectable } from '@nestjs/common';
import { validate } from 'class-validator';
import { NodeVM } from 'vm2';
import { WorkerTaskResult } from '@/domain/Task/dto/TaskResult.dto';
import { AtomEntity } from '../entity/atom.entity';
import { AtomExecuteOptions, AtomWorker } from './base-worker';
import { isFunction } from 'lodash';
import { ValidationError } from 'common-errors';

function isESModule(mod) {
  return mod.__esModule;
}

@Injectable()
export class JavaScriptAtomWorker implements AtomWorker {
  async execute<T, K = unknown>(
    atomEntity: AtomEntity,
    input: T,
    options?: AtomExecuteOptions,
  ): Promise<WorkerTaskResult<K>> {
    try {
      const url = new URL(atomEntity.connectUrl);
      const encodedCode = url.hostname;
      const jsCode = Buffer.from(encodedCode, 'base64').toString();

      const vm = new NodeVM({
        console: 'off',
        sandbox: {},
        require: {
          root: './',
          builtin: [
            'crypto',
            'events',
            'path',
            'url',
            'querystring',
            'util',
            'zlib',
          ],
          external: ['lodash'],
        },
        timeout: 1000,
      });

      let atomFunc = vm.run(jsCode, 'atom.js');

      if (isESModule(atomFunc)) {
        atomFunc = atomFunc.default;
      }

      if (!isFunction(atomFunc)) {
        throw new ValidationError(
          'JavaScript Code should exports a function through module.exports',
        );
        // TODO: add a document link to the error message
      }

      const reply: WorkerTaskResult<K> = await Promise.resolve(
        atomFunc(input, options, {
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
