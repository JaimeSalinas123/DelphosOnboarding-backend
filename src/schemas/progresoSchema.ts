import { z } from 'zod';

// Los 8 módulos del anillo del Ecosistema (deben calzar con src/data/modulos.ts del front)
export const moduloEcosistemaSchema = z.object({
  modulo: z.enum(
    ['core', 'bi', 'continuum', 'elite', 'mobile', 'portal', 'funciona', 'ia'],
    { message: 'Módulo de ecosistema inválido' }
  ),
});
