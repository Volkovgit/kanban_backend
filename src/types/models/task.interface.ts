/**
 * TaskStatus enum representing workflow stages
 */
export enum TaskStatus {
  BACKLOG = 'Backlog',
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done'
}

/**
 * Task interface representing a work item
 */
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  projectId: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  labels?: Label[];
}

/**
 * Import Label interface locally to avoid circular dependency
 */
import { Label } from './label.interface';
