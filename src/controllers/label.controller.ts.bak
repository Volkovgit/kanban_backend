/**
 * Label Controller
 *
 * Handles HTTP requests for label CRUD operations
 */

import { Request, Response, Router } from 'express';
import { LabelService } from '../services/label.service';
import { BaseController } from './base.controller';
import { CreateLabelDto, UpdateLabelDto } from '../dto/label.dto';

export class LabelController extends BaseController {
  private router: Router;
  private labelService: LabelService;

  constructor(labelService: LabelService) {
    super();
    this.labelService = labelService;
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // List labels by project
    this.router.get('/', this.listLabels.bind(this));

    // Create label
    this.router.post('/', this.createLabel.bind(this));

    // Update label
    this.router.patch('/:id', this.updateLabel.bind(this));

    // Delete label
    this.router.delete('/:id', this.deleteLabel.bind(this));
  }

  /**
   * GET /api/v1/labels
   * List labels for a project
   */
  private async listLabels(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { projectId } = req.query;

      if (!projectId) {
        return this.error(res, 400, 'Project ID is required', 'ValidationError');
      }

      this.validateUuid(projectId as string, 'Project ID');

      const labels = await this.labelService.findByProjectId(projectId as string, userId);

      return this.success(res, labels);
    } catch (error: any) {
      if (error.code) {
        return this.error(res, error.statusCode, error.message, error.error);
      }
      return this.error(res, 500, 'Internal server error', 'InternalServerError');
    }
  }

  /**
   * POST /api/v1/labels
   * Create a new label
   */
  private async createLabel(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);

      this.validateRequired(req.body, ['name', 'color', 'projectId']);

      const createDto: CreateLabelDto = {
        name: req.body.name,
        color: req.body.color,
        projectId: req.body.projectId,
      };

      const label = await this.labelService.createLabel(createDto, userId);

      return this.success(res, label, 201);
    } catch (error: any) {
      if (error.code) {
        return this.error(res, error.statusCode, error.message, error.error);
      }
      return this.error(res, 500, 'Internal server error', 'InternalServerError');
    }
  }

  /**
   * PATCH /api/v1/labels/:id
   * Update an existing label
   */
  private async updateLabel(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      this.validateUuid(id, 'Label ID');

      const updateDto: UpdateLabelDto = {
        name: req.body.name,
        color: req.body.color,
      };

      const label = await this.labelService.updateLabel(id, updateDto, userId);

      return this.success(res, label);
    } catch (error: any) {
      if (error.code) {
        return this.error(res, error.statusCode, error.message, error.error);
      }
      return this.error(res, 500, 'Internal server error', 'InternalServerError');
    }
  }

  /**
   * DELETE /api/v1/labels/:id
   * Delete a label
   */
  private async deleteLabel(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;

      this.validateUuid(id, 'Label ID');

      await this.labelService.deleteLabel(id, userId);

      return this.noContent(res);
    } catch (error: any) {
      if (error.code) {
        return this.error(res, error.statusCode, error.message, error.error);
      }
      return this.error(res, 500, 'Internal server error', 'InternalServerError');
    }
  }

  /**
   * Get router for mounting
   */
  public getRouter(): Router {
    return this.router;
  }
}
