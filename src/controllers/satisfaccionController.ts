import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { registrarAuditoria } from '../utils/auditoriaHelper';

// 1. Obtener todas las preguntas
export const obtenerPreguntas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('preguntas_satisfaccion')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

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
      .from('preguntas_satisfaccion')
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
        modulo: 'encuestas',
        accion: 'crear',
        detalles: `Añadió la pregunta de encuesta: "${data.pregunta}"`,
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
      .from('preguntas_satisfaccion')
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
        modulo: 'encuestas',
        accion: 'editar',
        detalles: `Editó la pregunta de encuesta: "${data.pregunta}"`,
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

    // A. Capturar datos originales
    const { data: preguntaOriginal, error: errorBusqueda } = await supabase
      .from('preguntas_satisfaccion')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusqueda) throw errorBusqueda;

    // B. Borrado lógico
    const { error } = await supabase
      .from('preguntas_satisfaccion')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;

    // C. REGISTRO DE AUDITORÍA REVERSIBLE
    const usuario = (req as any).user;
    if (usuario) {
      await registrarAuditoria({
        usuario_nombre: usuario.nombre || 'Administrador',
        usuario_email: usuario.email || 'No disponible',
        modulo: 'encuestas',
        accion: 'eliminar',
        detalles: `Eliminó la pregunta de encuesta: "${preguntaOriginal.pregunta}"`,
        reversible: true,
        datos_originales: preguntaOriginal
      });
    }

    res.json({ mensaje: 'Pregunta eliminada del sistema correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ... MANTENEMOS TUS DEMÁS FUNCIONES EXACTAMENTE IGUAL ...
// (enviarEncuesta, obtenerResultados, obtenerMiEstado, obtenerCodigoEncuesta, actualizarCodigoEncuesta, verificarCodigoEncuesta)

export const enviarEncuesta = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user.id;
  const { respuestas } = req.body;

  try {
    const { data: encuestaExistente, error: errorConsulta } = await supabase
      .from('encuestas_satisfaccion')
      .select('id')
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (errorConsulta) throw errorConsulta;

    if (encuestaExistente) {
      res.status(409).json({ error: 'Ya has completado la encuesta de satisfacción.' });
      return;
    }

    const { data: encuesta, error: errorEncuesta } = await supabase
      .from('encuestas_satisfaccion')
      .insert([{ usuario_id: usuarioId, estado: 'completada' }])
      .select('id')
      .single();

    if (errorEncuesta) throw errorEncuesta;

    const filasRespuestas = respuestas.map((r: any) => ({
      encuesta_id: encuesta.id,
      pregunta_id: r.pregunta_id,
      respuesta_numerica: r.respuesta_numerica ?? null,
      respuesta_texto: r.respuesta_texto ?? null,
    }));

    const { error: errorRespuestas } = await supabase
      .from('respuestas_satisfaccion')
      .insert(filasRespuestas);

    if (errorRespuestas) {
      await supabase.from('encuestas_satisfaccion').delete().eq('id', encuesta.id);
      throw errorRespuestas;
    }

    res.status(201).json({
      mensaje: '¡Encuesta de satisfacción enviada con éxito!',
      encuestaId: encuesta.id
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const obtenerResultados = async (req: Request, res: Response): Promise<void> => {
  const pagina = Math.max(parseInt(req.query.pagina as string) || 1, 1);
  const limite = Math.min(Math.max(parseInt(req.query.limite as string) || 10, 1), 100);
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  const { departamento, fechaDesde, fechaHasta } = req.query;

  try {
    let query = supabase
      .from('encuestas_satisfaccion')
      .select(`
        id,
        estado,
        fecha_completado,
        usuario:usuario_id!inner ( id, nombre, email, departamento ),
        respuestas:respuestas_satisfaccion (
          id,
          respuesta_numerica,
          respuesta_texto,
          pregunta:pregunta_id ( id, seccion, pregunta, orden, tipo_respuesta )
        )
      `, { count: 'exact' })
      .eq('estado', 'completada');

    if (departamento && typeof departamento === 'string') {
      query = query.eq('usuario.departamento', departamento);
    }
    if (fechaDesde && typeof fechaDesde === 'string') {
      query = query.gte('fecha_completado', fechaDesde);
    }
    if (fechaHasta && typeof fechaHasta === 'string') {
      query = query.lte('fecha_completado', `${fechaHasta}T23:59:59.999`);
    }

    const { data, error, count } = await query
      .order('fecha_completado', { ascending: false })
      .range(desde, hasta);

    if (error) throw error;

    res.json({
      resultados: data,
      paginacion: {
        pagina,
        limite,
        total: count ?? 0,
        totalPaginas: Math.ceil((count ?? 0) / limite)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerMiEstado = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user.id;

  try {
    const { data, error } = await supabase
      .from('encuestas_satisfaccion')
      .select('id')
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error) throw error;
    res.json({ completada: !!data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerCodigoEncuesta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('codigo_encuesta')
      .select('codigo, actualizado_en')
      .eq('id', 1)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarCodigoEncuesta = async (req: Request, res: Response): Promise<void> => {
  const { codigo } = req.body;

  try {
    const { data, error } = await supabase
      .from('codigo_encuesta')
      .update({ codigo, actualizado_en: new Date().toISOString() })
      .eq('id', 1)
      .select('codigo, actualizado_en')
      .single();

    if (error) throw error;

    // REGISTRO DE AUDITORÍA
    const usuario = (req as any).user;
    if (usuario) {
      await registrarAuditoria({
        usuario_nombre: usuario.nombre || 'Administrador',
        usuario_email: usuario.email || 'No disponible',
        modulo: 'encuestas',
        accion: 'editar',
        detalles: `Actualizó el código secreto de la encuesta.`,
        reversible: false
      });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const verificarCodigoEncuesta = async (req: Request, res: Response): Promise<void> => {
  const { codigo } = req.body;

  try {
    const { data, error } = await supabase
      .from('codigo_encuesta')
      .select('codigo')
      .eq('id', 1)
      .single();

    if (error) throw error;

    const valido = data.codigo.trim().toLowerCase() === String(codigo).trim().toLowerCase();
    res.json({ valido });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};