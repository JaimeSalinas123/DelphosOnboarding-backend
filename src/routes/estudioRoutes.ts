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
// 🛡️ CORRECCIÓN: Importamos verificarAdmin
import { verificarToken, verificarAdmin } from '../middlewares/auth'; 

const router = Router();

// Rutas CRUD para las preguntas
// 🛡️ Nota: GET /preguntas se queda solo con verificarToken para que los pasantes puedan estudiar
router.get('/preguntas', verificarToken, obtenerPreguntas);

// 🛡️ CORRECCIÓN P0: Protegemos la manipulación de preguntas (POST, PUT, DELETE)
router.post('/preguntas', verificarToken, verificarAdmin, validarEsquema(preguntaSchema), crearPregunta);
router.put('/preguntas/:id', verificarToken, verificarAdmin, validarEsquema(preguntaSchema), actualizarPregunta);
router.delete('/preguntas/:id', verificarToken, verificarAdmin, eliminarPregunta);

// Rutas para los Resultados
// 🛡️ CORRECCIÓN P0: Protegemos la extracción del listado de notas de toda la empresa
router.get('/resultados', verificarToken, verificarAdmin, obtenerResultados);

// 🛡️ Nota: Guardar resultado se queda público para el pasante
router.post('/resultados', verificarToken, validarEsquema(resultadoSchema), guardarResultado);

export default router;