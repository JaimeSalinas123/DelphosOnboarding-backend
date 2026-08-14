import { Router } from 'express';
import { obtenerAuditoria, rehacerAuditoria } from '../controllers/auditoriaController';
// 🛡️ CORRECCIÓN: Importamos verificarAdmin
import { verificarToken, verificarAdmin } from '../middlewares/auth'; 

const router = Router();

// Endpoint para listar el registro (GET /api/auditoria)
// 🛡️ CORRECCIÓN P0: Agregamos verificarAdmin para evitar escalación de privilegios
router.get('/', verificarToken, verificarAdmin, obtenerAuditoria);

// Endpoint para botón rehacer (POST /api/auditoria/:id/rehacer)
// 🛡️ CORRECCIÓN P0: Agregamos verificarAdmin
router.post('/:id/rehacer', verificarToken, verificarAdmin, rehacerAuditoria);

export default router;