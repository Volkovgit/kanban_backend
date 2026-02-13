/**
 * Project Service
 *
 * Business logic for project operations.
 * Handles project CRUD operations with ownership validation.
 */

import { ProjectRepository } from '../repositories/project.repository';
import { UserRepository } from '../repositories/user.repository';
import { Project } from '../models/project.entity';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from '../dto/project.dto';
import { AppError } from '../middleware/error-handler';

/**
 * Input for creating a project directly (for internal use and testing)
 */
export interface CreateProjectInput {
  name: string;
  ownerId: string;
  description?: string | null;
}

/**
 * Pagination options for project listing
 */
export interface ProjectPaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Paginated project list result
 */
export interface ProjectPaginationResult {
  data: ProjectResponseDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Project service
 */
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private userRepository: UserRepository,
  ) {}

  /**
   * Create a new project (internal/testing API)
   * Accepts ownerId in the input object for direct creation
   * @param input - Project creation data with ownerId
   * @returns Created project
   * @throws AppError if validation fails
   */
  async createProject(input: CreateProjectInput): Promise<ProjectResponseDto>;
  /**
   * Create a new project (controller API)
   * Accepts userId separately for authenticated requests
   * @param userId - User ID who will own the project
   * @param createProjectDto - Project creation data
   * @returns Created project
   * @throws AppError if user not found or validation fails
   */
  async createProject(userId: string, createProjectDto: CreateProjectDto): Promise<ProjectResponseDto>;
  async createProject(
    userIdOrInput: string | CreateProjectInput,
    createProjectDto?: CreateProjectDto
  ): Promise<ProjectResponseDto> {
    let userId: string;
    let name: string;
    let description: string | null | undefined;

    // Handle overloaded signature
    if (typeof userIdOrInput === 'string') {
      // Controller API: userId is first param, dto is second
      userId = userIdOrInput;
      if (!createProjectDto) {
        throw new AppError(400, 'Project data is required', 'BadRequest');
      }
      name = createProjectDto.name;
      description = createProjectDto.description;

      // Verify user exists
      await this.userRepository.findById(userId);
    } else {
      // Internal/testing API: single object with ownerId
      userId = userIdOrInput.ownerId;
      name = userIdOrInput.name;
      description = userIdOrInput.description;
    }

    // Check if project name already exists for this user
    const nameExists = await this.projectRepository.nameExistsForUser(name, userId);

    if (nameExists) {
      throw new AppError(
        409,
        'A project with this name already exists',
        'Conflict'
      );
    }

    // Create the project
    const project = await this.projectRepository.createProject(
      name,
      description || null,
      userId
    );

    // Seed system-defined labels for the project
    await this.seedSystemLabels(project.id);

    return this.toProjectResponseDto(project);
  }

  /**
   * Find all projects belonging to a user (returns array - for testing/internal use)
   * @param userId - User ID (ownerId)
   * @returns Array of user's projects
   */
  async findAllByUserId(userId: string): Promise<ProjectResponseDto[]>;
  /**
   * Find all projects belonging to a user with pagination
   * @param userId - User ID (ownerId)
   * @param pagination - Pagination options
   * @returns Paginated list of user's projects
   */
  async findAllByUserId(
    userId: string,
    pagination: ProjectPaginationOptions
  ): Promise<ProjectPaginationResult>;
  async findAllByUserId(
    userId: string,
    pagination?: ProjectPaginationOptions
  ): Promise<ProjectResponseDto[] | ProjectPaginationResult> {
    if (!pagination) {
      // No pagination - return array (for testing/backward compatibility)
      const result = await this.projectRepository.findAllByUserId(userId);
      return result.data.map((p) => this.toProjectResponseDto(p));
    }

    // With pagination - return paginated result
    const page = pagination.page || 1;
    const pageSize = Math.min(pagination.pageSize || 20, 100);

    const result = await this.projectRepository.findAllByUserId(userId, {
      page,
      pageSize,
    });

    const totalPages = Math.ceil(result.total / pageSize);

    return {
      data: result.data.map((p) => this.toProjectResponseDto(p)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Find project by ID (without ownership check - for internal use)
   * @param id - Project ID
   * @returns Project if found
   * @throws AppError if project not found
   */
  async findById(id: string): Promise<ProjectResponseDto>;
  /**
   * Find project by ID with ownership verification
   * @param id - Project ID
   * @param userId - User ID to verify ownership
   * @returns Project if found and owned by user
   * @throws AppError if project not found or access denied
   */
  async findById(id: string, userId: string): Promise<ProjectResponseDto>;
  async findById(id: string, userId?: string): Promise<ProjectResponseDto> {
    let project: Project;

    if (userId) {
      // With ownership check
      project = await this.projectRepository.findByIdAndOwner(id, userId);
    } else {
      // Without ownership check
      project = await this.projectRepository.findById(id);
    }

    // Get task count for the project
    const taskCount = await this.projectRepository.countTasks(id);

    return {
      ...this.toProjectResponseDto(project),
      taskCount,
    };
  }

  /**
   * Update an existing project with ownership verification
   * @param id - Project ID
   * @param userId - User ID to verify ownership
   * @param updateProjectDto - Partial project data to update
   * @returns Updated project
   * @throws AppError if project not found, access denied, or validation fails
   */
  async updateProject(
    id: string,
    userId: string,
    updateProjectDto: UpdateProjectDto
  ): Promise<ProjectResponseDto> {
    // Verify ownership first (will throw if not owned)
    await this.projectRepository.findByIdAndOwner(id, userId);

    // If updating name, check for name conflicts (excluding current project)
    if (updateProjectDto.name) {
      const nameExists = await this.projectRepository.nameExistsForUser(
        updateProjectDto.name,
        userId,
        id // Exclude current project from uniqueness check
      );

      if (nameExists) {
        throw new AppError(
          409,
          'A project with this name already exists',
          'Conflict'
        );
      }
    }

    // Build update object with only provided fields
    const updates: Partial<Pick<Project, 'name' | 'description'>> = {};
    if (updateProjectDto.name !== undefined) {
      updates.name = updateProjectDto.name;
    }
    if (updateProjectDto.description !== undefined) {
      updates.description = updateProjectDto.description;
    }

    const updatedProject = await this.projectRepository.updateProject(
      id,
      userId,
      updates
    );

    return this.toProjectResponseDto(updatedProject);
  }

  /**
   * Delete a project with ownership verification
   * WARNING: This will cascade delete all tasks and labels in the project
   * @param id - Project ID
   * @param userId - User ID to verify ownership
   * @throws AppError if project not found or access denied
   */
  async deleteProject(id: string, userId: string): Promise<void> {
    // Verify ownership first (will throw if not owned)
    await this.projectRepository.findByIdAndOwner(id, userId);

    // Get task count for warning message
    const taskCount = await this.projectRepository.countTasks(id);

    if (taskCount > 0) {
      // Log a warning about cascading deletes
      // In a real application, you might want to:
      // 1. Require explicit confirmation
      // 2. Soft delete instead
      // 3. Archive the project instead of deleting
      console.warn(
        `Deleting project ${id} with ${taskCount} tasks. All tasks will be cascade deleted.`
      );
    }

    await this.projectRepository.deleteProject(id, userId);
  }

  /**
   * Validate ownership of a project (returns boolean for testing)
   * @param projectId - Project ID to validate
   * @param userId - User ID to check ownership against
   * @returns true if user owns the project, false otherwise
   */
  async validateOwnership(projectId: string, userId: string): Promise<boolean> {
    try {
      await this.projectRepository.findByIdAndOwner(projectId, userId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a user owns a project
   * @param projectId - Project ID
   * @param userId - User ID
   * @returns true if user owns the project, false otherwise
   */
  async isOwner(projectId: string, userId: string): Promise<boolean> {
    return this.validateOwnership(projectId, userId);
  }

  /**
   * Get project entity with ownership validation (for middleware use)
   * @param projectId - Project ID to validate
   * @param userId - User ID to check ownership against
   * @returns The project if ownership is valid
   * @throws AppError if project not found or user doesn't own it
   */
  async getProjectWithOwnership(projectId: string, userId: string): Promise<Project> {
    return this.projectRepository.findByIdAndOwner(projectId, userId);
  }

  /**
   * Convert Project entity to ProjectResponseDto
   * @param project - Project entity
   * @returns ProjectResponseDto
   */
  private toProjectResponseDto(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Seed system-defined labels for a newly created project
   * @param projectId - Project ID to seed labels for
   */
  private async seedSystemLabels(projectId: string): Promise<void> {
    const systemLabels = [
      { name: 'Bug', color: '#FF0000' },
      { name: 'Feature', color: '#2196F3' },
      { name: 'Enhancement', color: '#4CAF50' },
      { name: 'Question', color: '#FF9800' },
    ];

    const { Label } = await import('../models/label.entity');

    for (const labelData of systemLabels) {
      await this.projectRepository.getRepository()
        .createQueryBuilder()
        .insert()
        .into(Label)
        .values({
          ...labelData,
          projectId,
          isSystemDefined: true,
        })
        .execute();
    }
  }
}

export default ProjectService;
