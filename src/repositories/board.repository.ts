/**
 * Board Repository
 *
 * Handles data access for Board entities.
 * Extends BaseRepository with board-specific queries.
 */

import { FindOptionsWhere, DataSource } from 'typeorm';
import { Board } from '../models/board.entity';
import { BaseRepository } from './base.repository';

export class BoardRepository extends BaseRepository<Board> {
  constructor(dataSource: DataSource) {
    super(dataSource, Board);
  }

  /**
   * Find all boards for a specific owner
   */
  async findByOwner(
    ownerId: string,
    options?: { page?: number; pageSize?: number }
  ): Promise<any> {
    const where: FindOptionsWhere<Board> = { ownerId };
    const { page, pageSize } = options || {};

    if (page && pageSize) {
      return this.findAll({ page, pageSize });
    }

    const data = await this.findMany(where);
    return {
      data,
      total: data.length,
      page: 1,
      pageSize: data.length,
      totalPages: 1,
    };
  }

  /**
   * Count boards for a specific owner
   */
  async countByOwner(ownerId: string): Promise<number> {
    return this.count({ ownerId });
  }
}

export default BoardRepository;
