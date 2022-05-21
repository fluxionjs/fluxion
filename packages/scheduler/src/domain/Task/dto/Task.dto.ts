export enum TaskStatus {
  pending,
  running,
  succeed,
  failed,
}

export interface TaskCreateDTO {
  atomId: number;
  pipelineTaskId?: number;
  result?: number;
  status: TaskStatus;
  creatorId: number;
}

export interface TaskUpdateDTO {
  resultId?: number;
  status?: TaskStatus;
}
