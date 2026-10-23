import { ContactField, FieldReason, LIMITS } from './contact-rules';

const FIELD_MESSAGES: Record<ContactField, Partial<Record<FieldReason, string>>> = {
  name: {
    required: 'Escribe tu nombre.',
    too_short: `El nombre debe tener al menos ${LIMITS.name.min} caracteres.`,
    too_long: `El nombre puede tener hasta ${LIMITS.name.max} caracteres.`,
    invalid: 'El nombre contiene caracteres no permitidos.',
    html_not_allowed: 'El nombre no puede contener etiquetas HTML.',
  },
  email: {
    required: 'Escribe tu correo.',
    too_long: 'El correo es demasiado largo.',
    invalid: 'Revisa el correo; debe tener la forma nombre@dominio.cl.',
  },
  message: {
    required: 'Escribe tu mensaje.',
    too_short: `El mensaje debe tener al menos ${LIMITS.message.min} caracteres.`,
    too_long: `El mensaje puede tener hasta ${LIMITS.message.max} caracteres.`,
    invalid: 'El mensaje contiene caracteres no permitidos.',
    html_not_allowed: 'El mensaje no puede contener etiquetas HTML.',
  },
};

export const SUCCESS_MESSAGE = '¡Gracias! Tu mensaje fue enviado y te responderé pronto.';
export const INVALID_FORM_MESSAGE = 'Revisa los campos marcados antes de enviar.';
export const TOKEN_PENDING_MESSAGE =
  'Espera a que termine la verificación de seguridad o complétala, y vuelve a enviar.';
export const SLOW_SEND_MESSAGE = 'Enviando, puede tardar unos segundos…';
export const TURNSTILE_FAILED_MESSAGE =
  'No se pudo cargar la verificación de seguridad. Recarga la página o escríbeme al correo.';

export function fieldMessage(field: ContactField, reason: string): string {
  return FIELD_MESSAGES[field][reason as FieldReason] ?? 'Revisa este campo.';
}

/** Traduce un codigo de la API a un mensaje para la persona, sin detalles tecnicos. */
export function errorMessage(code: string, retryAfterSeconds?: number): string {
  switch (code) {
    case 'VALIDATION_ERROR':
      return INVALID_FORM_MESSAGE;
    case 'RATE_LIMITED': {
      const minutes = retryAfterSeconds ? Math.ceil(retryAfterSeconds / 60) : null;
      const wait = minutes ? `en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}` : 'en unos minutos';
      return `Enviaste varios mensajes seguidos. Intenta de nuevo ${wait}.`;
    }
    case 'DAILY_LIMIT_REACHED':
      return 'Hoy el formulario ya recibió todos los mensajes que puede enviar. Escríbeme por LinkedIn, con el botón de más arriba, y te responderé pronto.';
    case 'CAPTCHA_FAILED':
      return 'No se pudo confirmar que eres una persona. Completa la verificación y vuelve a enviar.';
    case 'CAPTCHA_UNAVAILABLE':
      return 'La verificación de seguridad no está disponible ahora. Intenta de nuevo en unos minutos.';
    case 'SEND_FAILED':
      return 'No se pudo enviar tu mensaje. Intenta más tarde o escríbeme directamente al correo.';
    case 'TIMEOUT':
      return 'El servidor tardó demasiado en responder. Intenta de nuevo en un momento.';
    case 'NETWORK_ERROR':
      return 'No hay conexión con el servidor. Revisa tu conexión e intenta de nuevo.';
    default:
      return 'Ocurrió un problema al enviar tu mensaje. Intenta de nuevo o escríbeme al correo.';
  }
}
