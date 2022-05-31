import { NextAtomOption } from '@/domain/Task/dto/TaskResult.dto';

export class AtomExecuteStartEvent<T = unknown> {
  atomId: number;
  taskId: number;
  parentAtomId?: number;
  parentTaskId?: number;
  userId: string;
  input: T;
  pipelineId?: number;
  pipelineTaskId?: number;
}

export class AtomExecuteSuccessEvent<T = unknown, K = unknown> {
  atomId: number;
  taskId: number;
  input: T;
  output: K;
  userId: string;
  isExecutedByPipeline: boolean = false;
  pipelineId?: number;
  pipelineTaskId?: number;
  nextAtoms?: NextAtomOption[];
}

export class AtomExecuteFailedEvent<T = unknown> {
  atomId: number;
  taskId: number;
  userId: string;
  input: T;
  pipelineId?: number;
  pipelineTaskId?: number;
  output?: Error | string;
}
