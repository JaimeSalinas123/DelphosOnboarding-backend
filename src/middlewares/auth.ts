import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const verificarToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //Verificamos que la petición traiga el Header de Autorización
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
     res.status(401).json({ error: 'Acceso denegado. Se requiere un token de sesión.' });
     return;
  }

  //Extraemos el token (el formato es "Bearer <token_largo>")
  const token = authHeader.split(' ')[1];

  try {
    //Le pedimos a Supabase que valide el token
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
       res.status(401).json({ error: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
       return;
    }

    //Si es válido, inyectamos los datos del usuario en la petición 
    //(Usamos as any para evitar pelear con los tipos estrictos de Express por ahora)
    (req as any).user = data.user;
    
    //Damos permiso para que pase al controlador
    next();
  } catch (error) {
     res.status(500).json({ error: 'Error interno al verificar el token' });
  }
};