/**
 * Task Priority Enum
 *
 * Represents the priority level of a task.
 * Tasks default to MEDIUM priority if not specified.
 */

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export default TaskPriority;
