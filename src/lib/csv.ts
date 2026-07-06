export function downloadCsv<T>(
  filename: string,
  columns: { header: string; accessor: (row: T) => string | number }[],
  rows: T[],
) {
  const header = columns.map((c) => `"${c.header}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => `"${String(c.accessor(row)).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
