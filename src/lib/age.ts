// Fechas en formato YYYY-MM-DD. "today" en UTC para coincidir con current_date de la base de datos.
export function ageOn(birthDate: string, today = new Date().toISOString().slice(0, 10)): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}
