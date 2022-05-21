import { TaskStatus } from './Task.dto';

export interface PipelineTaskCreateDTO {
  pipelineId: number;
  status: TaskStatus;
  creatorId: string;
  rootTaskId?: number;
}

export interface PipelineTaskUpdateDTO {
  status?: TaskStatus;
  rootTaskId?: number;
}
