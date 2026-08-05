import { Router } from 'express';
import {
  registrarModuloEcosistema,
  obtenerMiProgreso,
  obtenerProgresoGeneral
} from '../controllers/progresoController';
import { validarEsquema } from '../middlewares/validador';
import { moduloEcosistemaSchema } from '../schemas/progresoSchema';
import { verificarToken, verificarAdmin } from '../middlewares/auth';

const router = Router();

// El pasante marca un módulo del ecosistema como visitado
router.post('/ecosistema', verificarToken, validarEsquema(moduloEcosistemaSchema), registrarModuloEcosistema);

// El pasante consulta su propio progreso (Ecosistema + Estudio + Encuesta)
router.get('/mio', verificarToken, obtenerMiProgreso);

// Progreso de todos los pasantes (solo administradores, panel de Métricas)
router.get('/', verificarToken, verificarAdmin, obtenerProgresoGeneral);

export default router;
