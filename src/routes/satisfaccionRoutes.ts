import { Router } from 'express';
import {
  obtenerPreguntas,
  crearPregunta,
  actualizarPregunta,
  eliminarPregunta
} from '../controllers/satisfaccionController';
import { validarEsquema } from '../middlewares/validador';
import { preguntaSatisfaccionSchema } from '../schemas/satisfaccionSchema';
import { verificarToken } from '../middlewares/auth';

const router = Router();

// Rutas CRUD para el apartado de Satisfacción (requieren sesión activa)
router.get('/preguntas', verificarToken, obtenerPreguntas);
router.post('/preguntas', verificarToken, validarEsquema(preguntaSatisfaccionSchema), crearPregunta);
router.put('/preguntas/:id', verificarToken, validarEsquema(preguntaSatisfaccionSchema), actualizarPregunta);
router.delete('/preguntas/:id', verificarToken, eliminarPregunta);

export default router;
