import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Usamos require para que TypeScript no pierda la referencia al compilar
const WebSocket = require('ws');

// cargar las variables de entorno desde el archivo .env
dotenv.config();

// extraer las variables de entorno necesarias
// le decimos a ts que son Strings
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

// validacion por si algun dia se borra el .env por error
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env');
}

// Inyectamos WebSocket globalmente a la fuerza en node
(globalThis as any).WebSocket = WebSocket;

// inicializamos el cliente y los exportamos para usarlo en toda la app
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});