/**
 * Task Status Enum
 *
 * Represents the workflow stage of a task in Kanban board.
 * Tasks can move forward or backward through the workflow without restrictions.
 */

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export default TaskStatus;
