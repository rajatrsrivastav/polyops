# Packbay privacy notice

This notice describes the implementation. Before onboarding a real shop, the operator must publish their contact address, retention period, and backup policy below. Until those details are completed, this workspace is for synthetic demo data only.

## What is stored

Packbay stores shop and product records, staff and owner email addresses and Firebase identifiers, customer names and phone numbers supplied with orders, order history, and a stock movement ledger. Firebase manages sign-in credentials; Packbay does not store passwords.

## Why and who can see it

This data supports ordering, stock control, dispatch, and aggregate reporting. Owners can access their shop’s records. Packing staff can see customer names, products, quantities, order progress, and inventory; the staff API excludes prices, revenue, and customer phone numbers. Staff and owners cannot access another shop’s data.

## AI summaries

When enabled by the operator, Gemini receives aggregate sales totals, top product names and quantities, and low-stock product names and counts. Customer records and contact details are excluded. Product names are untrusted input. Summaries use validated output and a template fallback. Never put personal information into product names.

## Hosting and logs

The intended providers are Firebase Authentication, MongoDB Atlas, an API host such as Render, and Vercel for the web client. The mobile build uses Expo EAS. Their terms and locations must be reviewed before a pilot. Request logs exclude authentication headers, cookies, customer contact details, and bodies. Optional error reporting must be configured without personal data.

## Retention and deletion

Operator retention period: not yet configured. Operator privacy contact: not yet configured. Do not onboard real customers until both are published. A shop can request removal through its administrator; the operator uses the documented deletion procedure, including Firebase accounts and backup expiry. Financial or legal retention obligations must be checked before deletion.

## Questions and consent

Participation in a pilot is voluntary. The operator must explain the pilot and this notice, obtain the seller’s written agreement, and provide a working contact channel before accepting real shop data.
