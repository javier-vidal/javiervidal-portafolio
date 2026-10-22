import { checkField } from './contact-rules';

// Mismos casos que backend/validate_test.go, para que ambos lados coincidan.
describe('checkField', () => {
  it.each([
    ['name', 'Ana Pérez', null],
    ['name', '   ', 'required'],
    ['name', 'A', 'too_short'],
    ['name', 'a'.repeat(101), 'too_long'],
    ['name', 'Ana\nBcc: x@y.com', 'invalid'],
    ['name', '<b>Ana</b>', 'html_not_allowed'],
    ['email', 'ana@example.com', null],
    ['email', ' ', 'required'],
    ['email', 'ana@', 'invalid'],
    ['email', 'ana@localhost', 'invalid'],
    ['email', 'Ana <ana@example.com>', 'invalid'],
    ['email', 'a'.repeat(250) + '@x.cl', 'too_long'],
    ['message', 'Hola,\nquiero conversar.', null],
    ['message', 'Si 3 < 5 entonces todo bien.', null],
    ['message', 'Hola', 'too_short'],
    ['message', 'a'.repeat(5001), 'too_long'],
    ['message', 'Hola <!-- oculto --> mundo', 'html_not_allowed'],
    ['message', 'Hola\u0000 quiero conversar', 'invalid'],
  ] as const)('%s %j -> %s', (field, value, expected) => {
    expect(checkField(field, value)).toBe(expected);
  });

  it('counts emoji as one character, like the backend', () => {
    expect(checkField('name', '😀')).toBe('too_short');
    expect(checkField('name', '😀😀')).toBeNull();
  });
});
