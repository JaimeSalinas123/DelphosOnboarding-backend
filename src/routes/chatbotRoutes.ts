import { Router } from 'express';
import { 
  preguntarChatbot, 
  obtenerHistorial, 
  obtenerDocumentacion, 
  guardarDocumentacion 
} from '../controllers/chatbotController';
import { verificarToken } from '../middlewares/auth';

const router = Router();

// Rutas del Chat
router.get('/historial', verificarToken, obtenerHistorial);
router.post('/preguntar', verificarToken, preguntarChatbot);

// Rutas de la Documentación (¡Estas son las que faltaban!)
router.get('/documentacion', verificarToken, obtenerDocumentacion);
router.put('/documentacion', verificarToken, guardarDocumentacion);

export default router;