import { WorkerTaskResult } from '@/domain/Task/dto/TaskResult.dto';
import { Injectable } from '@nestjs/common';
import { AtomEntity } from '../entity/atom.entity';
import { AtomExecuteOptions, AtomWorker } from './base-worker';

@Injectable()
export class HttpAtomWorker implements AtomWorker {
  async execute<T, K = unknown>(
    atomEntity: AtomEntity,
    payload: T,
    options?: AtomExecuteOptions,
  ): Promise<WorkerTaskResult<K>> {
    const url = atomEntity.connectUrl;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          payload,
          options,
        }),
      });
      const reply: WorkerTaskResult<K> = await res.json();
      return reply;
    } catch (err) {
      const reply = new WorkerTaskResult<K>();
      reply.success = false;
      return reply;
    }
  }
}
