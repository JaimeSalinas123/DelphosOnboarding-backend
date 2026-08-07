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
import { verificarToken } from '../middlewares/auth'; // <-- AGREGAMOS EL CANDADO

const router = Router();

// Rutas CRUD para las preguntas (Panel Admin) - AHORA PROTEGIDAS
router.get('/preguntas', verificarToken, obtenerPreguntas);
router.post('/preguntas', verificarToken, validarEsquema(preguntaSchema), crearPregunta);
router.put('/preguntas/:id', verificarToken, validarEsquema(preguntaSchema), actualizarPregunta);
router.delete('/preguntas/:id', verificarToken, eliminarPregunta);

// Rutas para los Resultados (Panel Admin y Vistas Públicas) - AHORA PROTEGIDAS
router.get('/resultados', verificarToken, obtenerResultados);
router.post('/resultados', verificarToken, validarEsquema(resultadoSchema), guardarResultado);

export default router;