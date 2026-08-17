import { Router } from 'express';
import {
  registrarUsuario,
  loginUsuario,
  solicitarRecuperacion,
  resetearPassword,
  obtenerUsuarios,
  actualizarRolUsuario
} from '../controllers/usuarioController';
import { validarEsquema } from '../middlewares/validador';
import { registroSchema, loginSchema, actualizarRolSchema } from '../schemas/usuarioSchema';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { verificarToken, verificarAdmin } from '../middlewares/auth';

const router = Router();

router.post('/registro', authRateLimiter, validarEsquema(registroSchema), registrarUsuario);
router.post('/login', authRateLimiter, validarEsquema(loginSchema), loginUsuario);

// Listado de usuarios registrados 
// 🛡️ CORRECCIÓN P0: Agregamos verificarAdmin para prevenir extracción masiva de PII
router.get('/usuarios', verificarToken, verificarAdmin, obtenerUsuarios);

// Actualizar el rol de un usuario (solo administradores)
router.patch('/usuarios/:id/rol', verificarToken, verificarAdmin, validarEsquema(actualizarRolSchema), actualizarRolUsuario);

// Nuevas rutas de recuperación
router.post('/recuperar-password', authRateLimiter, solicitarRecuperacion);
router.post('/resetear-password', authRateLimiter, resetearPassword);

export default router;