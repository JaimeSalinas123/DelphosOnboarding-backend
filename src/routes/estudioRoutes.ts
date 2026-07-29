import { Router } from 'express';
import { 
  obtenerPreguntas, 
  crearPregunta, 
  actualizarPregunta, 
  eliminarPregunta 
} from '../controllers/estudioController';
import { validarEsquema } from '../middlewares/validador'; 
import { preguntaSchema } from '../schemas/estudioSchema';

const router = Router();

// Rutas CRUD para el apartado de Estudio
router.get('/preguntas', obtenerPreguntas);
router.post('/preguntas', validarEsquema(preguntaSchema), crearPregunta);
router.put('/preguntas/:id', validarEsquema(preguntaSchema), actualizarPregunta);
router.delete('/preguntas/:id', eliminarPregunta);

export default router;