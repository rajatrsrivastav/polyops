import { useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '../../lib/api';
import type { Order, Product, Page, Status } from '../../lib/types';
import { money, dateTime, retryKey } from '../../lib/format.mjs';
import { Badge, Icon, Modal, Notice, Pager, PageTitle, State } from '../../components/ui';
function CreateOrder({ close }: { close: () => void }) {
  const [lines, setLines] = useState([{ productId: '', qty: 1 }]);
  const key = useRef<{ payload: string; key: string } | null>(null);
  const [validation, setValidation] = useState('');
  const [search, setSearch] = useState('');
  const products = useQuery({
    queryKey: ['products', 'order-picker', search],
    queryFn: () => api<Page<Product>>(`/products?limit=50&q=${encodeURIComponent(search)}`),
  });
  const [catalog, setCatalog] = useState<Record<string, Product>>({});
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      api('/orders', { method: 'POST', body, key: retryKey(key, body) }),
    onSuccess: async () => {
      await Promise.all(
        ['orders', 'products', 'dashboard'].map((name) =>
          client.invalidateQueries({ queryKey: [name] }),
        ),
      );
      close();
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      items: lines,
      channel: String(form.get('channel')),
      customerName: String(form.get('name')).trim(),
      customerPhone: String(form.get('phone')).trim(),
    };
    if (
      !z
        .object({
          items: z
            .array(
              z.object({ productId: z.string().min(1), qty: z.number().int().min(1).max(999) }),
            )
            .min(1)
            .max(50),
          channel: z.enum(['instagram', 'whatsapp', 'website', 'other']),
          customerName: z.string().min(1).max(100),
          customerPhone: z.string().regex(/^[6-9]\d{9}$/),
        })
        .safeParse(body).success
    ) {
      setValidation(
        'Select a product on every line and enter a valid ten-digit Indian mobile number.',
      );
      return;
    }
    setValidation('');
    mutation.mutate(body);
  }
  const total = lines.reduce(
    (sum, line) => sum + (catalog[line.productId]?.pricePaise ?? 0) * line.qty,
    0,
  );
  return (
    <Modal title="A new parcel in the making" close={close}>
      <form className="form-stack" onSubmit={submit}>
        <div className="form-row">
          <label>
            Customer name
            <input name="name" required maxLength={100} autoComplete="off" />
          </label>
          <label>
            Customer phone
            <input
              name="phone"
              inputMode="tel"
              pattern="[6-9][0-9]{9}"
              placeholder="10-digit mobile"
              required
              maxLength={10}
              autoComplete="off"
            />
          </label>
        </div>
        <label>
          Order channel
          <select name="channel">
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="website">Website</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Find products
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search catalog by name or SKU"
            maxLength={100}
          />
        </label>
        <State loading={products.isPending} error={products.error}>
          <div className="order-lines">
            {lines.map((line, index) => (
              <div className="order-line" key={index}>
                <label>
                  Product {index + 1}
                  <select
                    required
                    value={line.productId}
                    onChange={(event) => {
                      const product = products.data?.items.find(
                        (item) => item._id === event.target.value,
                      );
                      if (product)
                        setCatalog((current) => ({ ...current, [product._id]: product }));
                      setLines((current) =>
                        current.map((value, n) =>
                          n === index ? { ...value, productId: event.target.value } : value,
                        ),
                      );
                    }}
                  >
                    <option value="">Choose a product</option>
                    {line.productId &&
                      !products.data?.items.some((product) => product._id === line.productId) && (
                        <option value={line.productId}>{catalog[line.productId]?.name}</option>
                      )}
                    {products.data?.items.map((product) => (
                      <option key={product._id} value={product._id} disabled={product.stock === 0}>
                        {product.name} · {product.stock} left
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Qty
                  <input
                    type="number"
                    min="1"
                    max="999"
                    required
                    value={line.qty}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((value, n) =>
                          n === index ? { ...value, qty: Number(event.target.value) } : value,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="icon-button"
                  disabled={lines.length === 1}
                  aria-label={`Remove product line ${index + 1}`}
                  onClick={() => setLines((current) => current.filter((_, n) => n !== index))}
                >
                  <Icon name="close" />
                </button>
              </div>
            ))}
          </div>
        </State>
        <button
          type="button"
          className="text-link"
          disabled={lines.length >= 50}
          onClick={() => setLines((current) => [...current, { productId: '', qty: 1 }])}
        >
          Add another product
        </button>
        <div className="order-total">
          <span>Estimated subtotal</span>
          <strong>{money(total)}</strong>
        </div>
        <p className="muted">
          Stock is reserved when you create the order. Final prices are checked by the server.
        </p>
        {validation && (
          <p className="notice" role="alert">
            {validation}
          </p>
        )}
        <Notice error={mutation.error} />
        <button className="button primary" disabled={mutation.isPending || products.isPending}>
          {mutation.isPending ? 'Reserving stock…' : 'Create & reserve stock'}
        </button>
      </form>
    </Modal>
  );
}
const next: Record<Status, Status[]> = {
  pending: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};
function OrderDetail({ id, close }: { id: string; close: () => void }) {
  const query = useQuery({ queryKey: ['orders', id], queryFn: () => api<Order>(`/orders/${id}`) });
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (to: Status) => api(`/orders/${id}/status`, { method: 'PATCH', body: { to } }),
    onSuccess: () =>
      Promise.all(
        ['orders', 'products', 'dashboard', 'movements'].map((name) =>
          client.invalidateQueries({ queryKey: [name] }),
        ),
      ),
  });
  const order = query.data;
  return (
    <Modal title={order?.code ?? 'Order details'} close={close}>
      <State loading={query.isPending} error={query.error}>
        {order && (
          <>
            <div className="detail-meta">
              <div>
                <h3>{order.customerName}</h3>
                <p>
                  {order.customerPhone} · {order.channel}
                </p>
                <p className="muted">{dateTime(order.createdAt)}</p>
              </div>
              <Badge status={order.status} />
            </div>
            <ul className="stock-list">
              {order.items.map((item) => (
                <li key={item.productId}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.sku} · {money(item.unitPricePaise)} each
                    </small>
                  </div>
                  <span>× {item.qty}</span>
                </li>
              ))}
            </ul>
            <div className="order-total">
              <span>Subtotal</span>
              <strong>{money(order.subtotalPaise)}</strong>
            </div>
            <h3 className="section-gap">Parcel history</h3>
            <ol className="timeline">
              {order.statusHistory.map((entry, index) => (
                <li key={index}>
                  <span>{entry.status}</span>
                  <small>{dateTime(entry.at)}</small>
                </li>
              ))}
            </ol>
            <Notice error={mutation.error} />
            <div className="dialog-actions">
              {next[order.status].map((to) => (
                <button
                  key={to}
                  className={`button ${to === 'cancelled' ? 'secondary danger' : 'primary'}`}
                  disabled={mutation.isPending}
                  onClick={() => {
                    if (
                      to !== 'cancelled' ||
                      window.confirm('Cancel this order and return its stock to the shelf?')
                    )
                      mutation.mutate(to);
                  }}
                >
                  {mutation.isPending
                    ? 'Updating…'
                    : to === 'cancelled'
                      ? 'Cancel & restock'
                      : `Mark ${to}`}
                </button>
              ))}
            </div>
          </>
        )}
      </State>
    </Modal>
  );
}
export function Orders() {
  const [params, setParams] = useSearchParams();
  const create = params.get('new') === '1';
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const search = new URLSearchParams({
    page: String(page),
    ...(status ? { status } : {}),
    ...(q ? { q } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });
  const query = useQuery({
    queryKey: ['orders', { page, status, q, from, to }],
    queryFn: () => api<Page<Order>>(`/orders?${search}`),
  });
  return (
    <>
      <PageTitle
        eyebrow="FROM YOUR SHOP TO THEIR DOOR"
        title="Every order, in order."
        description="Follow each parcel from the first hello to a happy delivery."
        action={
          <button className="button primary" onClick={() => setParams({ new: '1' })}>
            <Icon name="plus" /> Create order
          </button>
        }
      />
      <section className="panel">
        <form
          className="toolbar filters"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setQ(String(new FormData(event.currentTarget).get('q')));
            setPage(1);
          }}
        >
          <label className="search">
            <Icon name="search" />
            <input
              name="q"
              type="search"
              aria-label="Find order or customer"
              placeholder="Order code or customer"
              maxLength={100}
            />
          </label>
          <button className="button secondary">Search</button>
          <label>
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {Object.keys(next).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            From (IST)
            <input
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            To (IST)
            <input
              type="date"
              value={to}
              min={from}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </form>
        <State loading={query.isPending} error={query.error} empty={query.data?.total === 0}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Channel</th>
                  <th>Subtotal</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <button className="text-link" onClick={() => setSelected(order._id)}>
                        {order.code}
                      </button>
                    </td>
                    <td>
                      {order.customerName}
                      <small>{order.items.reduce((sum, line) => sum + line.qty, 0)} units</small>
                    </td>
                    <td className="capitalize">{order.channel}</td>
                    <td>{money(order.subtotalPaise)}</td>
                    <td>
                      <Badge status={order.status} />
                    </td>
                    <td>{dateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </State>
        {query.data && <Pager page={page} total={query.data.total} setPage={setPage} />}
      </section>
      {create && <CreateOrder close={() => setParams({})} />}
      {selected && <OrderDetail id={selected} close={() => setSelected(null)} />}
    </>
  );
}
