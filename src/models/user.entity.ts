/**
 * User Entity
 *
 * Represents an authenticated person with unique credentials.
 * Each user owns multiple boards and has isolated data.
 * Includes account lockout mechanism after failed login attempts.
 */

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Generated } from 'typeorm';
import { Exclude } from 'class-transformer';
// import { Project } from './project.entity';
import { Board } from './board.entity';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id!: string;

  /**
   * T007: Логин пользователя (уникальный)
   * Используется вместо email для аутентификации
   */
  @Column({ unique: true, length: 255 })
  login!: string;

  @Exclude()
  @Column()
  passwordHash!: string;

  /**
   * Количество неудачных попыток входа
   * Увеличивается при каждом неудачном логине, сбрасывается при успешном
   */
  @Column({ default: 0 })
  failedLoginAttempts!: number;

  /**
   * Timestamp до которого аккаунт заблокирован
   * null если аккаунт не заблокирован
   */
  @Column({ type: 'timestamp without time zone', nullable: true })
  lockedUntil!: Date | null;

  /**
   * Refresh токен для обновления access токена
   * Хранится в базе для инвалидации при logout
   */
  @Exclude()
  @Column({ type: 'text', nullable: true })
  refreshToken!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relationships - cascade delete projects when user is deleted
  // @OneToMany(() => Project, (project) => project.owner, { cascade: true })
  // projects!: Project[];

  // Relationships - cascade delete boards when user is deleted
  @OneToMany(() => Board, (board) => board.owner, { cascade: true })
  boards!: Board[];
}

export default User;
