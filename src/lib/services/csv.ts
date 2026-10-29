/**
 * Export CSV (séparateur « ; », compatible Excel en français).
 * Protège contre l'injection de formules : toute cellule commençant par
 * =, +, -, @, tabulation ou retour chariot est préfixée d'une apostrophe.
 */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

function escapeCell(raw: string | number | boolean | null | undefined): string {
  if (raw === null || raw === undefined) return "";
  let cell = String(raw);
  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
  if (/[";\n\r]/.test(cell)) cell = `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((c) => escapeCell(c.header)).join(";")];
  for (const row of rows) lines.push(columns.map((c) => escapeCell(c.value(row))).join(";"));
  // BOM UTF-8 pour un affichage correct des accents dans Excel.
  return `﻿${lines.join("\r\n")}\r\n`;
}
