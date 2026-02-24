import { TaskStatus } from '../../enums/task-status.enum';
import { TaskPriority } from '../../enums/task-priority.enum';

/**
 * Task interface representing a work item
 */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
}
