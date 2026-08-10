import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de tiempo: 15 minutos
  max: 15, // Permite un máximo de 15 solicitudes de registro/login por IP por ventana
  message: {
    error: "Demasiados intentos desde esta dirección IP. Por favor, inténtalo de nuevo en 15 minutos."
  },
  standardHeaders: true, // Envía información del límite en las cabeceras `RateLimit-*`
  legacyHeaders: false, // Desactiva las cabeceras obsoletas `X-RateLimit-*`
});