import { INVALID_FORM_MESSAGE, errorMessage, fieldMessage } from './contact-messages';

describe('errorMessage', () => {
  it('maps each API code to a friendly message', () => {
    expect(errorMessage('VALIDATION_ERROR')).toBe(INVALID_FORM_MESSAGE);
    expect(errorMessage('CAPTCHA_FAILED')).toContain('verificación');
    expect(errorMessage('CAPTCHA_UNAVAILABLE')).toContain('no está disponible');
    expect(errorMessage('SEND_FAILED')).toContain('No se pudo enviar tu mensaje');
    expect(errorMessage('NETWORK_ERROR')).toContain('conexión');
  });

  it('tells how long to wait when the limit is reached', () => {
    expect(errorMessage('RATE_LIMITED', 600)).toBe(
      'Enviaste varios mensajes seguidos. Intenta de nuevo en 10 minutos.',
    );
    expect(errorMessage('RATE_LIMITED', 45)).toContain('en 1 minuto.');
    expect(errorMessage('RATE_LIMITED')).toContain('en unos minutos.');
  });

  it('never exposes technical details for unknown codes', () => {
    for (const code of ['INVALID_JSON', 'PAYLOAD_TOO_LARGE', 'ORIGIN_NOT_ALLOWED', 'UNKNOWN_ERROR']) {
      const message = errorMessage(code);
      expect(message).not.toContain(code);
      expect(message).toContain('Ocurrió un problema');
    }
  });
});

describe('fieldMessage', () => {
  it('maps backend reasons to messages for each field', () => {
    expect(fieldMessage('name', 'too_short')).toBe('El nombre debe tener al menos 2 caracteres.');
    expect(fieldMessage('email', 'invalid')).toContain('nombre@dominio.cl');
    expect(fieldMessage('message', 'too_long')).toBe('El mensaje puede tener hasta 5000 caracteres.');
    expect(fieldMessage('message', 'html_not_allowed')).toContain('etiquetas HTML');
  });

  it('falls back to a generic message for unknown reasons', () => {
    expect(fieldMessage('email', 'something_new')).toBe('Revisa este campo.');
  });
});
