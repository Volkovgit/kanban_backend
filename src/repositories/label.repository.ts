/**
 * Label Repository
 *
 * Handles data access for Label entities.
 * Extends BaseRepository with label-specific queries.
 */

import { DataSource } from 'typeorm';
import { Label } from '../models/label.entity';
import { BaseRepository } from './base.repository';

export class LabelRepository extends BaseRepository<Label> {
  constructor(dataSource: DataSource) {
    super(dataSource, Label);
  }

  /**
   * Find all labels for a specific project
   */
  async findByProjectId(projectId: string): Promise<Label[]> {
    return this.findMany({ projectId });
  }

  /**
   * Find label by name within a project
   */
  async findByName(projectId: string, name: string): Promise<Label | null> {
    return this.findOne({ projectId, name });
  }

  /**
   * Find system-defined labels
   */
  async findSystemDefined(): Promise<Label[]> {
    return this.findMany({ isSystemDefined: true });
  }

  /**
   * Check if label name exists in project
   */
  async existsByNameInProject(projectId: string, name: string): Promise<boolean> {
    return this.exists({ projectId, name });
  }
}
