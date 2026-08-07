import { Router } from 'express';
import { 
  preguntarChatbot, 
  obtenerHistorial, 
  obtenerDocumentacion, 
  guardarDocumentacion,
  obtenerNuevosConocimientos, 
  guardarNuevosConocimientos  
} from '../controllers/chatbotController';
import { verificarToken } from '../middlewares/auth';

const router = Router();

// Rutas del Chat
router.get('/historial', verificarToken, obtenerHistorial);
router.post('/preguntar', verificarToken, preguntarChatbot);

// Rutas de la Documentación Oficial
router.get('/documentacion', verificarToken, obtenerDocumentacion);
router.put('/documentacion', verificarToken, guardarDocumentacion);

// Rutas de Nuevos Conocimientos
router.get('/nuevos-conocimientos', verificarToken, obtenerNuevosConocimientos);
router.post('/nuevos-conocimientos', verificarToken, guardarNuevosConocimientos);

export default router;