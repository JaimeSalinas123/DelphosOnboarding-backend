import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase';
import { registrarAuditoria } from '../utils/auditoriaHelper';

const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || '').trim());

// ============================================================================
// DICCIONARIO DE CONTINGENCIA (FALLBACK) Y MENÚ DE EMERGENCIA
// ============================================================================
const bancoRespuestas: Record<string, string> = {
  "1": "Delphos es una plataforma modular de Gobierno, Riesgo y Cumplimiento (GRC) en la nube, que integra planificación estratégica, gestión de riesgos, continuidad del negocio, cumplimiento normativo y gestión del desempeño en un solo sistema. Es una solución SaaS (también disponible bajo licencia), construida sobre Oracle Cloud, y está certificada bajo la norma ISO/IEC 27001:2022 de Seguridad de la Información. Es multiplataforma, con acceso vía web y aplicaciones móviles (Android e iOS).",
  "2": "DEINSA Global Intelligence es la empresa desarrolladora de Delphos, con sede en San José, Costa Rica, y socio estratégico en Gobernanza Corporativa. Tiene más de 35 años de trayectoria (desde los años 90), presencia en 4 continentes y más de 500 clientes/instituciones. Sus servicios incluyen: planificación y desempeño estratégico, gestión de riesgos y cumplimiento normativo, optimización de procesos y TI, implementación de estándares internacionales (ISO 31000, ISO 27001, ISO 22301, COSO ERM), y servicios de implementación, capacitación y soporte continuo.",
  "3": "GRC es el marco que da nombre y propósito a Delphos, y organiza la gestión institucional en tres pilares: Gobierno (alineación de equipos y medición del desempeño en tiempo real, con transparencia y rendición de cuentas), Riesgo (identificación de amenazas y planes de continuidad operativa para anticipar y mitigar problemas) y Cumplimiento (repositorio auditable para garantizar el apego a normativas nacionales e internacionales). La idea central es integrar en un solo sistema la planificación, el control de riesgos y el cumplimiento normativo.",
  "4": "Misión: Desarrollar y ofrecer soluciones de software de vanguardia, como Delphos, que empoderen a los clientes para optimizar su gobernanza, mejorar la toma de decisiones, garantizar el cumplimiento normativo y alcanzar sus objetivos estratégicos.\n\nVisión: Ser el proveedor líder en Latinoamérica de soluciones de software para Gobernanza Corporativa, impulsando la transformación digital en los sectores público y financiero.\n\nValores: Integridad, Excelencia, Innovación, Compromiso, Trabajo en Equipo, Seguridad y Responsabilidad Social.",
  "5": "Delphos Core es el módulo de Planificación Estratégica, descrito como el 'lóbulo frontal' o 'GPS' de la institución. Define hacia dónde va la organización y monitorea su avance, centralizando planificación, proyectos, indicadores y presupuesto. Registra visión, misión, valores y mapa estratégico; crea Planes Anuales Operativos (PAO); gestiona proyectos con tareas e hitos; y muestra dashboards en tiempo real. Gestiona planes como PETIC, PAO, PEI y POI, y es compatible con BSC y GpRD.",
  "6": "Delphos Continuum es el módulo de Continuidad del Negocio y Gestión de Riesgos, bajo el lema 'del riesgo a la resiliencia'. Prepara a la organización para recuperarse de fallos tecnológicos, emergencias o ciberataques. Identifica procesos críticos mediante el Análisis de Impacto en el Negocio (BIA), calcula el tiempo tolerable de interrupción (MTPD, RTO y RPO), permite crear Planes de Recuperación ante Desastres (DRP), y gestiona riesgos operativos, TI y activos sensibles. Su flujo de trabajo sigue 4 pasos: Amenaza → Evaluación → Plan de respuesta → Continuidad.",
  "7": "Delphos Elite es el módulo de Gestión del Desempeño, creado para el cumplimiento de la Ley N.° 9635 de Costa Rica. Conecta los objetivos estratégicos institucionales con las metas individuales de cada colaborador mediante una cascada de objetivos. Gestiona evaluaciones de desempeño 360° con múltiples evaluadores, genera Planes de Desarrollo Individual (PDI), y ofrece a cada colaborador un panel personal con tareas, indicadores, competencias y capacitaciones.",
  "8": "Delphos BI es el módulo de Business Intelligence que convierte datos en información relevante para planificar, monitorear y evaluar el desempeño institucional en tiempo real. Ofrece dashboards personalizables, reportes gerenciales, cubos multidimensionales (OLAP) con drill-down, y alertas automáticas. Se conecta a múltiples fuentes (SQL Server, Oracle, MySQL, Excel, CSV, entre otras), no solo a datos internos de Delphos. Es similar a Power BI o Tableau, pero permite además gestionar los datos de origen, y cuenta con IA integrada para analizar patrones y recomendar acciones.",
  "9": "Delphos Funciona (también 'Delphos Funcion@') es el motor de análisis estadístico, simulación y pronóstico avanzado. Incluye más de 13 métodos de pronóstico estadístico, modelado de escenarios, análisis de series de tiempo y tendencias, e integración directa con planificación e indicadores (KPIs). Se aplica en finanzas, personas, estrategia, indicadores, operaciones y riesgos, siguiendo el flujo: Datos → Patrones → Predicción → Decisión.",
  "10": "Delphos AI (o Delphos IA) es una capa de inteligencia artificial integrada de forma transversal en toda la plataforma —no es un componente aislado—, bajo el lema 'la inteligencia que trabaja contigo, no en lugar de ti'. Genera riesgos y controles automáticamente, redacta planes de acción e indicadores, responde preguntas sobre datos institucionales como analista virtual, y anticipa fallas o desviaciones antes de que ocurran. Es compatible con modelos de IA del mercado como ChatGPT, Gemini, Claude, DeepSeek y LLaMA.",
  "11": "Delphos Mobile es la aplicación oficial de Delphos para dispositivos móviles (Android e iOS, descarga gratuita), que permite gestionar la institución desde cualquier lugar y momento. Da acceso completo a indicadores, metas, riesgos y proyectos; permite aprobar documentos y flujos de trabajo desde el teléfono; y envía notificaciones en tiempo real sobre alertas, vencimientos y nuevas asignaciones, todo con seguridad empresarial (accesos encriptados).",
  "12": "Delphos Portal ofrece portales institucionales personalizados para la comunicación e interacción interna y externa. Conecta al Gobierno (coordinación efectiva), a los Ciudadanos (información clara y accesible), a las Instituciones (colaboración entre entidades públicas) y a los Colaboradores (trabajo colaborativo interno). Su diferencial es la integración nativa con Delphos Core y Delphos Continuum, lo que automatiza el flujo de información y mejora la transparencia organizacional.",
  "13": "Delphos está alineado con: ISO/IEC 27001:2022 (Seguridad de la Información), ISO 9001 (Gestión de la Calidad), ISO 22301 (Continuidad del Negocio), ISO 31000 (Gestión de Riesgos), COSO ERM (Gestión del Riesgo Empresarial), COBIT 2019 (Gobernanza y Gestión de TI), ITIL (gestión de servicios de TI) y SEVRI. En Costa Rica, el MICITT exige a las instituciones públicas implementar 35 de los 40 objetivos de COBIT 2019 en dos años.",
  "14": "Entre los beneficios están: decisiones más rápidas, menos riesgos y más control, equipos alineados y auditorías más simples. A nivel operativo, mejora la supervisión en tiempo real y automatiza reportes. Se ha implementado en más de 500 instituciones en 4 continentes, incluyendo Costa Rica (Presidencia, municipalidades, MIDEPLAN, BCR, ICE), México, Colombia, Guatemala, Bolivia, República Dominicana y Estados Unidos."
};

const menuContingencia = `Mis servidores están experimentando mucha demanda en este momento 😵‍💫, pero no te dejaré con la duda. Escribe el número de la pregunta que quieras hacer:

1️⃣ ¿Qué es Delphos, infraestructura y seguridad?
2️⃣ ¿Qué es DEINSA Global Intelligence?
3️⃣ ¿Qué es el modelo GRC y sus pilares?
4️⃣ Misión, visión y valores
5️⃣ Módulo Delphos Core
6️⃣ Módulo Delphos Continuum
7️⃣ Módulo Delphos Elite
8️⃣ Módulo Delphos BI
9️⃣ Módulo Delphos Funciona
🔟 Módulo Delphos AI
1️⃣1️⃣ Aplicación Delphos Mobile
1️⃣2️⃣ Delphos Portal
1️⃣3️⃣ Estándares y normas (ISO, COBIT, etc.)
1️⃣4️⃣ Beneficios y casos de éxito de delphos

Solo envía el número y te responderé al instante. 👇`;

// ============================================================================
// ENDPOINTS DE CHAT
// ============================================================================

export const obtenerHistorial = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = (req as any).user?.id;

    if (!usuarioId) {
      res.status(401).json({ error: 'No autorizado. Usuario no identificado.' });
      return;
    }

    const { data, error } = await supabase
      .from('mensaje_chat')
      .select('rol, texto, fecha_creacion')
      .eq('usuario_id', usuarioId)
      .order('fecha_creacion', { ascending: true });

    if (error) {
      console.error("Error consultando Supabase mensaje_chat:", error);
      throw error;
    }

    res.json({ historial: data || [] });
  } catch (error: any) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ error: 'Error al recuperar el historial del chat.' });
  }
};

export const preguntarChatbot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pregunta } = req.body;
    const usuarioId = (req as any).user?.id;

    if (!pregunta) {
      res.status(400).json({ error: 'La pregunta es obligatoria' });
      return;
    }

    if (!usuarioId) {
      res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación.' });
      return;
    }

    const inputLimpio = pregunta.trim();

    // ------------------------------------------------------------------------
    // CORTOCIRCUITO (FAST-TRACK)
    // ------------------------------------------------------------------------
    if (bancoRespuestas[inputLimpio]) {
      await supabase.from('mensaje_chat').insert([{ usuario_id: usuarioId, rol: 'usuario', texto: inputLimpio }]);
      const respuestaRapida = bancoRespuestas[inputLimpio];
      await supabase.from('mensaje_chat').insert([{ usuario_id: usuarioId, rol: 'bot', texto: respuestaRapida }]);
      res.json({ respuesta: respuestaRapida });
      return;
    }

    // ------------------------------------------------------------------------
    // GUARDAR MENSAJE DEL USUARIO
    // ------------------------------------------------------------------------
    const { error: errorUsuario } = await supabase.from('mensaje_chat').insert([
      { usuario_id: usuarioId, rol: 'usuario', texto: inputLimpio }
    ]);

    if (errorUsuario) {
      console.error("Error al guardar mensaje del usuario:", errorUsuario);
    }

    // ------------------------------------------------------------------------
    // PREPARAR CONOCIMIENTO Y MODELO (CORRECCIÓN DE RUTA)
    // ------------------------------------------------------------------------
    // Utilizamos process.cwd() para buscar siempre desde la raíz del proyecto
    const rutaDocumento = path.join(process.cwd(), 'src/docs/documentacion_delphos_IA.txt');
    let conocimientoDelphos = '';
    
    if (fs.existsSync(rutaDocumento)) {
      conocimientoDelphos = fs.readFileSync(rutaDocumento, 'utf-8');
    } else {
      console.warn("⚠️ ALERTA CRÍTICA: No se encontró el documento en:", rutaDocumento);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const promptOficial = `
      Eres el asistente de onboarding de la plataforma Delphos (un sistema GRC).
      
      BASE DE CONOCIMIENTO (Tu única fuente de verdad):
      ---
      ${conocimientoDelphos}
      ---
      
      REGLAS:
      1. Responde a la pregunta basándote estrictamente en la base de conocimiento.
      2. Si la pregunta pide listar o explicar los módulos, menciónalos con naturalidad sin parecer un robot.
      3. PROHIBIDO usar formato Markdown (ni asteriscos, ni numerales). Responde en texto plano amigable y usa emojis.
      4. Si la pregunta no tiene NADA que ver con Delphos o no está en tu base de conocimiento, responde SOLAMENTE con la palabra: FALTA_DOC
      
      Usuario: ${inputLimpio}
    `;

    // ------------------------------------------------------------------------
    // BUCLE DE REINTENTOS: EXPONENTIAL BACKOFF (5 INTENTOS MAX)
    // ------------------------------------------------------------------------
    let respuestaTexto = '';
    let exito = false;
    const maxIntentos = 5; // Aumentado a 5 (Punto Dulce)
    let tiempoEspera = 2000; // Base: 2 segundos

    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        const resultOficial = await model.generateContent(promptOficial);
        respuestaTexto = resultOficial.response.text().trim();
        exito = true;
        break; // Éxito, abortar bucle
      } catch (error: any) {
        const isRateLimit = error.status === 429 || error.message?.includes('429');
        const isUnavailable = error.status === 503 || error.message?.includes('503');

        if (isRateLimit || isUnavailable) {
          console.warn(`[Gemini API] Intento ${intento} de ${maxIntentos} fallido (429/503). Reintentando en ${tiempoEspera}ms...`);
          
          if (intento < maxIntentos) {
            await new Promise(resolve => setTimeout(resolve, tiempoEspera));
            tiempoEspera *= 2; // Incrementar espera (2s -> 4s -> 8s -> 16s)
          } else {
            console.error(`[Gemini API] Se agotaron los ${maxIntentos} intentos de recuperación.`);
          }
        } else {
          // Error crítico (ej. Auth, Sintaxis), abortar reintentos y enviar al catch global
          console.error(`[Gemini API] Error crítico no recuperable:`, error.message);
          throw error; 
        }
      }
    }

    // ------------------------------------------------------------------------
    // MANEJO DE FALLO DEFINITIVO POR EXCESO DE TRÁFICO
    // ------------------------------------------------------------------------
    if (!exito) {
      await supabase.from('mensaje_chat').insert([{ usuario_id: usuarioId, rol: 'bot', texto: menuContingencia }]);
      res.json({ respuesta: menuContingencia });
      return;
    }

    // ------------------------------------------------------------------------
    // FLUJO 'FALTA_DOC' Y NUEVOS CONOCIMIENTOS (CORRECCIÓN DE RUTA)
    // ------------------------------------------------------------------------
    if (respuestaTexto.includes('FALTA_DOC')) {
      respuestaTexto = "Lo siento, no tengo información sobre ese tema en mi base de conocimiento oficial de Onboarding. ¿Te puedo ayudar con alguna otra duda sobre la plataforma Delphos?";
      
      const rutaNuevos = path.join(process.cwd(), 'src/docs/nuevos_conocimientos.txt');
      const registro = `\n===============================================================================\n## ${inputLimpio}\n===============================================================================\nFecha de captura: ${new Date().toLocaleString('es-SV')}\n\n`;
      fs.appendFileSync(rutaNuevos, registro, 'utf-8');
    }

    const { error: errorBot } = await supabase.from('mensaje_chat').insert([
      { usuario_id: usuarioId, rol: 'bot', texto: respuestaTexto }
    ]);

    if (errorBot) {
      console.error("Error al guardar mensaje del bot:", errorBot);
    }

    res.json({ respuesta: respuestaTexto });

  } catch (error: any) {
    console.error("Error fatal en el flujo de IA:", error);
    
    // Fallback de seguridad extrema si cae en el catch global
    const usuarioId = (req as any).user?.id;
    if (usuarioId) {
      await supabase.from('mensaje_chat').insert([
        { usuario_id: usuarioId, rol: 'bot', texto: menuContingencia }
      ]);
    }
    
    res.json({ respuesta: menuContingencia });
  }
};

// ============================================================================
// ENDPOINTS DE DOCUMENTACIÓN IA (CORRECCIÓN DE RUTA)
// ============================================================================

const docPath = path.join(process.cwd(), 'src/docs/documentacion_delphos_IA.txt');

export const obtenerDocumentacion = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!fs.existsSync(docPath)) {
      res.status(404).json({ error: 'El archivo de documentación no existe en el servidor.' });
      return;
    }
    const contenido = fs.readFileSync(docPath, 'utf8');
    res.json({ contenido });
  } catch (error: any) {
    console.error("Error al leer el archivo de la IA:", error);
    res.status(500).json({ error: 'Error interno al leer el archivo de la IA.' });
  }
};

export const guardarDocumentacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contenido } = req.body;
    
    if (contenido === undefined) {
      res.status(400).json({ error: 'El contenido es obligatorio.' });
      return;
    }

    // 1. ANTES de sobrescribir, leemos el archivo actual para guardarlo en la base de datos
    const textoAnterior = fs.existsSync(docPath) ? fs.readFileSync(docPath, 'utf8') : '';

    // 2. Sobrescribimos el archivo físico
    fs.writeFileSync(docPath, contenido, 'utf8');

    // 3. Dejamos huella en la Auditoría (Esto permite "Rehacer" enviando el texto_anterior)
    const usuario = (req as any).user;
    if (usuario) {
      await registrarAuditoria({
        usuario_nombre: usuario.nombre || 'Administrador',
        usuario_email: usuario.email || '',
        modulo: 'documentacion',
        accion: 'editar',
        detalles: `Editó el archivo maestro de Documentación IA.`,
        reversible: true,
        datos_originales: { texto_anterior: textoAnterior, id: 'doc_maestra' } 
      });
    }

    res.json({ mensaje: 'Documentación de IA actualizada con éxito.' });
  } catch (error: any) {
    console.error("Error al escribir el archivo de la IA:", error);
    res.status(500).json({ error: 'Error interno al escribir el archivo de la IA.' });
  }
};

// ============================================================================
// ENDPOINTS DE NUEVOS CONOCIMIENTOS (CORRECCIÓN DE RUTA)
// ============================================================================

const nuevosConocimientosPath = path.join(process.cwd(), 'src/docs/nuevos_conocimientos.txt');

export const obtenerNuevosConocimientos = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!fs.existsSync(nuevosConocimientosPath)) {
      res.json({ contenido: '' });
      return;
    }
    const contenido = fs.readFileSync(nuevosConocimientosPath, 'utf8');
    res.json({ contenido });
  } catch (error: any) {
    console.error("Error al leer el archivo de nuevos conocimientos:", error);
    res.status(500).json({ error: 'Error interno al leer los nuevos conocimientos.' });
  }
};

export const guardarNuevosConocimientos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contenido } = req.body;
    
    if (contenido === undefined) {
      res.status(400).json({ error: 'El contenido es obligatorio.' });
      return;
    }

    // 1. CAPTURAR EL TEXTO ANTERIOR
    const textoAnterior = fs.existsSync(nuevosConocimientosPath) ? fs.readFileSync(nuevosConocimientosPath, 'utf8') : '';
    
    // 2. ESCRIBIR EL NUEVO
    fs.writeFileSync(nuevosConocimientosPath, contenido, 'utf8');

    // 3. GUARDAR AUDITORÍA
    const usuario = (req as any).user;
    if (usuario) {
      await registrarAuditoria({
        usuario_nombre: usuario.nombre || 'Administrador',
        usuario_email: usuario.email || '',
        modulo: 'nuevos_conocimientos',
        accion: 'editar', 
        detalles: `Modificó/Eliminó registros en el archivo de Nuevos Conocimientos.`,
        reversible: true,
        datos_originales: { texto_anterior: textoAnterior, id: 'nuevos_conocimientos' } 
      });
    }

    res.json({ mensaje: 'Nuevos conocimientos actualizados con éxito.' });
  } catch (error: any) {
    console.error("Error al escribir el archivo de nuevos conocimientos:", error);
    res.status(500).json({ error: 'Error interno al escribir los nuevos conocimientos.' });
  }
};