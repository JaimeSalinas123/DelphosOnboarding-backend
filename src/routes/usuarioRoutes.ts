import { Router } from 'express';
import { registrarUsuario, loginUsuario } from '../controllers/usuarioController';
// Importamos el validador y el esquema
import { validarEsquema } from '../middlewares/validador';
import { registroSchema, loginSchema } from '../schemas/usuarioSchema';;

const router = Router();

// Agregamos el middleware justo en medio de la ruta y el controlador
router.post('/registro', validarEsquema(registroSchema), registrarUsuario);
router.post('/login', validarEsquema(loginSchema), loginUsuario);

export default router;