import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware that validates request body against a Zod schema
 * @param schema Zod schema to validate against
 */
export function zValidate(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = schema.safeParse(req.body);
      
      if (!validation.success) {
        const errors = validation.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          message: 'Validation error',
          errors
        });
      }
      
      // If validation succeeds, replace req.body with the validated and
      // transformed value that Zod returns
      req.body = validation.data;
      next();
    } catch (error: any) {
      return res.status(500).json({
        message: 'Server error during validation',
        error: error.message
      });
    }
  };
}