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
import { createAuthenticateMiddleware } from '../middleware/authenticate';
import { BaseController } from './base.controller';

/**
 * Project controller
 * Express router for project endpoints
 */
export class ProjectController extends BaseController {
  private router = Router();
  private projectService: ProjectService;
  private dataSource: any;

  constructor(projectService: ProjectService, dataSource: any) {
    super();
    this.projectService = projectService;
    this.dataSource = dataSource;
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
      createAuthenticateMiddleware(this.dataSource),
      wrapAsync(async (req: Request, res: Response) => {
        const userId = this.getUserId(req);
        const pagination = this.getPaginationParams(req);

        const result = await this.projectService.findAllByUserId(userId, {
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

        // Use paginated response from BaseController
        const paginatedResult = this.paginated(
          result.data,
          result.page,
          result.pageSize,
          result.total
        );

        // Add pagination headers
        res.setHeader('X-Total-Count', result.total.toString());
        res.setHeader('X-Page-Size', result.pageSize.toString());
        res.setHeader('X-Current-Page', result.page.toString());
        res.setHeader('X-Total-Pages', Math.ceil(result.total / result.pageSize).toString());

        return res.status(200).json({
          success: true,
          ...paginatedResult
        });
      })
    );

    /**
     * GET /projects/:id
     * Get a single project by ID
     * Only returns projects owned by the authenticated user
     */
    this.router.get(
      '/:id',
      createAuthenticateMiddleware(this.dataSource),
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
      createAuthenticateMiddleware(this.dataSource),
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
      createAuthenticateMiddleware(this.dataSource),
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
      createAuthenticateMiddleware(this.dataSource),
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
