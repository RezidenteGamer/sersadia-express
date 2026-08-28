// The HR system's "Nº pess." / MBRF employee ID is always 8 digits,
// zero-padded (e.g. "00332231"). Older data in this app was stored
// unpadded (e.g. "332231"), which silently breaks matching against the
// HR spreadsheet and against auth profiles. Normalize everywhere an ID
// is entered or imported so the whole system uses one consistent format.
export function normalizeMbrfId(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.padStart(8, '0').slice(-8);
}
