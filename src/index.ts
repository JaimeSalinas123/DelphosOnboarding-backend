import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet'; // <-- Nuevo Import
import { supabase } from './config/supabase';
import usuarioRoutes from './routes/usuarioRoutes';

const app = express();
const port = 4000;

// 1. Cabeceras de seguridad Helmet (Mitiga Clickjacking, XSS básico, sniffing MIME)
app.use(helmet());

// 2. CORS restrictivo de producción
const allowedOrigins = ['http://localhost:3000']; // Sincronizado con el puerto de tu frontend Next.js
app.use(cors({
  origin: (origin, callback) => {
    // Permitimos peticiones sin origen (como llamadas de servidores backend a backend o Postman en desarrollo si es necesario)
    // Para producción estricta se remueve el !origin
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Petición bloqueada por políticas de seguridad de CORS'));
    }
  },
  credentials: false // No permitimos credenciales de sesión arbitrarias por CORS
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

// APLICAMOS LAS RUTAS REFACTORIZADAS
app.use('/api', usuarioRoutes);

// Encendemos el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});