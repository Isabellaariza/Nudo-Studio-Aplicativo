/**
 * Utilidades de validación compartidas para todo el aplicativo.
 * Reglas:
 *  - Nombre: solo letras, tildes, ñ y espacios — sin números
 *  - Teléfono: solo dígitos, máximo 10 caracteres
 *  - Número de documento: solo dígitos, máximo 10 caracteres
 *  - Dirección colombiana: formato libre pero debe contener al menos una letra y un número
 */

// ── Nombre ────────────────────────────────────────────────────────────────────
/** Devuelve true si el carácter es válido para un nombre (letra, tilde, ñ, espacio, guion) */
const NOMBRE_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚäëïöüÄËÏÖÜñÑ\s\-']+$/;

/**
 * Filtra el input de nombre: permite letras, tildes, ñ, espacios y guiones.
 * Devuelve `{ value, error }`. Si hay caracteres inválidos devuelve el value sin ellos
 * y un mensaje de error; si es válido devuelve el value limpio y error vacío.
 */
export function filterNombre(raw: string): { value: string; error: string } {
  if (raw === '') return { value: '', error: '' };
  // Quitar caracteres inválidos
  const cleaned = raw.replace(/[0-9]/g, '');
  const hasInvalid = cleaned !== raw;
  if (!NOMBRE_REGEX.test(cleaned) && cleaned !== '') {
    return { value: cleaned, error: 'El nombre solo puede contener letras' };
  }
  return {
    value: cleaned,
    error: hasInvalid ? 'El nombre no puede contener números' : '',
  };
}

export function validateNombre(value: string): string {
  if (!value.trim()) return 'El nombre es obligatorio';
  if (!NOMBRE_REGEX.test(value.trim())) return 'El nombre solo puede contener letras';
  return '';
}

// ── Teléfono ──────────────────────────────────────────────────────────────────
/**
 * Filtra el input de teléfono: solo dígitos, máx 10.
 * Devuelve `{ value, error }`.
 */
export function filterTelefono(raw: string): { value: string; error: string } {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  let error = '';
  if (raw !== '' && raw.replace(/\D/g, '') !== raw.replace(/[^0-9]/g, '')) {
    error = 'El teléfono solo puede contener números';
  }
  return { value: digits, error };
}

export function validateTelefono(value: string): string {
  if (!value.trim()) return ''; // Teléfono es opcional en algunos formularios
  if (!/^\d+$/.test(value)) return 'El teléfono solo puede contener números';
  if (value.length !== 10) return 'El teléfono debe tener exactamente 10 dígitos';
  return '';
}

export function validateTelefonoRequerido(value: string): string {
  if (!value.trim()) return 'El teléfono es obligatorio';
  return validateTelefono(value);
}

// ── Número de documento ───────────────────────────────────────────────────────
/**
 * Filtra el input de número de documento: solo dígitos, máx 10.
 */
export function filterDocumento(raw: string): { value: string; error: string } {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  let error = '';
  if (raw !== '' && /\D/.test(raw)) {
    error = 'El número de documento solo puede contener dígitos';
  }
  return { value: digits, error };
}

export function validateDocumento(value: string): string {
  if (!value.trim()) return ''; // opcional en algunos formularios
  if (!/^\d+$/.test(value)) return 'El número de documento solo puede contener dígitos';
  if (value.length < 6 || value.length > 10)
    return 'El número de documento debe tener entre 6 y 10 dígitos';
  return '';
}

export function validateDocumentoRequerido(value: string): string {
  if (!value.trim()) return 'El número de documento es obligatorio';
  return validateDocumento(value);
}

// ── Dirección colombiana ──────────────────────────────────────────────────────
/**
 * Valida que la dirección tenga el formato básico colombiano.
 * Acepta: Calle/Cr/Av/Diag + número + #/No + número + - + número, o texto libre con letras y números.
 * No bloquea el tipeo — solo valida al enviar.
 */
const DIRECCION_COL_REGEX =
  /^(calle|cll|carrera|cr|cra|avenida|av|diagonal|diag|transversal|tv|manzana|mz|bloque|bl)[\s.\-]?\d+[\s.\-]?[a-z]?\s*(#|no\.?|num\.?)?\s*\d+[\s.\-]?\d*.*$/i;

export function validateDireccion(value: string): string {
  if (!value.trim()) return ''; // opcional en algunos formularios
  if (value.trim().length < 5) return 'La dirección es demasiado corta';
  // Debe tener al menos una letra y un número (dirección, no solo texto o solo números)
  if (!/[a-zA-Z]/.test(value)) return 'La dirección debe incluir el tipo de vía (Calle, Carrera, etc.)';
  if (!/\d/.test(value)) return 'La dirección debe incluir un número';
  return '';
}

export function validateDireccionRequerida(value: string): string {
  if (!value.trim()) return 'La dirección es obligatoria';
  return validateDireccion(value);
}
