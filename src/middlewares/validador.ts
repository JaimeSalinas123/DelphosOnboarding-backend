import { Request, Response, NextFunction } from 'express';
// Cambiamos AnyZodObject por ZodSchema
import { ZodSchema, ZodError } from 'zod';

export const validarEsquema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next(); 
    } catch (error: any) {
      
      // LOG PARA DESCUBRIR AL CULPABLE EN LA TERMINAL DEL BACKEND
      console.log("⚠️ ERROR REAL DE ZOD:", error.issues || error);

      if (error instanceof ZodError) {
         res.status(400).json({
          // Extraemos el mensaje real (ej. "El nombre debe tener al menos...") en lugar del genérico "Datos inválidos"
          error: error.issues[0]?.message || 'Datos inválidos',
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