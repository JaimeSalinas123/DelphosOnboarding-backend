import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { registrarAuditoria } from '../utils/auditoriaHelper'; // <-- IMPORTAMOS EL HELPER

// Registro de nuevos usuarios
export const registrarUsuario = async (req: Request, res: Response): Promise<void> => {
  const { email, password, nombre, departamento, empresa_web } = req.body;

  try {
    // 1. Detección de Bot (Honeypot):
    if (empresa_web) {
      res.status(201).json({ 
        mensaje: '¡Usuario registrado con éxito en Delphos Onboarding!', 
        usuarioId: 'ae201c19-76e6-4956-b58f-35ed042da101' 
      });
      return;
    }

    // 2. Registramos en Auth de Supabase
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

// Obtener todos los usuarios registrados
export const obtenerUsuarios = async (req: Request, res: Response): Promise<void> => {
  const { departamento, nombre } = req.query;

  const pagina = Math.max(parseInt(req.query.pagina as string) || 1, 1);
  const limite = Math.min(Math.max(parseInt(req.query.limite as string) || 10, 1), 100);
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  try {
    let query = supabase
      .from('usuario')
      .select('id, nombre, email, departamento, rol', { count: 'exact' });

    if (departamento && typeof departamento === 'string') {
      query = query.eq('departamento', departamento);
    }

    if (nombre && typeof nombre === 'string') {
      query = query.ilike('nombre', `%${nombre}%`);
    }

    // Se ordena ANTES de paginar, así "administrador" queda primero de forma
    // real (across todas las páginas), no solo dentro de la página que ya
    // llegó del servidor. Aprovecha que 'administrador' < 'evaluador' <
    // 'nuevo_integrante' alfabéticamente: si algún día cambian los valores
    // del enum de rol, esto hay que revisarlo (o pasar a un rank explícito).
    query = query.order('rol', { ascending: true }).order('nombre', { ascending: true });

    const { data, error, count } = await query.range(desde, hasta);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(200).json({
      usuarios: data,
      paginacion: {
        pagina,
        limite,
        total: count ?? 0,
        totalPaginas: Math.ceil((count ?? 0) / limite)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Actualizar el rol de un usuario específico (solo administradores)
export const actualizarRolUsuario = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { rol } = req.body;

  try {
    // 1. OBTENEMOS EL ROL VIEJO ANTES DE CAMBIARLO (Para poder revertirlo después)
    const { data: usuarioViejo, error: errorBusqueda } = await supabase
      .from('usuario')
      .select('nombre, rol')
      .eq('id', id)
      .single();

    if (errorBusqueda) throw errorBusqueda;

    // 2. ACTUALIZAMOS AL NUEVO ROL
    const { data, error } = await supabase
      .from('usuario')
      .update({ rol })
      .eq('id', id)
      .select('id, nombre, email, departamento, rol')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }

    // 3. REGISTRAMOS EN LA AUDITORÍA (Guardamos el rol viejo en datos_originales)
    const admin = (req as any).user;
    if (admin) {
      await registrarAuditoria({
        usuario_nombre: admin.nombre || 'Administrador',
        usuario_email: admin.email || 'No disponible',
        modulo: 'usuarios',
        accion: 'editar',
        detalles: `Cambió el rol de "${data.nombre}" a ${rol.replace('_', ' ')}`,
        reversible: true,
        datos_originales: { id: data.id, nombre: data.nombre, rol_anterior: usuarioViejo.rol }
      });
    }

    res.status(200).json({
      mensaje: 'Rol actualizado correctamente.',
      usuario: data
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Inicio de sesion de usuarios
export const loginUsuario = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
       res.status(401).json({ error: 'Credenciales incorrectas' });
       return;
    }

    const { data: perfilData } = await supabase
      .from('usuario')
      .select('id, nombre, departamento, rol')
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

// --- FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA ---

export const solicitarRecuperacion = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/resetear-password',
    });

    if (error) {
       res.status(400).json({ error: error.message });
       return;
    }

    res.status(200).json({ 
      mensaje: 'Si el correo existe en nuestro sistema, hemos enviado un enlace de recuperación.' 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const resetearPassword = async (req: Request, res: Response): Promise<void> => {
  const { access_token, refresh_token, new_password } = req.body;

  try {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (sessionError) {
      res.status(401).json({ error: 'El enlace de recuperación ha expirado o es inválido.' });
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password
    });

    if (updateError) {
      res.status(400).json({ error: updateError.message });
      return;
    }

    res.status(200).json({ mensaje: '¡Contraseña actualizada correctamente!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};