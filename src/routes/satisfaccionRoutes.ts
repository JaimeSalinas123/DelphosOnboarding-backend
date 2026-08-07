import { Router } from 'express';
import {
  obtenerPreguntas,
  crearPregunta,
  actualizarPregunta,
  eliminarPregunta,
  enviarEncuesta,
  obtenerResultados,
  obtenerMiEstado,
  obtenerCodigoEncuesta,
  actualizarCodigoEncuesta,
  verificarCodigoEncuesta
} from '../controllers/satisfaccionController';
import { validarEsquema } from '../middlewares/validador';
import { preguntaSatisfaccionSchema, enviarEncuestaSchema, codigoEncuestaSchema } from '../schemas/satisfaccionSchema';
import { verificarToken, verificarAdmin } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Rutas CRUD para el apartado de Satisfacción (requieren sesión activa)
router.get('/preguntas', verificarToken, obtenerPreguntas);
router.post('/preguntas', verificarToken, validarEsquema(preguntaSatisfaccionSchema), crearPregunta);
router.put('/preguntas/:id', verificarToken, validarEsquema(preguntaSatisfaccionSchema), actualizarPregunta);
router.delete('/preguntas/:id', verificarToken, eliminarPregunta);

// El pasante envía sus respuestas de la encuesta (una sola vez)
router.post('/encuestas', verificarToken, validarEsquema(enviarEncuestaSchema), enviarEncuesta);

// El pasante consulta si ya completó la encuesta
router.get('/mi-estado', verificarToken, obtenerMiEstado);

// Listado de resultados de todos los usuarios (solo administradores)
router.get('/resultados', verificarToken, verificarAdmin, obtenerResultados);

// Código de acceso de la encuesta: consulta y edición (solo administradores)
router.get('/codigo', verificarToken, verificarAdmin, obtenerCodigoEncuesta);
router.put('/codigo', verificarToken, verificarAdmin, validarEsquema(codigoEncuestaSchema), actualizarCodigoEncuesta);

// El pasante intenta desbloquear la encuesta con un código (con rate limit,
// igual que login, para no dejar fuerza bruta libre sobre un código corto)
router.post('/verificar-codigo', verificarToken, authRateLimiter, validarEsquema(codigoEncuestaSchema), verificarCodigoEncuesta);

export default router;
