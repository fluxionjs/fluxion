import { WorkerTaskResult } from '@/domain/Task/dto/TaskResult.dto';
import { AtomEntity } from '../entity/atom.entity';

export interface AtomExecuteOptions<T = unknown, K = unknown> {
  userId?: string;
  parentAtomId?: number;
  parentTaskId?: number;
  output?: T;
  lastInput?: K;
  pipelineId?: number;
  pipelineTaskId?: number;
}

export abstract class AtomWorker {
  abstract execute<T, K = unknown>(
    atomEntity: AtomEntity,
    input: T,
    options?: AtomExecuteOptions,
  ): Promise<WorkerTaskResult<K>>;
}
