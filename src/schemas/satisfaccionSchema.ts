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

// --- ESQUEMA PARA EL ENVÍO DE LA ENCUESTA POR PARTE DEL PASANTE ---

const respuestaSchema = z.object({
  pregunta_id: z.string({ message: 'El id de la pregunta es obligatorio' }).uuid('El id de la pregunta no es válido'),
  respuesta_numerica: z.number().int().min(1).max(10).optional().nullable(),
  respuesta_texto: z.string().min(1, 'La respuesta de texto no puede estar vacía').optional().nullable(),
})
.refine((data) => {
  // Igual que el CHECK de la base de datos: numérica O texto, nunca ambas ni ninguna
  const tieneNumerica = data.respuesta_numerica != null;
  const tieneTexto = data.respuesta_texto != null;
  return tieneNumerica !== tieneTexto;
}, {
  message: 'Cada respuesta debe traer respuesta_numerica O respuesta_texto, no ambas ni ninguna.',
  path: ['respuesta_numerica']
});

export const enviarEncuestaSchema = z.object({
  respuestas: z.array(respuestaSchema).min(1, 'Debes responder al menos una pregunta')
})
.strict()
.refine((data) => {
  const idsUnicos = new Set(data.respuestas.map(r => r.pregunta_id));
  return idsUnicos.size === data.respuestas.length;
}, {
  message: 'No puedes enviar más de una respuesta para la misma pregunta.',
  path: ['respuestas']
});
