import { WorkerTaskResult } from '@/domain/Task/dto/TaskResult.dto';
import { AtomEntity } from '../entity/atom.entity';

export interface AtomExecuteOptions {
  userId?: string;
  pipelineTaskId?: number;
}

export abstract class AtomWorker {
  abstract execute<T, K = unknown>(
    atomEntity: AtomEntity,
    payload: T,
    options?: AtomExecuteOptions,
  ): Promise<WorkerTaskResult<K>>;
}
