/**
 * Project Entity
 *
 * Represents a container for organizing related tasks.
 * Each project belongs to a specific user and contains tasks and labels.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Generated,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';
import { Label } from './label.entity';

@Entity()
@Index(['ownerId'])
export class Project {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column()
  ownerId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @OneToMany(() => Task, (task) => task.project)
  tasks!: Task[];

  @OneToMany(() => Label, (label) => label.project)
  labels!: Label[];
}
