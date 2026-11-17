import { escapeHtml } from '@/features/documents/pdf/escape-html';
import type { ChallanWithItems, Customer, Factory } from '@/shared/types/database';

export function buildChallanHtml(params: {
  factory: Factory;
  customer: Customer;
  challan: ChallanWithItems;
}): string {
  const { factory, customer, challan } = params;
  const rows = challan.challan_items
    .map(
      (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td class="num">${item.qty}</td>
        <td>${escapeHtml(item.unit)}</td>
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
    .num { text-align: right; }
    .notes { margin-top: 28px; padding: 12px; background: #f8fafc; border-radius: 8px; }
    .sign { margin-top: 48px; display: flex; justify-content: space-between; }
    .sign div { width: 40%; border-top: 1px solid #94a3b8; padding-top: 8px; text-align: center; color: #64748b; }
  </style>
</head>
<body>
  <h1>${escapeHtml(factory.name)}</h1>
  <div class="muted">${escapeHtml(factory.address)}</div>
  <div class="muted">${factory.gstin ? `GSTIN: ${escapeHtml(factory.gstin)}` : ''}${factory.phone ? ` · ${escapeHtml(factory.phone)}` : ''}</div>

  <div class="row">
    <div class="box">
      <strong>Deliver To</strong>
      <div>${escapeHtml(customer.name)}</div>
      <div class="muted">${escapeHtml(customer.address)}</div>
      <div class="muted">${customer.phone ? escapeHtml(customer.phone) : ''}</div>
    </div>
    <div class="box">
      <strong>Delivery Challan</strong>
      <div>No: ${escapeHtml(challan.challan_number)}</div>
      <div>Date: ${escapeHtml(challan.challan_date)}</div>
      <div>Vehicle: ${escapeHtml(challan.vehicle_no) || '—'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th class="num">Qty</th>
        <th>Unit</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  ${
    challan.notes
      ? `<div class="notes"><strong>Notes</strong><div>${escapeHtml(challan.notes)}</div></div>`
      : ''
  }

  <div class="sign">
    <div>Receiver signature</div>
    <div>Authorized signature</div>
  </div>
</body>
</html>`;
}
