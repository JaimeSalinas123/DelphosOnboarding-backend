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

// El limitador se coloca antes de validar el esquema para no gastar ciclos de CPU inútilmente
router.post('/registro', authRateLimiter, validarEsquema(registroSchema), registrarUsuario);
router.post('/login', authRateLimiter, validarEsquema(loginSchema), loginUsuario);

// Listado de usuarios registrados (requiere sesión activa)
router.get('/usuarios', verificarToken, obtenerUsuarios);

// Actualizar el rol de un usuario (solo administradores)
router.patch('/usuarios/:id/rol', verificarToken, verificarAdmin, validarEsquema(actualizarRolSchema), actualizarRolUsuario);

// Nuevas rutas de recuperación (¡El limitador aquí es clave para evitar ataques de spam de correos!)
router.post('/recuperar-password', authRateLimiter, solicitarRecuperacion);
router.post('/resetear-password', authRateLimiter, resetearPassword);

export default router;