import { TaskStatus } from './Task.dto';

export interface TaskResultCreateDTO<T = unknown> {
  taskId: number;
  status: TaskStatus;
  content: T;
  creatorId: string;
}
