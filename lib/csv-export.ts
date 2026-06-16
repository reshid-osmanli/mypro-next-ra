// ============================================================================
// lib/csv-export.ts — Server-side CSV utility with filters
// ----------------------------------------------------------------------------
// New file: /lib/csv-export.ts
// Used by /api/admin/orders/export (improved version with filters)
// ============================================================================

export function csvCell(value: unknown) {
  if (value === null || value === undefined) return '""';
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsv(headers: string[], rows: unknown[][]) {
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ];
  return lines.join("\n");
}

/**
 * Convert Date to ISO without the trailing 'Z' for spreadsheet-friendly cells.
 */
export function fmtDate(value: Date | string | null | undefined) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().replace("Z", "");
}
