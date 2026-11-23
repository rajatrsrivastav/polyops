export function nextPackingStatus(status) {
  return status === 'pending' ? 'packed' : status === 'packed' ? 'shipped' : null;
}
export function deliveryRequest(ref, productId, qty, note, uuid) {
  const body = { qty, note: note.trim() };
  const fingerprint = JSON.stringify({ productId, ...body });
  if (!ref.current || ref.current.fingerprint !== fingerprint)
    ref.current = { fingerprint, key: uuid() };
  return { body, key: ref.current.key };
}
