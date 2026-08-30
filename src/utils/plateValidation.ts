/** Placa colombiana: ABC123 (legacy) o ABC12D (Mercosur) */
const PLATE_PATTERN = /^[A-Z]{3}\d{2,3}[A-Z0-9]?$/;

export function normalizePlate(plate: string): string {
  return plate.replace(/\s|-/g, '').toUpperCase();
}

export function isValidColombianPlate(plate: string): boolean {
  return PLATE_PATTERN.test(normalizePlate(plate));
}

export function getPlateValidationError(plate: string): string | null {
  const normalized = normalizePlate(plate);
  if (!normalized) {
    return 'La placa es obligatoria.';
  }
  if (normalized.length < 5 || normalized.length > 7) {
    return 'Formato inválido. Ej: ABC123 o ABC12D.';
  }
  if (!isValidColombianPlate(normalized)) {
    return 'Formato inválido. Usa 3 letras + 2-3 números (opcional 1 carácter final).';
  }
  return null;
}
