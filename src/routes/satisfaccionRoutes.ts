import { Router } from 'express';
import {
  obtenerPreguntas,
  crearPregunta,
  actualizarPregunta,
  eliminarPregunta,
  enviarEncuesta
} from '../controllers/satisfaccionController';
import { validarEsquema } from '../middlewares/validador';
import { preguntaSatisfaccionSchema, enviarEncuestaSchema } from '../schemas/satisfaccionSchema';
import { verificarToken } from '../middlewares/auth';

const router = Router();

// Rutas CRUD para el apartado de Satisfacción (requieren sesión activa)
router.get('/preguntas', verificarToken, obtenerPreguntas);
router.post('/preguntas', verificarToken, validarEsquema(preguntaSatisfaccionSchema), crearPregunta);
router.put('/preguntas/:id', verificarToken, validarEsquema(preguntaSatisfaccionSchema), actualizarPregunta);
router.delete('/preguntas/:id', verificarToken, eliminarPregunta);

// El pasante envía sus respuestas de la encuesta (una sola vez)
router.post('/encuestas', verificarToken, validarEsquema(enviarEncuestaSchema), enviarEncuesta);

export default router;
