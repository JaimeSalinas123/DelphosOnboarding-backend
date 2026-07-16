import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Registro de nuevos usuarios
export const registrarUsuario = async (req: Request, res: Response): Promise<void> => {
  const { email, password, nombre, departamento, empresa_web } = req.body;

  try {
    // 1. Detección de Bot (Honeypot):
    // Si el campo invisible contiene texto, fingimos un registro exitoso (estatus 201)
    // pero no tocamos la base de datos para no gastar ancho de banda o almacenamiento.
    if (empresa_web) {
      res.status(201).json({ 
        mensaje: '¡Usuario registrado con éxito en Delphos Onboarding!', 
        usuarioId: 'ae201c19-76e6-4956-b58f-35ed042da101' // ID ficticio para el bot
      });
      return;
    }

    // 2. Registramos en Auth de Supabase (Bóveda oculta)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
       res.status(400).json({ error: authError.message });
       return;
    }

    // 3. Guardamos en nuestra tabla pública de usuario
    if (authData.user) {
      const { error: dbError } = await supabase.from('usuario').insert([
        {
          id: authData.user.id,
          nombre: nombre,
          email: email, 
          departamento: departamento,
          rol: 'nuevo_integrante' 
        }
      ]);

      if (dbError) {
         // Manejo limpio si se evade Zod y choca con el candado UNIQUE de la base de datos
         if (dbError.code === '23505') {
           res.status(400).json({ error: 'La dirección de correo ya se encuentra registrada.' });
           return;
         }
         res.status(400).json({ error: dbError.message });
         return;
      }
    }

    res.status(201).json({ 
        mensaje: '¡Usuario registrado con éxito en Delphos Onboarding!', 
        usuarioId: authData.user?.id 
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Inicio de sesion de usuarios
export const loginUsuario = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 1. Autenticamos con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
       res.status(401).json({ error: 'Credenciales incorrectas' });
       return;
    }

    // 2. Traemos los datos extra del perfil
    const { data: perfilData } = await supabase
      .from('usuario')
      .select('nombre, departamento, rol')
      .eq('id', data.user.id)
      .single();

    res.status(200).json({
        mensaje: '¡Inicio de sesión exitoso!',
        token: data.session.access_token, 
        usuario: perfilData
    });

  } catch (error: any) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};