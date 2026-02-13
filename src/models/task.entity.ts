/**
 * TaskStatus Enum
 *
 * Represents the workflow stage of a task.
 * Tasks can move forward or backward through the workflow.
 */

export enum TaskStatus {
  BACKLOG = 'Backlog',
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done',
}

/**
 * Task Entity
 *
 * Represents a work item with title, description, due date, labels, and status.
 * Each task belongs to exactly one project and can have multiple labels.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
  Generated,
} from 'typeorm';
import { Project } from './project.entity';
import { Label } from './label.entity';

@Entity()
@Index(['projectId'])
@Index(['status'])
@Index(['dueDate'])
@Index(['projectId', 'status'])
export class Task {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.BACKLOG,
  })
  status!: TaskStatus;

  @Column({ type: 'timestamp without time zone', nullable: true })
  dueDate!: Date;

  @Column()
  projectId!: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  completedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => Project, (project) => project.tasks)
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @ManyToMany(() => Label, (label) => label.tasks)
  @JoinTable({
    name: 'task_labels_label',
    joinColumn: {
      name: 'taskId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'labelId',
      referencedColumnName: 'id',
    },
  })
  labels!: Label[];
}
