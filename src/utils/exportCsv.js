// Generic array-of-objects -> CSV download. Used by Reports to export
// whatever breakdown table is currently on screen — works for any report
// shape without a bespoke exporter per report type.
function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// Shared by CSV/Excel exports — a blob response (e.g. from an
// axios `responseType: 'blob'` call) can't be rendered inline the way a PDF
// can via window.open, so both trigger an actual file download the same way.
export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename, rows) {
  if (!rows?.length) return;
  const columns = Object.keys(rows[0]);
  const lines = [
    columns.join(','),
    ...rows.map((row) => columns.map((col) => csvEscape(row[col])).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(filename.endsWith('.csv') ? filename : `${filename}.csv`, blob);
}
