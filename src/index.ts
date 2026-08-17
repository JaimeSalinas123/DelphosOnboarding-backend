import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { supabase } from './config/supabase';

// IMPORTACIÓN DE RUTAS
import usuarioRoutes from './routes/usuarioRoutes';
import estudioRoutes from './routes/estudioRoutes';
import chatbotRoutes from './routes/chatbotRoutes';
import satisfaccionRoutes from './routes/satisfaccionRoutes';
import progresoRoutes from './routes/progresoRoutes';
import auditoriaRoutes from './routes/auditoriaRoutes';

const app = express();

// PUERTO DINÁMICO PARA RENDER
const port = process.env.PORT || 4000;

// Cabeceras de seguridad Helmet
app.use(helmet());

// CORS ABIERTO A TU VERCEL Y LOCALHOST
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://192.168.1.26:3000',
  'http://10.5.0.2:3000',
  'https://delphos-app-rho.vercel.app'
]; 

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS BLOQUEADO] Intento de acceso desde: ${origin}`);
      callback(new Error('Petición bloqueada por políticas de seguridad de CORS'));
    }
  },
  credentials: true 
}));

// Middleware para que Express entienda JSON
app.use(express.json());

// ==========================================
// 🛡️ CORRECCIÓN P0: Se eliminó el endpoint /test-db
// ==========================================

// APLICAMOS LAS RUTAS
app.use('/api', usuarioRoutes);
app.use('/api/estudio', estudioRoutes);
app.use('/api/satisfaccion', satisfaccionRoutes);
app.use('/api/progreso', progresoRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// Encendemos el servidor con el puerto correcto
app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});