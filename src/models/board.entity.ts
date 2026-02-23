/**
 * Board Entity
 *
 * Represents a Kanban board that contains tasks.
 * Each board belongs to exactly one user (owner).
 * When a board is deleted, all its tasks are cascade deleted.
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Generated,
  Index,
} from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity()
@Index(['ownerId'])
export class Board {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id!: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column()
  ownerId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.boards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  // Relationships - cascade delete tasks when board is deleted
  @OneToMany(() => Task, (task) => task.board, { cascade: true })
  tasks!: Task[];
}

export default Board;
