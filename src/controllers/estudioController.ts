import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

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
      .from('preguntas_estudio')
      .update({ activo: false }) // Solo la ocultamos
      .eq('id', id);

    if (error) throw error;
    res.json({ mensaje: 'Pregunta eliminada del sistema correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};