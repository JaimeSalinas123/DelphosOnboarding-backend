import { z } from 'zod';

export const preguntaSatisfaccionSchema = z.object({
  seccion: z.string({ message: 'La sección es obligatoria' }).min(1, 'La sección no puede estar vacía'),
  pregunta: z.string({ message: 'La pregunta es obligatoria' }).min(1, 'La pregunta no puede estar vacía'),
  tipo_respuesta: z.enum(['escala', 'texto'] as const, {
    message: "El tipo de respuesta debe ser 'escala' o 'texto'"
  }),
  escala_min: z.number().int().optional().nullable(),
  escala_max: z.number().int().optional().nullable(),
  orden: z.number({ message: 'El orden es obligatorio' }).int(),
  obligatoria: z.boolean().optional(),
})
.refine((data) => {
  // Las preguntas de escala deben traer su rango; las de texto no llevan rango
  if (data.tipo_respuesta === 'escala') {
    return data.escala_min != null && data.escala_max != null;
  }
  return data.escala_min == null && data.escala_max == null;
}, {
  message: "Las preguntas de tipo 'escala' requieren escala_min y escala_max; las de tipo 'texto' no deben llevarlos.",
  path: ['tipo_respuesta']
});
