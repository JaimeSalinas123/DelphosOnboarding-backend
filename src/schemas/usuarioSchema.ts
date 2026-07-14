import { z } from 'zod';

export const registroSchema = z.object({
  // Usamos "message" en lugar de "required_error"
  nombre: z.string({ message: "El nombre es obligatorio" })
           .min(3, "El nombre debe tener al menos 3 caracteres"),
           
  email: z.string({ message: "El correo es obligatorio" })
          .email("El formato del correo no es válido"),
          
  password: z.string({ message: "La contraseña es obligatoria" })
             .min(6, "La contraseña debe tener mínimo 6 caracteres"),
             
  departamento: z.string({ message: "El departamento es obligatorio" })
                 .min(2, "Debes especificar un departamento válido")
});

// nuevo schema para el login
export const loginSchema = z.object({
  email: z.string({ message: "El correo es obligatorio" }).email("El formato del correo no es válido"),
  password: z.string({ message: "La contraseña es obligatoria" }).min(1, "La contraseña no puede estar vacía")
});