import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Get existing correlation ID from headers or generate a new one
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

    // Set it on the request headers so it can be passed to downstream services
    req.headers['x-correlation-id'] = correlationId;

    // Set it on the response headers so the client can track it
    res.setHeader('X-Correlation-ID', correlationId);

    next();
}

export default correlationIdMiddleware;
