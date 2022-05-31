import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { WorkerTaskResult } from '@/domain/Task/dto/TaskResult.dto';
import { AtomEntity } from '../entity/atom.entity';
import { AtomExecuteOptions, AtomWorker } from './base-worker';

@Injectable()
export class HttpAtomWorker implements AtomWorker {
  async execute<T, K = unknown>(
    atomEntity: AtomEntity,
    input: T,
    options?: AtomExecuteOptions,
  ): Promise<WorkerTaskResult<K>> {
    const url = atomEntity.connectUrl;

    try {
      const res = await axios.post<WorkerTaskResult<K>>(url, {
        input,
        options,
      });
      const reply = res.data;
      return reply;
    } catch (err) {
      const reply = new WorkerTaskResult<K>();
      reply.success = false;
      return reply;
    }
  }
}
