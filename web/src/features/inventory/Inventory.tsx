import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Product, Page, Movement } from '../../lib/types';
import { dateTime } from '../../lib/format.mjs';
import { PageTitle, State, Pager, Modal, Badge } from '../../components/ui';
import { ReceiveForm } from '../products/Products';
function Ledger({ product, close }: { product: Product; close: () => void }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['movements', product._id, page],
    queryFn: () => api<Page<Movement>>(`/products/${product._id}/movements?page=${page}`),
  });
  return (
    <Modal title={`${product.name} · Stock ledger`} close={close}>
      <State loading={query.isPending} error={query.error} empty={query.data?.total === 0}>
        <ul className="stock-list">
          {query.data?.items.map((item) => (
            <li key={item._id}>
              <div>
                <Badge status={item.type} />
                <small>
                  {dateTime(item.createdAt)}
                  {item.note && ` · ${item.note}`}
                </small>
              </div>
              <div className="text-right">
                <strong>
                  {item.type === 'reserve' ? '−' : '+'}
                  {item.qty} units
                </strong>
                <small>{item.balanceAfter} on shelf after</small>
              </div>
            </li>
          ))}
        </ul>
      </State>
      {query.data && <Pager total={query.data.total} page={page} setPage={setPage} />}
    </Modal>
  );
}
export function Inventory() {
  const [page, setPage] = useState(1);
  const [lowStock, setLowStock] = useState(false);
  const [receive, setReceive] = useState<Product | null>(null);
  const [ledger, setLedger] = useState<Product | null>(null);
  const query = useQuery({
    queryKey: ['products', 'inventory', { page, lowStock }],
    queryFn: () => api<Page<Product>>(`/products?page=${page}&lowStock=${lowStock}`),
  });
  return (
    <>
      <PageTitle
        eyebrow="KEEP GOOD THINGS IN STOCK"
        title="A place for every pack."
        description="Receive fresh deliveries and see the story behind every stock change."
      />
      <section className="panel">
        <div className="toolbar">
          <h2>Your stockroom</h2>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(event) => {
                setLowStock(event.target.checked);
                setPage(1);
              }}
            />{' '}
            Show running low only
          </label>
        </div>
        <State loading={query.isPending} error={query.error} empty={query.data?.total === 0}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>On shelf</th>
                  <th>Alert at</th>
                  <th>Stock health</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <strong>{product.name}</strong>
                      <small>{product.sku}</small>
                    </td>
                    <td>{product.stock}</td>
                    <td>{product.lowStockThreshold}</td>
                    <td>
                      <Badge
                        status={
                          product.stock <= product.lowStockThreshold ? 'pending' : 'delivered'
                        }
                      />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="button secondary" onClick={() => setReceive(product)}>
                          Receive stock
                        </button>
                        <button className="text-link" onClick={() => setLedger(product)}>
                          View ledger
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </State>
        {query.data && <Pager total={query.data.total} page={page} setPage={setPage} />}
      </section>
      {receive && <ReceiveForm product={receive} close={() => setReceive(null)} />}
      {ledger && <Ledger product={ledger} close={() => setLedger(null)} />}
    </>
  );
}
