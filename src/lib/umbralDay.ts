/**
 * Helper para calcular la fecha del día en Umbral.
 * El corte diario ocurre a las 04:00 AM (no a medianoche).
 * Todo el tiempo antes de las 04:00 AM pertenece al día anterior.
 */
export function getUmbralDay(now: Date = new Date()): string {
  // Restamos 4 horas (4 * 60 * 60 * 1000 ms) para alinear el día con el corte a las 04:00
  const shifted = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
