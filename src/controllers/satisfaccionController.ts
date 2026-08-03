import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// 1. Obtener todas las preguntas (Solo las activas), en el orden en que se muestran en la encuesta
export const obtenerPreguntas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('preguntas_satisfaccion')
      .select('*')
      .eq('activo', true) // Filtro del borrado lógico
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
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Eliminar una pregunta (Borrado Lógico)
export const eliminarPregunta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('preguntas_satisfaccion')
      .update({ activo: false }) // Solo la ocultamos
      .eq('id', id);

    if (error) throw error;
    res.json({ mensaje: 'Pregunta eliminada del sistema correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Envío de la encuesta de satisfacción por parte del pasante (una sola vez por usuario)
export const enviarEncuesta = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user.id;
  const { respuestas } = req.body;

  try {
    // 1. Un usuario solo puede completar la encuesta una vez
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

    // 2. Creamos la encuesta ligada al usuario autenticado
    const { data: encuesta, error: errorEncuesta } = await supabase
      .from('encuestas_satisfaccion')
      .insert([{ usuario_id: usuarioId, estado: 'completada' }])
      .select('id')
      .single();

    if (errorEncuesta) throw errorEncuesta;

    // 3. Guardamos cada respuesta ligada a esa encuesta
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
      // Sin las respuestas la encuesta queda inconsistente: la revertimos
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

// 6. Listar las respuestas de todos los usuarios que completaron la encuesta (solo administradores, con paginación)
export const obtenerResultados = async (req: Request, res: Response): Promise<void> => {
  const pagina = Math.max(parseInt(req.query.pagina as string) || 1, 1);
  const limite = Math.min(Math.max(parseInt(req.query.limite as string) || 10, 1), 100);
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  try {
    const { data, error, count } = await supabase
      .from('encuestas_satisfaccion')
      .select(`
        id,
        estado,
        fecha_completado,
        usuario:usuario_id ( id, nombre, email, departamento ),
        respuestas:respuestas_satisfaccion (
          id,
          respuesta_numerica,
          respuesta_texto,
          pregunta:pregunta_id ( id, seccion, pregunta, orden, tipo_respuesta )
        )
      `, { count: 'exact' })
      .eq('estado', 'completada')
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
