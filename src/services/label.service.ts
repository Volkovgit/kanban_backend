/**
 * Label Service
 *
 * Handles label business logic:
 * - Label CRUD operations
 * - System-defined labels
 * - Label ownership validation
 * - Duplicate label prevention
 */

import { Label } from '../models/label.entity';
import { LabelRepository } from '../repositories/label.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { BaseService } from './base.service';
import { CreateLabelDto, UpdateLabelDto } from '../dto/label.dto';
import { AppError } from '../middleware/error-handler';

export class LabelService extends BaseService<Label> {
  constructor(
    private labelRepository: LabelRepository,
    private projectRepository: ProjectRepository
  ) {
    super(labelRepository as any);
  }

  /**
   * Create a new label
   */
  async createLabel(createDto: CreateLabelDto, userId: string): Promise<Label> {
    const { name, color, projectId } = createDto;

    // Validate project exists and user owns it
    await this.validateProjectOwnership(projectId, userId);

    // Check for duplicate label name in project
    const exists = await this.labelRepository.existsByNameInProject(projectId, name);

    if (exists) {
      throw new AppError(409, `Label '${name}' already exists in this project`, 'Conflict');
    }

    const labelData: any = {
      name,
      color,
      projectId,
      isSystemDefined: false,
    };

    await this.validateCreate(labelData);

    const label = await this.labelRepository.create(labelData);

    await this.afterCreate(label);

    return label;
  }

  /**
   * Update an existing label
   */
  async updateLabel(labelId: string, updateDto: UpdateLabelDto, userId: string): Promise<Label> {
    const { name, color } = updateDto;

    // Get existing label and validate ownership
    const existingLabel = await this.labelRepository.findById(labelId);
    await this.validateProjectOwnership(existingLabel.projectId, userId);

    const updateData: any = {};

    if (name !== undefined) {
      // Check for duplicate name if changing name
      if (name !== existingLabel.name) {
        const exists = await this.labelRepository.existsByNameInProject(
          existingLabel.projectId,
          name
        );

        if (exists) {
          throw new AppError(409, `Label '${name}' already exists in this project`, 'Conflict');
        }
      }

      updateData.name = name;
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    await this.validateUpdate(labelId, updateData);

    const label = await this.labelRepository.update(labelId, updateData);

    await this.afterUpdate(label);

    return label;
  }

  /**
   * Delete a label
   */
  async deleteLabel(labelId: string, userId: string): Promise<void> {
    // Get existing label and validate ownership
    const existingLabel = await this.labelRepository.findById(labelId);

    if (existingLabel.isSystemDefined) {
      throw new AppError(400, 'Cannot delete system-defined labels', 'ValidationError');
    }

    await this.validateProjectOwnership(existingLabel.projectId, userId);
    await this.validateDelete(labelId);

    await this.labelRepository.delete(labelId);

    await this.afterDelete(labelId);
  }

  /**
   * Find labels by project ID with ownership check
   */
  async findByProjectId(projectId: string, userId: string): Promise<Label[]> {
    // Verify user owns project
    await this.validateProjectOwnership(projectId, userId);

    return this.labelRepository.findByProjectId(projectId);
  }

  /**
   * Validate project ownership
   */
  private async validateProjectOwnership(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findOne({ id: projectId });

    if (!project) {
      throw new AppError(404, 'Project not found', 'NotFound');
    }

    if (project.ownerId !== userId) {
      throw new AppError(403, 'Access denied', 'Forbidden');
    }
  }
}
