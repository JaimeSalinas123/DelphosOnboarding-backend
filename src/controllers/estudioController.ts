import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { registrarAuditoria } from '../utils/auditoriaHelper';

// 1. Obtener todas las preguntas (Solo las activas)
export const obtenerPreguntas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('preguntas_estudio')
      .select('*')
      .eq('activo', true) // Filtro del borrado lógico
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Crear una nueva pregunta
export const crearPregunta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('preguntas_estudio')
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;

    // REGISTRO DE AUDITORÍA
    const usuario = (req as any).user;
    if (usuario) {
      await registrarAuditoria({
        usuario_nombre: usuario.nombre || 'Administrador',
        usuario_email: usuario.email || 'No disponible',
        modulo: 'estudio',
        accion: 'crear',
        detalles: `Creó la pregunta: "${data.pregunta}"`,
        reversible: false
      });
    }

    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Actualizar una pregunta existente
export const actualizarPregunta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('preguntas_estudio')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // REGISTRO DE AUDITORÍA
    const usuario = (req as any).user;
    if (usuario) {
      await registrarAuditoria({
        usuario_nombre: usuario.nombre || 'Administrador',
        usuario_email: usuario.email || 'No disponible',
        modulo: 'estudio',
        accion: 'editar',
        detalles: `Editó la pregunta: "${data.pregunta}"`,
        reversible: false
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Eliminar una pregunta (Borrado Lógico)
export const eliminarPregunta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // A. Obtener la data ANTES de borrar para guardarla en la auditoría
    const { data: preguntaOriginal, error: errorBusqueda } = await supabase
      .from('preguntas_estudio')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusqueda) throw errorBusqueda;

    // B. Ejecutar el borrado lógico
    const { error } = await supabase
      .from('preguntas_estudio')
      .update({ activo: false }) // Solo la ocultamos
      .eq('id', id);

    if (error) throw error;

    // C. REGISTRO DE AUDITORÍA (Este SÍ es reversible)
    const usuario = (req as any).user;
    if (usuario) {
      await registrarAuditoria({
        usuario_nombre: usuario.nombre || 'Administrador',
        usuario_email: usuario.email || 'No disponible',
        modulo: 'estudio',
        accion: 'eliminar',
        detalles: `Eliminó la pregunta: "${preguntaOriginal.pregunta}"`,
        reversible: true,
        datos_originales: preguntaOriginal // Guardamos el JSON completo para poder restaurarlo
      });
    }

    res.json({ mensaje: 'Pregunta eliminada del sistema correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==========================================
// CONTROLADORES DE RESULTADOS
// ==========================================

export const guardarResultado = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Extraemos el ID del usuario directamente del token inyectado
    const usuarioId = (req as any).user.id;

    // 2. Combinamos el ID seguro con las respuestas que envía el frontend
    const datosAGuardar = {
      ...req.body,
      usuario_id: usuarioId
    };

    const { data, error } = await supabase
      .from('resultados_estudio')
      .insert([datosAGuardar])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerResultados = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('resultados_estudio')
      .select(`
        *,
        usuario (
          nombre,
          email,
          departamento
        )
      `)
      .order('fecha_completado', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};