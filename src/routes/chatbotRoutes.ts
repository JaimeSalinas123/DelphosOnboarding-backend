import { Router } from 'express';
import { preguntarChatbot, obtenerHistorial } from '../controllers/chatbotController';
import { verificarToken } from '../middlewares/auth';

const router = Router();

// Ruta para traer el historial previo del usuario
router.get('/historial', verificarToken, obtenerHistorial);

// Ruta para enviar pregunta
router.post('/preguntar', verificarToken, preguntarChatbot);

export default router;