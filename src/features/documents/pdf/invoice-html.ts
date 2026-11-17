import { escapeHtml, formatMoney } from '@/features/documents/pdf/escape-html';
import type { Customer, Factory, InvoiceWithItems } from '@/shared/types/database';

export function buildInvoiceHtml(params: {
  factory: Factory;
  customer: Customer;
  invoice: InvoiceWithItems;
}): string {
  const { factory, customer, invoice } = params;
  const rows = invoice.invoice_items
    .map(
      (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="num">${item.qty}</td>
        <td class="num">${formatMoney(item.rate)}</td>
        <td class="num">${formatMoney(item.amount)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0f172a; padding: 28px; font-size: 13px; }
    h1 { margin: 0 0 4px; font-size: 26px; color: #1e3a5f; }
    .muted { color: #64748b; }
    .row { display: flex; justify-content: space-between; gap: 24px; margin-top: 24px; }
    .box { width: 48%; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 6px; text-align: left; }
    th { background: #f8fafc; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
    .num { text-align: right; white-space: nowrap; }
    .totals { margin-top: 16px; width: 260px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
    .grand { font-size: 18px; font-weight: 700; border-top: 2px solid #1e3a5f; margin-top: 8px; padding-top: 10px; }
    .notes { margin-top: 28px; padding: 12px; background: #f8fafc; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(factory.name)}</h1>
  <div class="muted">${escapeHtml(factory.address)}</div>
  <div class="muted">${factory.gstin ? `GSTIN: ${escapeHtml(factory.gstin)}` : ''}${factory.phone ? ` · ${escapeHtml(factory.phone)}` : ''}</div>

  <div class="row">
    <div class="box">
      <strong>Bill To</strong>
      <div>${escapeHtml(customer.name)}</div>
      <div class="muted">${escapeHtml(customer.address)}</div>
      <div class="muted">${customer.phone ? escapeHtml(customer.phone) : ''}</div>
      <div class="muted">${customer.gstin ? `GSTIN: ${escapeHtml(customer.gstin)}` : ''}</div>
    </div>
    <div class="box">
      <strong>Tax Invoice</strong>
      <div>No: ${escapeHtml(invoice.invoice_number)}</div>
      <div>Date: ${escapeHtml(invoice.invoice_date)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="num">Qty</th>
        <th class="num">Rate</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${formatMoney(invoice.subtotal)}</span></div>
    <div><span>GST / Tax</span><span>${formatMoney(invoice.tax)}</span></div>
    <div class="grand"><span>Total</span><span>${formatMoney(invoice.total)}</span></div>
  </div>

  ${
    invoice.notes
      ? `<div class="notes"><strong>Notes</strong><div>${escapeHtml(invoice.notes)}</div></div>`
      : ''
  }
</body>
</html>`;
}
