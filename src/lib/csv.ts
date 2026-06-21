import type { FormSettings, Submission } from "../types";

function safeCell(value: string) {
  const protectedValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}

export function buildCsv(rows: Submission[], settings: FormSettings) {
  const header = [
    settings.name_label,
    settings.number_16_label,
    settings.number_4_label,
    settings.number_3_label,
    "Recebido em",
    "ID",
  ];

  const lines = rows.map((row) => [
    row.name,
    row.number_16,
    row.number_4,
    row.number_3,
    row.created_at,
    row.id,
  ]);

  return `\uFEFF${[header, ...lines]
    .map((line) => line.map((cell) => safeCell(cell)).join(","))
    .join("\r\n")}`;
}

export function downloadCsv(
  rows: Submission[],
  settings: FormSettings,
  filename: string,
) {
  const blob = new Blob([buildCsv(rows, settings)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
