import { Request, Response, NextFunction } from 'express';
// Cambiamos AnyZodObject por ZodSchema
import { ZodSchema, ZodError } from 'zod';

export const validarEsquema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next(); 
    } catch (error) {
      if (error instanceof ZodError) {
         res.status(400).json({
          error: 'Datos inválidos',
          detalles: error.issues.map(issue => ({
            campo: issue.path[0],
            mensaje: issue.message
          }))
        });
        return;
      }
      res.status(500).json({ error: 'Error interno de validación' });
    }
  };
};