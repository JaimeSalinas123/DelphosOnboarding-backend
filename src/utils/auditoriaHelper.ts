import { supabase } from '../config/supabase';

export interface DatosAuditoria {
  usuario_nombre: string;
  usuario_email: string;
  modulo: 'estudio' | 'encuestas' | 'documentacion' | 'nuevos_conocimientos' | 'usuarios';
  accion: 'crear' | 'editar' | 'eliminar';
  detalles: string;
  reversible?: boolean;
  datos_originales?: any;
}

export const registrarAuditoria = async (datos: DatosAuditoria) => {
  try {
    const { error } = await supabase.from('auditoria').insert([{
      usuario_nombre: datos.usuario_nombre,
      usuario_email: datos.usuario_email,
      modulo: datos.modulo,
      accion: datos.accion,
      detalles: datos.detalles,
      reversible: datos.reversible || false,
      datos_originales: datos.datos_originales || null
    }]);

    if (error) console.error("Error guardando auditoría:", error);
  } catch (err) {
    console.error("Fallo inesperado en auditoría:", err);
  }
};