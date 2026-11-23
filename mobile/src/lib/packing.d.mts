export function nextPackingStatus(status: string): 'packed' | 'shipped' | null;
export function deliveryRequest(
  ref: { current: { fingerprint: string; key: string } | null },
  productId: string,
  qty: number,
  note: string,
  uuid: () => string,
): { body: { qty: number; note: string }; key: string };
