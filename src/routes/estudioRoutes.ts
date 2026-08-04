import { Router } from 'express';
import { 
  obtenerPreguntas, 
  crearPregunta, 
  actualizarPregunta, 
  eliminarPregunta,
  guardarResultado,
  obtenerResultados
} from '../controllers/estudioController';
import { validarEsquema } from '../middlewares/validador'; 
import { preguntaSchema, resultadoSchema } from '../schemas/estudioSchema';

const router = Router();

// Rutas CRUD para las preguntas (Panel Admin)
router.get('/preguntas', obtenerPreguntas);
router.post('/preguntas', validarEsquema(preguntaSchema), crearPregunta);
router.put('/preguntas/:id', validarEsquema(preguntaSchema), actualizarPregunta);
router.delete('/preguntas/:id', eliminarPregunta);

// Rutas para los Resultados (Panel Admin y Vistas Públicas)
router.get('/resultados', obtenerResultados);
router.post('/resultados', validarEsquema(resultadoSchema), guardarResultado);

export default router;