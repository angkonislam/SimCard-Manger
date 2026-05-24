// Generate branded invoice PDF via window.print on a hidden iframe.
// HTML/CSS tuned for A4 single-page output.

interface InvoicePdfInput {
  invoiceNumber: string;
  issueDate: string;
  customer: {
    customerId?: string;
    name: string;
    contact?: string;
    location?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  returnAmount?: number;
  total: number;
}

const fmtMoney = (n: number) =>
  n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

function buildHTML(inv: InvoicePdfInput): string {
  const rows = inv.items.map(item => `
    <tr>
      <td class="desc">
        <div class="desc-main">${escapeHtml(item.description)}</div>
        <div class="desc-sub">${item.quantity} × RM ${fmtMoney(item.unitPrice)}</div>
      </td>
      <td class="qty">${item.quantity}</td>
      <td class="rate">RM ${fmtMoney(item.unitPrice)}</td>
      <td class="amt">RM ${fmtMoney(item.quantity * item.unitPrice)}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(inv.invoiceNumber)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #111827;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 18mm 16mm;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 3px solid #10b981;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 24px;
      letter-spacing: -0.02em;
    }
    .brand-text h1 {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .brand-text p {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 600;
    }
    .inv-meta {
      text-align: right;
    }
    .inv-meta .label {
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 700;
    }
    .inv-meta .num {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.01em;
      margin-top: 4px;
      color: #111827;
    }
    .inv-meta .date {
      font-size: 12px;
      color: #4b5563;
      margin-top: 6px;
      font-weight: 600;
    }
    .blocks {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-top: 32px;
    }
    .block {
      flex: 1;
    }
    .block .label {
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .block-card {
      background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(59,130,246,0.06));
      border: 1px solid rgba(16,185,129,0.25);
      border-radius: 14px;
      padding: 14px 16px;
    }
    .customer-id {
      font-size: 9px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .customer-name {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
    }
    .customer-extra {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
      font-weight: 500;
    }
    .items {
      margin-top: 32px;
      width: 100%;
      border-collapse: collapse;
    }
    .items thead th {
      background: #f9fafb;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 700;
      padding: 12px 10px;
      text-align: left;
      border-bottom: 2px solid #e5e7eb;
    }
    .items thead th.qty,
    .items thead th.rate,
    .items thead th.amt { text-align: right; }
    .items tbody td {
      padding: 14px 10px;
      border-bottom: 1px solid #f3f4f6;
      font-size: 12px;
      color: #111827;
      vertical-align: top;
    }
    .items tbody td.qty,
    .items tbody td.rate,
    .items tbody td.amt {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .desc-main { font-weight: 700; }
    .desc-sub { font-size: 10px; color: #9ca3af; margin-top: 3px; font-weight: 500; }
    .summary {
      display: flex;
      justify-content: flex-end;
      margin-top: 28px;
    }
    .summary-box {
      width: 280px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
      color: #4b5563;
      font-weight: 600;
    }
    .summary-row.divider {
      border-top: 1px solid #e5e7eb;
      margin-top: 4px;
      padding-top: 12px;
    }
    .summary-row .val {
      font-variant-numeric: tabular-nums;
      color: #111827;
    }
    .total-card {
      margin-top: 12px;
      padding: 16px 18px;
      border-radius: 14px;
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-card .label {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-weight: 800;
    }
    .total-card .amount {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.01em;
      font-variant-numeric: tabular-nums;
    }
    .footer {
      margin-top: 48px;
      padding-top: 18px;
      border-top: 1px dashed #d1d5db;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #9ca3af;
      letter-spacing: 0.05em;
    }
    .footer strong { color: #4b5563; font-weight: 700; }
    .stamp {
      margin-top: 36px;
      display: flex;
      justify-content: flex-end;
    }
    .stamp .sig {
      width: 220px;
      border-top: 1px solid #111827;
      padding-top: 8px;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 700;
    }
    @media print {
      body { background: #fff; }
      .page { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        <div class="logo">SC</div>
        <div class="brand-text">
          <h1>SimCard Manager</h1>
          <p>Telecom Distribution</p>
        </div>
      </div>
      <div class="inv-meta">
        <p class="label">Invoice</p>
        <p class="num">${escapeHtml(inv.invoiceNumber)}</p>
        <p class="date">Issued ${fmtDate(inv.issueDate)}</p>
      </div>
    </div>

    <div class="blocks">
      <div class="block">
        <p class="label">Bill To</p>
        <div class="block-card">
          ${inv.customer.customerId ? `<p class="customer-id">ID: ${escapeHtml(inv.customer.customerId)}</p>` : ''}
          <p class="customer-name">${escapeHtml(inv.customer.name)}</p>
          ${inv.customer.contact ? `<p class="customer-extra">${escapeHtml(inv.customer.contact)}</p>` : ''}
          ${inv.customer.location ? `<p class="customer-extra">${escapeHtml(inv.customer.location)}</p>` : ''}
        </div>
      </div>
      <div class="block">
        <p class="label">Payment Terms</p>
        <div class="block-card">
          <p class="customer-name">Due on receipt</p>
          <p class="customer-extra">Currency: MYR</p>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="qty">Qty</th>
          <th class="rate">Rate</th>
          <th class="amt">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-box">
        <div class="summary-row">
          <span>Subtotal</span>
          <span class="val">RM ${fmtMoney(inv.subtotal)}</span>
        </div>
        ${inv.returnAmount ? `
        <div class="summary-row">
          <span>Return</span>
          <span class="val">− RM ${fmtMoney(inv.returnAmount)}</span>
        </div>` : ''}
        <div class="total-card">
          <span class="label">Total Due</span>
          <span class="amount">RM ${fmtMoney(inv.total)}</span>
        </div>
      </div>
    </div>

    <div class="stamp">
      <div class="sig">Authorized Signature</div>
    </div>

    <div class="footer">
      <span>Thank you for your business.</span>
      <span><strong>${escapeHtml(inv.invoiceNumber)}</strong> · Generated ${new Date().toLocaleDateString('en-GB')}</span>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string | number | undefined): string {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function downloadInvoicePDF(inv: InvoicePdfInput) {
  const html = buildHTML(inv);
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
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1500);
  }, 350);
}
