/**
 * JSON Error Middleware
 *
 * Catches JSON parsing errors from express.json() and returns consistent error responses.
 * This must be registered immediately after express.json() middleware.
 */

import { Request, Response, NextFunction } from 'express';

export function jsonErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if this is a JSON parsing error from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      statusCode: 400,
      message: 'Malformed JSON in request body',
      error: 'BadRequest',
      timestamp: new Date().toISOString(),
      path: _req.url,
    });
    return;
  }

  // Pass other errors to the next error handler
  next(err);
}

export default jsonErrorHandler;
