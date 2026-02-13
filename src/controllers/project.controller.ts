/**
 * Project Controller
 *
 * Handles HTTP requests for project management:
 * - List user's projects (with pagination)
 * - Get single project by ID
 * - Create new project
 * - Update project
 * - Delete project
 */

import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import { validateDto } from '../config/validation';
import { wrapAsync } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth.middleware';
import { BaseController } from './base.controller';

/**
 * Project controller
 * Express router for project endpoints
 */
export class ProjectController extends BaseController {
  private router = Router();
  private projectService: ProjectService;

  constructor(projectService: ProjectService) {
    super();
    this.projectService = projectService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    /**
     * GET /projects
     * List all projects belonging to the authenticated user
     * Query params:
     *   - page: Page number (default: 1)
     *   - pageSize: Items per page (default: 20, max: 100)
     */
    this.router.get(
      '/',
      authenticate,
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const pagination = this.getPaginationParams(req);

        const result = await this.projectService.findAllByUserId(userId, {
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

        // Use paginated response from BaseController
        return this.paginated(
          res,
          result.data,
          result.page,
          result.pageSize,
          result.total
        );
      })
    );

    /**
     * GET /projects/:id
     * Get a single project by ID
     * Only returns projects owned by the authenticated user
     */
    this.router.get(
      '/:id',
      authenticate,
      wrapAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = this.getUserId(req);

        this.validateUuid(id, 'Project ID');

        const project = await this.projectService.findById(id, userId);

        return this.success(res, project);
      })
    );

    /**
     * POST /projects
     * Create a new project
     * Body: { name: string, description?: string }
     */
    this.router.post(
      '/',
      authenticate,
      validateDto(CreateProjectDto),
      wrapAsync(async (req: Request, res: Response) => {
        const createProjectDto: CreateProjectDto = req.body;
        const userId = this.getUserId(req);

        const project = await this.projectService.createProject(
          userId,
          createProjectDto
        );

        return this.success(res, project, 201);
      })
    );

    /**
     * PATCH /projects/:id
     * Update an existing project
     * Only allows updating projects owned by the authenticated user
     * Body: { name?: string, description?: string }
     */
    this.router.patch(
      '/:id',
      authenticate,
      validateDto(UpdateProjectDto),
      wrapAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const updateProjectDto: UpdateProjectDto = req.body;
        const userId = this.getUserId(req);

        this.validateUuid(id, 'Project ID');

        const project = await this.projectService.updateProject(
          id,
          userId,
          updateProjectDto
        );

        return this.success(res, project);
      })
    );

    /**
     * DELETE /projects/:id
     * Delete a project
     * Only allows deleting projects owned by the authenticated user
     * WARNING: Will cascade delete all tasks and labels in the project
     */
    this.router.delete(
      '/:id',
      authenticate,
      wrapAsync(async (req: Request, res: Response) => {
        const { id } = req.params;
        const userId = this.getUserId(req);

        this.validateUuid(id, 'Project ID');

        await this.projectService.deleteProject(id, userId);

        return this.noContent(res);
      })
    );
  }

  /**
   * Get the router instance
   */
  getRouter(): Router {
    return this.router;
  }
}

export default ProjectController;
