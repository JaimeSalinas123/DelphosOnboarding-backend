import express, { Request, Response } from 'express';
import cors from 'cors';
import { supabase } from './config/supabase';
import usuarioRoutes from './routes/usuarioRoutes';

const app = express();
const port = 4000;

// Middleware para que Express entienda JSON
app.use(cors());
app.use(express.json());

// Dejamos tu ruta de prueba intacta por si quieres monitorear la conexión
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
// Todas las rutas dentro de usuarioRoutes tendrán el prefijo '/api'
app.use(express.json());
app.use('/api', usuarioRoutes);

// Encendemos el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});