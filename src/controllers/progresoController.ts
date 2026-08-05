import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// 1. El pasante marca un módulo del ecosistema como visitado.
// Idempotente: si ya lo había visitado, no falla ni duplica (UNIQUE usuario_id+modulo).
export const registrarModuloEcosistema = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user.id;
  const { modulo } = req.body;

  try {
    const { error } = await supabase
      .from('progreso_ecosistema')
      .upsert(
        { usuario_id: usuarioId, modulo },
        { onConflict: 'usuario_id,modulo', ignoreDuplicates: true }
      );

    if (error) throw error;
    res.status(201).json({ mensaje: 'Módulo registrado', modulo });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Progreso del usuario autenticado: porcentajes por etapa + qué módulos ya vio
// (para hidratar el store del ecosistema en el front al recargar la página).
export const obtenerMiProgreso = async (req: Request, res: Response): Promise<void> => {
  const usuarioId = (req as any).user.id;

  try {
    const [{ data: modulosVistos, error: errorModulos }, { data: progreso, error: errorProgreso }] =
      await Promise.all([
        supabase.from('progreso_ecosistema').select('modulo').eq('usuario_id', usuarioId),
        supabase.from('vista_progreso_pasante').select('*').eq('usuario_id', usuarioId).maybeSingle(),
      ]);

    if (errorModulos) throw errorModulos;
    if (errorProgreso) throw errorProgreso;

    res.json({
      modulosVistos: (modulosVistos ?? []).map((m) => m.modulo),
      progreso: progreso ?? {
        usuario_id: usuarioId,
        porcentaje_ecosistema: 0,
        porcentaje_estudio: 0,
        porcentaje_encuesta: 0,
        porcentaje_total: 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Progreso de todos los pasantes (solo administradores), paginado igual que
// obtenerResultados en satisfaccionController, para el panel de Métricas.
export const obtenerProgresoGeneral = async (req: Request, res: Response): Promise<void> => {
  const pagina = Math.max(parseInt(req.query.pagina as string) || 1, 1);
  const limite = Math.min(Math.max(parseInt(req.query.limite as string) || 10, 1), 100);
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  try {
    const { data, error, count } = await supabase
      .from('vista_progreso_pasante')
      .select('*', { count: 'exact' })
      .order('porcentaje_total', { ascending: false })
      .range(desde, hasta);

    if (error) throw error;

    res.json({
      progreso: data,
      paginacion: {
        pagina,
        limite,
        total: count ?? 0,
        totalPaginas: Math.ceil((count ?? 0) / limite),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
