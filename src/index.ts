import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { supabase } from './config/supabase';
import usuarioRoutes from './routes/usuarioRoutes';
import estudioRoutes from './routes/estudioRoutes';
import chatbotRoutes from './routes/chatbotRoutes'; 
import satisfaccionRoutes from './routes/satisfaccionRoutes';

const app = express();
const port = 4000;

// 1. Cabeceras de seguridad Helmet
app.use(helmet());

// 2. CORS restrictivo de producción
const allowedOrigins = ['http://localhost:3000']; 
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Petición bloqueada por políticas de seguridad de CORS'));
    }
  },
  credentials: false 
}));

// Middleware para que Express entienda JSON
app.use(express.json());

// Dejamos tu ruta de prueba intacta
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('usuario').select('*');
    if (error) throw error;
    res.json({ mensaje: '¡Conexión exitosa a Supabase, chaval!', usuarios: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// APLICAMOS LAS RUTAS
app.use('/api', usuarioRoutes);
app.use('/api/estudio', estudioRoutes); 
app.use('/api/satisfaccion', satisfaccionRoutes);
app.use('/api/chat', chatbotRoutes);

// Encendemos el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});