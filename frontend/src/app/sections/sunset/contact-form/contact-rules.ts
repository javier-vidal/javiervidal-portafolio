// Mismas reglas que backend/validate.go. El backend sigue siendo la autoridad.

export type ContactField = 'name' | 'email' | 'message';
export type FieldReason = 'required' | 'too_short' | 'too_long' | 'invalid' | 'html_not_allowed';

export const LIMITS = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  message: { min: 10, max: 5000 },
};

const HTML_TAG = /<[a-zA-Z/!?]/;
const ANY_CONTROL_CHAR = /\p{Cc}/u;
const CONTROL_CHAR_EXCEPT_NEWLINES = /[^\P{Cc}\n\r\t]/u;
const PLAIN_EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

/** Devuelve el motivo del error del campo, o null si es valido. */
export function checkField(field: ContactField, raw: string): FieldReason | null {
  const value = raw.trim();
  if (field === 'email') {
    if (value === '') return 'required';
    if (length(value) > LIMITS.email.max) return 'too_long';
    return PLAIN_EMAIL.test(value) ? null : 'invalid';
  }

  const { min, max } = LIMITS[field];
  const control = field === 'message' ? CONTROL_CHAR_EXCEPT_NEWLINES : ANY_CONTROL_CHAR;
  if (value === '') return 'required';
  if (control.test(value)) return 'invalid';
  if (length(value) < min) return 'too_short';
  if (length(value) > max) return 'too_long';
  if (HTML_TAG.test(value)) return 'html_not_allowed';
  return null;
}

// Cuenta caracteres como Go cuenta runas, para que un emoji valga uno.
function length(value: string): number {
  return [...value].length;
}
