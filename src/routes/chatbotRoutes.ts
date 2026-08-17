import { Router } from 'express';
import { 
  preguntarChatbot, 
  obtenerHistorial, 
  obtenerDocumentacion, 
  guardarDocumentacion,
  obtenerNuevosConocimientos, 
  guardarNuevosConocimientos  
} from '../controllers/chatbotController';
// 🛡️ CORRECCIÓN: Importamos verificarAdmin
import { verificarToken, verificarAdmin } from '../middlewares/auth';

const router = Router();

// Rutas del Chat (Públicas para pasantes)
router.get('/historial', verificarToken, obtenerHistorial);
router.post('/preguntar', verificarToken, preguntarChatbot);

// Rutas de la Documentación Oficial
// 🛡️ CORRECCIÓN P1: Protegemos lectura y escritura del entrenamiento de la IA
router.get('/documentacion', verificarToken, verificarAdmin, obtenerDocumentacion);
router.put('/documentacion', verificarToken, verificarAdmin, guardarDocumentacion);

// Rutas de Nuevos Conocimientos
// 🛡️ CORRECCIÓN P1: Protegemos lectura y escritura
router.get('/nuevos-conocimientos', verificarToken, verificarAdmin, obtenerNuevosConocimientos);
router.post('/nuevos-conocimientos', verificarToken, verificarAdmin, guardarNuevosConocimientos);

export default router;