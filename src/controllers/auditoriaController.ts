import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { registrarAuditoria } from '../utils/auditoriaHelper';
import fs from 'fs';
import path from 'path';

export const obtenerAuditoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pagina = 1, limite = 10, modulo, accion } = req.query;
    
    const page = parseInt(pagina as string, 10);
    const limit = parseInt(limite as string, 10);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase.from('auditoria').select('*', { count: 'exact' });

    if (modulo) query = query.eq('modulo', modulo);
    if (accion) query = query.eq('accion', accion);

    const { data, count, error } = await query.order('fecha', { ascending: false }).range(start, end);

    if (error) {
      if (error.code === '42P01') {
        res.json({ registros: [], paginacion: { total: 0, pagina: page, limite: limit, totalPaginas: 0 } });
        return;
      }
      throw error;
    }

    res.json({
      registros: data || [],
      paginacion: {
        total: count || 0,
        pagina: page,
        limite: limit,
        totalPaginas: Math.ceil((count || 0) / limit),
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener registros de auditoría' });
  }
};

export const rehacerAuditoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 1. Obtener el registro de auditoría a revertir
    const { data: registro, error: errorBusqueda } = await supabase
      .from('auditoria')
      .select('*')
      .eq('id', id)
      .single();

    if (errorBusqueda || !registro) {
      res.status(404).json({ error: 'Registro de auditoría no encontrado' });
      return;
    }

    if (!registro.reversible || !registro.datos_originales) {
      res.status(400).json({ error: 'Esta acción no se puede deshacer' });
      return;
    }

    let errorRestauracion = null;
    let detalleReversion = '';

    // =========================================================
    // LÓGICA DE RESTAURACIÓN (BASE DE DATOS VS ARCHIVOS TXT)
    // =========================================================
    if (registro.modulo === 'estudio') {
      const { error } = await supabase.from('preguntas_estudio').update({ activo: true }).eq('id', registro.datos_originales.id);
      errorRestauracion = error;
      detalleReversion = `[Restauración] Reactivó la pregunta: "${registro.datos_originales.pregunta}"`;

    } else if (registro.modulo === 'encuestas') {
      const { error } = await supabase.from('preguntas_satisfaccion').update({ activo: true }).eq('id', registro.datos_originales.id);
      errorRestauracion = error;
      detalleReversion = `[Restauración] Reactivó la pregunta de encuesta: "${registro.datos_originales.pregunta}"`;

    } else if (registro.modulo === 'documentacion') {
      // AQUÍ RESTAURAMOS EL ARCHIVO TXT FÍSICO
      const docPath = path.join(__dirname, '../docs/documentacion_delphos_IA.txt');
      fs.writeFileSync(docPath, registro.datos_originales.texto_anterior, 'utf8');
      detalleReversion = `[Restauración] Reestableció el archivo de Documentación IA a su estado anterior.`;

    } else if (registro.modulo === 'nuevos_conocimientos') {
      // AQUÍ RESTAURAMOS EL ARCHIVO TXT FÍSICO
      const conocimientosPath = path.join(__dirname, '../docs/nuevos_conocimientos.txt');
      fs.writeFileSync(conocimientosPath, registro.datos_originales.texto_anterior, 'utf8');
      detalleReversion = `[Restauración] Reestableció el archivo de Nuevos Conocimientos a su estado anterior.`;

    } else {
      res.status(400).json({ error: 'Este módulo no soporta restauración de datos en este momento' });
      return;
    }

    if (errorRestauracion) throw errorRestauracion;

    // 3. Marcar el registro original de auditoría como NO REVERSIBLE para evitar bucles infinitos
    await supabase.from('auditoria').update({ reversible: false }).eq('id', id);

    // 4. Dejar rastro en auditoría de que alguien revirtió esta acción
    const usuario = (req as any).user;
    if (usuario) {
      await registrarAuditoria({
        usuario_nombre: usuario.nombre || 'Administrador',
        usuario_email: usuario.email || 'No disponible',
        modulo: registro.modulo,
        accion: 'crear',
        detalles: detalleReversion,
        reversible: false
      });
    }

    res.json({ mensaje: 'El elemento ha sido restaurado exitosamente' });
  } catch (error: any) {
    console.error("Error al rehacer:", error);
    res.status(500).json({ error: 'Error al intentar deshacer la acción' });
  }
};