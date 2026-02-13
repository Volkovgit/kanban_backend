/**
 * User Entity
 *
 * Represents an authenticated person with unique credentials.
 * Each user owns multiple projects and has isolated data.
 */

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Generated } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Project } from './project.entity';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Exclude()
  @Column()
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships - cascade delete projects when user is deleted
  @OneToMany(() => Project, (project) => project.owner, { cascade: true })
  projects!: Project[];
}
