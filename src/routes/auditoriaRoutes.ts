import { Router } from 'express';
import { obtenerAuditoria, rehacerAuditoria } from '../controllers/auditoriaController';
import { verificarToken } from '../middlewares/auth'; // Asegúrate de que la ruta del middleware sea correcta

const router = Router();

// Endpoint para listar el registro (GET /api/auditoria)
router.get('/', verificarToken, obtenerAuditoria);

// Endpoint para botón rehacer (POST /api/auditoria/:id/rehacer)
router.post('/:id/rehacer', verificarToken, rehacerAuditoria);

export default router;