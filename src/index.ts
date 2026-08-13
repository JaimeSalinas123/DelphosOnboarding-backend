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

// 1. PUERTO DINÁMICO PARA RENDER (¡Soluciona que el servidor cobre vida en la nube!)
const port = process.env.PORT || 4000;

// 1. Cabeceras de seguridad Helmet
app.use(helmet());

// 2. CORS ABIERTO A TU VERCEL Y LOCALHOST (Permite que el frontend hable con el backend)
const allowedOrigins = [
  'http://localhost:3000', // <-- ¡CORREGIDO! Es el puerto 3000 de tu frontend de Next.js
  'http://127.0.0.1:3000', // <-- Para pruebas locales en tu máquina
  'http://192.168.1.26:3000',
  'http://10.5.0.2:3000', // <-- Para pruebas en tu red local (ej. celular)
  'https://delphos-app-rho.vercel.app' // <-- Tu URL real de Vercel
]; 

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como Postman o apps móviles) o si están en la lista VIP
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

// Ruta de prueba
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('usuario').select('*');
    if (error) throw error;
    res.json({ mensaje: '¡Conexión exitosa a Supabase, chaval!', usuarios: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// APLICAMOS LAS RUTAS (Todas conservan su prefijo /api tal como las diseñaste)
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