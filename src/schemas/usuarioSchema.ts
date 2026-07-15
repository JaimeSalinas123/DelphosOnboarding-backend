import { z } from 'zod';

export const registroSchema = z.object({
  nombre: z.string({ message: "El nombre es obligatorio" })
           .min(3, "El nombre debe tener al menos 3 caracteres")
           // EVITA PRUEBA 2: Solo acepta letras (incluyendo acentos) y espacios
           .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "El nombre contiene caracteres no permitidos. Usa solo letras."),
           
  email: z.string({ message: "El correo es obligatorio" })
          .email("El formato del correo no es válido"),
          
  password: z.string({ message: "La contraseña es obligatoria" })
             .min(6, "La contraseña debe tener mínimo 6 caracteres"),
             
  departamento: z.string({ message: "El departamento es obligatorio" })
                 .min(2, "Debes especificar un departamento válido")
                 
}).strict(); // EVITA PRUEBA 4: Rechaza cualquier campo extra que no esté definido arriba

export const loginSchema = z.object({
  email: z.string({ message: "El correo es obligatorio" }).email("El formato del correo no es válido"),
  password: z.string({ message: "La contraseña es obligatoria" }).min(1, "La contraseña no puede estar vacía")
});