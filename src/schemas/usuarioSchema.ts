import { z } from 'zod';

// Función para limpiar/sanitizar strings en el backend (Elimina <, >, caracteres de control y espacios extra)
const sanitizeString = (val: string) => {
  return val
    .replace(/[\u0000-\u001F\u007F]/g, '') // Elimina caracteres de control ASCII invisibles
    .replace(/[<>]/g, '')                // Evita inyección básica de etiquetas HTML/XSS
    .trim();
};

export const registroSchema = z.object({
  nombre: z.string({ message: "El nombre es obligatorio" })
           .transform(sanitizeString)
           .pipe(
             z.string()
              .min(3, "El nombre debe tener al menos 3 caracteres")
              .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "El nombre contiene caracteres no permitidos. Usa solo letras.")
           ),
           
  email: z.string({ message: "El correo es obligatorio" })
          .transform(val => sanitizeString(val).toLowerCase())
          .pipe(
            z.string()
             .email("El formato del correo no es válido")
             .max(150, "El correo electrónico es demasiado largo")
          ),
          
  password: z.string({ message: "La contraseña es obligatoria" })
             .min(8, "La contraseña debe tener mínimo 8 caracteres"), // Sincronizado con los 8+ del frontend
             
  departamento: z.string({ message: "El departamento es obligatorio" })
                 .transform(sanitizeString)
                 .pipe(
                   z.enum([
                     'Capital Humano', 
                     'La Plaza Digital', 
                     'Relaciones Corporativas', 
                     'Research & Development'
                   ], { 
                     message: "El departamento seleccionado no es válido." 
                   })
                 ),
                 
  // Honeypot: Campo opcional para que Zod no lo rechace con .strict() si lo envía un bot
  empresa_web: z.string().optional()
                 
})
.strict() // Rechaza inmediatamente cualquier campo extra enviado por Postman/Hacker (Prueba 4)
.refine((data) => {
  // Replicamos la regla de seguridad que bloquea datos personales en la contraseña
  const pwLower = data.password.toLowerCase();
  const emailLocal = data.email.split('@')[0];

  if (emailLocal && emailLocal.length >= 3 && pwLower.includes(emailLocal)) {
    return false;
  }

  // Separamos el nombre por espacios y filtramos palabras cortas para evitar coincidencias absurdas
  const nameParts = data.nombre.toLowerCase().split(/\s+/).filter(part => part.length >= 3);
  const containsName = nameParts.some(part => pwLower.includes(part));

  return !containsName;
}, {
  message: "La contraseña no debe contener tu nombre o tu correo electrónico.",
  path: ["password"] // Vincula el error directamente con el input de contraseña
});

export const loginSchema = z.object({
  email: z.string({ message: "El correo es obligatorio" })
          .transform(val => sanitizeString(val).toLowerCase())
          .pipe(z.string().email("El formato del correo no es válido")),
  password: z.string({ message: "La contraseña es obligatoria" }).min(1, "La contraseña no puede estar vacía")
});

// --- NUEVOS ESQUEMAS PARA RECUPERACIÓN DE CONTRASEÑA ---

export const recuperarSchema = z.object({
  email: z.string({ message: "El correo es obligatorio" })
          .transform(val => sanitizeString(val).toLowerCase())
          .pipe(z.string().email("El formato del correo no es válido"))
});

export const resetearSchema = z.object({
  access_token: z.string({ message: "Token de acceso faltante o inválido" }),
  refresh_token: z.string({ message: "Token de refresco faltante o inválido" }),
  new_password: z.string({ message: "La nueva contraseña es obligatoria" })
                 .min(8, "La contraseña debe tener mínimo 8 caracteres")
});