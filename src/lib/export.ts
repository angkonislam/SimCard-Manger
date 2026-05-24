// CSV export helpers. PDF deferred to print preview / window.print for now.

type Row = Record<string, string | number | null | undefined>;

const escapeCSV = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined) return '';
  const s = String(val);
  // Escape quotes by doubling, wrap if contains , " \n
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export function toCSV(headers: string[], rows: Row[]): string {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map(r =>
    headers.map(h => escapeCSV(r[h])).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}

export function downloadCSV(filename: string, headers: string[], rows: Row[]) {
  const csv = toCSV(headers, rows);
  // BOM ensures Excel recognizes UTF-8
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${filename}_${stamp}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Browser-native PDF via window.print on a hidden iframe with formatted HTML.
export function downloadPDF(title: string, html: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; }
      th { background: #f3f4f6; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
      tr:nth-child(even) td { background: #fafafa; }
      .meta { color: #6b7280; font-size: 11px; margin-bottom: 16px; }
    </style></head><body>${html}</body></html>`);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 250);
}

// Build PDF HTML table from headers/rows.
export function buildTableHTML(title: string, headers: string[], rows: Row[]): string {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  const trs = rows.map(r => `<tr>${headers.map(h => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('');
  return `<h1>${title}</h1>
    <p class="meta">Generated ${new Date().toLocaleString()} · ${rows.length} record${rows.length === 1 ? '' : 's'}</p>
    <table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}
