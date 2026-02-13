/**
 * Task Service
 *
 * Handles task business logic:
 * - Task CRUD operations
 * - Task ownership validation
 * - Label assignment
 * - Status transitions
 */

import { Task } from '../models/task.entity';
import { TaskStatus } from '../../../../libs/shared-types/src/models/task.interface';
import { TaskRepository } from '../repositories/task.repository';
import { LabelRepository } from '../repositories/label.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { BaseService } from './base.service';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task.dto';
import { AppError } from '../middleware/error-handler';

export class TaskService extends BaseService<Task> {
  constructor(
    private taskRepository: TaskRepository,
    private labelRepository: LabelRepository,
    private projectRepository: ProjectRepository
  ) {
    super(taskRepository as any);
  }

  /**
   * Create a new task with optional labels
   */
  async createTask(createDto: CreateTaskDto, userId: string): Promise<Task> {
    const { title, description, status, dueDate, projectId, labelIds } = createDto;

    // Validate project exists and user owns it
    const project = await this.projectRepository.findOne({ id: projectId });
    if (!project || project.ownerId !== userId) {
      throw new AppError(403, 'Access denied to project', 'Forbidden');
    }

    // Validate labels exist and belong to project
    if (labelIds && labelIds.length > 0) {
      await this.validateLabels(labelIds, projectId, userId);
    }

    // Create task with default status
    const taskData: any = {
      title,
      description: description || null,
      status: status || TaskStatus.BACKLOG,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      completedAt: null,
    };

    await this.validateCreate(taskData);

    const task = await this.taskRepository.create(taskData);

    // Assign labels if provided
    if (labelIds && labelIds.length > 0) {
      await this.assignLabelsToTask(task.id, labelIds);
    }

    await this.afterCreate(task);

    return task;
  }

  /**
   * Update an existing task
   */
  async updateTask(taskId: string, updateDto: UpdateTaskDto, userId: string): Promise<Task> {
    const { title, description, status, dueDate, labelIds } = updateDto;

    // Get existing task and validate ownership
    await this.validateOwnership(taskId, userId);

    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (status !== undefined) {
      // Validate status transition
      this.validateStatusTransition(status);
      updateData.status = status;

      // Set completedAt when moving to Done
      if (status === TaskStatus.DONE) {
        updateData.completedAt = new Date();
      }
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    await this.validateUpdate(taskId, updateData);

    const task = await this.taskRepository.update(taskId, updateData);

    // Update labels if provided
    if (labelIds !== undefined) {
      const existingTask = await this.taskRepository.getRepository().findOne({
        where: { id: taskId },
        relations: ['project'],
      });

      if (existingTask) {
        await this.assignLabelsToTask(taskId, labelIds);
      }
    }

    await this.afterUpdate(task);

    return task;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    await this.validateOwnership(taskId, userId);
    await this.validateDelete(taskId);

    // Remove label associations first
    await this.taskRepository.getRepository()
      .createQueryBuilder()
      .delete()
      .from('task_labels_label')
      .where('taskId = :taskId', { taskId })
      .execute();

    await this.taskRepository.delete(taskId);

    await this.afterDelete(taskId);
  }

  /**
   * Find task by ID with ownership check
   */
  async findById(taskId: string, userId: string): Promise<Task | null> {
    const task = await this.taskRepository.findOne({ id: taskId });

    if (!task) {
      return null;
    }

    // Check if user owns the task through project ownership
    const project = await this.projectRepository.findOne({ id: task.projectId });

    if (project && project.ownerId === userId) {
      return task;
    }

    return null;
  }

  /**
   * Find tasks by project ID with ownership check and optional status filter
   */
  async findByProjectId(
    projectId: string,
    userId: string,
    status?: TaskStatus
  ): Promise<Task[]> {
    // Verify user owns project
    const project = await this.projectRepository.findOne({ id: projectId });

    if (!project || project.ownerId !== userId) {
      throw new AppError(403, 'Access denied', 'Forbidden');
    }

    const result = await this.taskRepository.findByProjectId(projectId, { status });
    return result.data;
  }

  /**
   * Assign labels to a task
   */
  private async assignLabelsToTask(taskId: string, labelIds: string[]): Promise<void> {
    // First, remove existing label associations
    await this.taskRepository.getRepository()
      .createQueryBuilder()
      .delete()
      .from('task_labels_label')
      .where('taskId = :taskId', { taskId })
      .execute();

    // Then add new associations
    if (labelIds.length > 0) {
      const values = labelIds.map(labelId => `('${taskId}', '${labelId}')`).join(',');
      const query = `
        INSERT INTO task_labels_label ("taskId", "labelId")
        VALUES ${values}
      `;

      await this.taskRepository.getRepository().query(query);
    }
  }

  /**
   * Validate that labels exist and belong to the project
   */
  private async validateLabels(labelIds: string[], projectId: string, userId: string): Promise<void> {
    // Verify project ownership
    const project = await this.projectRepository.findOne({ id: projectId });

    if (!project || project.ownerId !== userId) {
      throw new AppError(403, 'Access denied', 'Forbidden');
    }

    // Verify all labels exist and belong to the project
    for (const labelId of labelIds) {
      const label = await this.labelRepository.findOne({ id: labelId });

      if (!label) {
        throw new AppError(400, `Label ${labelId} not found`, 'ValidationError');
      }

      if (label.projectId !== projectId) {
        throw new AppError(400, `Label ${labelId} does not belong to project`, 'ValidationError');
      }
    }
  }

  /**
   * Validate status transition (allows any transition including backward)
   */
  private validateStatusTransition(_newStatus: TaskStatus): void {
    // All status transitions are allowed including backward movement
    // No validation needed based on spec FR-024
  }

  /**
   * Validate task ownership through project ownership
   */
  async validateOwnership(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepository.findOne({ id: taskId });

    if (!task) {
      throw new AppError(404, 'Task not found', 'NotFound');
    }

    const project = await this.projectRepository.findOne({ id: task.projectId });

    if (!project || project.ownerId !== userId) {
      throw new AppError(403, 'Access denied', 'Forbidden');
    }
  }
}
