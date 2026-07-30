import { z } from 'zod';

export const preguntaSchema = z.object({
  tipo: z.string({ message: 'El tipo es obligatorio' }).min(1, 'El tipo no puede estar vacío'),
  nivel: z.string().optional().nullable(),
  pregunta: z.string({ message: 'La pregunta es obligatoria' }).min(1, 'La pregunta no puede estar vacía'),
  opcion_a: z.string().optional().nullable(),
  opcion_b: z.string().optional().nullable(),
  opcion_c: z.string().optional().nullable(),
  opcion_d: z.string().optional().nullable(),
  respuesta_correcta: z.string({ message: 'La respuesta correcta es obligatoria' }).min(1, 'La respuesta no puede estar vacía'),
  explicacion: z.string().optional().nullable(),
});