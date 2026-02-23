/**
 * Label Entity
 *
 * Represents a categorical tag for tasks within a project.
 * Labels are project-specific and can be system-defined or user-created.
 * NOTE: Task labels relationship temporarily removed for MVP simplification.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Generated,
} from 'typeorm';
import { Project } from './project.entity';

@Entity()
@Index(['projectId'])
@Index(['projectId', 'name'], { unique: true })
export class Label {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 7 })
  color!: string;

  @Column({ default: false })
  isSystemDefined!: boolean;

  @Column()
  projectId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => Project, (project) => project.labels)
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  /**
   * System-defined label constants
   * These labels are automatically seeded when a project is created.
   */
  static readonly SYSTEM_LABELS = [
    { name: 'Bug', color: '#FF0000' },
    { name: 'Feature', color: '#2196F3' },
    { name: 'Enhancement', color: '#4CAF50' },
    { name: 'Question', color: '#FF9800' },
  ];
}

export default Label;
