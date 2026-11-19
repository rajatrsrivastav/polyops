import { useState, useRef, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '../../lib/api';
import type { Product, Page } from '../../lib/types';
import { money, retryKey } from '../../lib/format.mjs';
import { Icon, Modal, Notice, PageTitle, Pager, State } from '../../components/ui';
export function ProductForm({ product, close }: { product?: Product; close: () => void }) {
  const client = useQueryClient();
  const [validation, setValidation] = useState('');
  const mutation = useMutation({
    mutationFn: (body: unknown) =>
      api(`/products${product ? `/${product._id}` : ''}`, {
        method: product ? 'PATCH' : 'POST',
        body,
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['products'] });
      close();
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rupees = String(form.get('price'));
    if (!/^\d+(\.\d{1,2})?$/.test(rupees)) {
      setValidation('Price must have at most two decimal places.');
      return;
    }
    const parsed = z
      .object({
        name: z.string().trim().min(1).max(100),
        sku: z
          .string()
          .trim()
          .min(1)
          .max(40)
          .regex(/^[A-Za-z0-9_-]+$/),
        pricePaise: z.number().int().min(0).max(100000000),
        lowStockThreshold: z.number().int().min(0).max(1000000),
      })
      .safeParse({
        name: form.get('name'),
        sku: form.get('sku'),
        pricePaise: Math.round(Number(rupees) * 100),
        lowStockThreshold: Number(form.get('threshold')),
      });
    if (!parsed.success) {
      setValidation(
        'Check the product fields. SKU may use letters, numbers, hyphens and underscores.',
      );
      return;
    }
    setValidation('');
    mutation.mutate(parsed.data);
  }
  return (
    <Modal
      title={product ? 'A little product update' : 'Make room for a new product'}
      close={close}
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          Product name
          <input name="name" defaultValue={product?.name} required maxLength={100} />
        </label>
        <div className="form-row">
          <label>
            SKU
            <input name="sku" defaultValue={product?.sku} required maxLength={40} />
          </label>
          <label>
            Price (₹)
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product ? product.pricePaise / 100 : ''}
              required
            />
          </label>
        </div>
        <label>
          Low stock alert at
          <input
            name="threshold"
            type="number"
            min="0"
            max="1000000"
            defaultValue={product?.lowStockThreshold ?? 5}
            required
          />
        </label>
        <p className="muted">New products start at zero stock. Record deliveries in Inventory.</p>
        {validation && (
          <p className="notice" role="alert">
            {validation}
          </p>
        )}
        <Notice error={mutation.error} />
        <button className="button primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save product'}
        </button>
      </form>
    </Modal>
  );
}
export function ReceiveForm({ product, close }: { product: Product; close: () => void }) {
  const client = useQueryClient();
  const key = useRef<{ payload: string; key: string } | null>(null);
  const mutation = useMutation({
    mutationFn: (body: { qty: number; note: string }) =>
      api(`/products/${product._id}/movements`, { method: 'POST', body, key: retryKey(key, body) }),
    onSuccess: async () => {
      await Promise.all(
        ['products', 'movements', 'dashboard'].map((name) =>
          client.invalidateQueries({ queryKey: [name] }),
        ),
      );
      close();
    },
  });
  return (
    <Modal title={`Receive · ${product.name}`} close={close}>
      <form
        className="form-stack"
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          mutation.mutate({ qty: Number(data.get('qty')), note: String(data.get('note')) });
        }}
      >
        <p className="muted">
          {product.stock} currently on the shelf. Each delivery is recorded in your stock ledger.
        </p>
        <label>
          Units received
          <input name="qty" type="number" min="1" max="99999" required />
        </label>
        <label>
          Note (optional)
          <input name="note" maxLength={200} placeholder="e.g. Fresh batch from supplier" />
        </label>
        <Notice error={mutation.error} />
        <button className="button primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Recording…' : 'Record delivery'}
        </button>
      </form>
    </Modal>
  );
}
export function Products() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Product | 'new' | null>(null);
  const query = useQuery({
    queryKey: ['products', { page, q }],
    queryFn: () => api<Page<Product>>(`/products?page=${page}&q=${encodeURIComponent(q)}`),
  });
  const client = useQueryClient();
  const archive = useMutation({
    mutationFn: (id: string) => api(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () =>
      Promise.all(
        ['products', 'dashboard'].map((name) => client.invalidateQueries({ queryKey: [name] })),
      ),
  });
  return (
    <>
      <PageTitle
        eyebrow="THE THINGS YOU MAKE"
        title="Your shelf, sorted."
        description="A home for every product. Keep the details fresh and the shelves ready."
        action={
          <button className="button primary" onClick={() => setEdit('new')}>
            <Icon name="plus" /> Add product
          </button>
        }
      />
      <section className="panel">
        <form
          className="toolbar search-bar"
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
              placeholder="Find a name or SKU"
              aria-label="Search products"
              maxLength={100}
            />
          </label>
          <button className="button secondary">Search</button>
          <span className="muted">{query.data?.total ?? '—'} active products</span>
        </form>
        <Notice error={archive.error} />
        <State loading={query.isPending} error={query.error} empty={query.data?.total === 0}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>On the shelf</th>
                  <th>Stock health</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.items.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-cell">
                        <span className="product-tile">
                          <Icon name="box" />
                        </span>
                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.sku}</small>
                        </div>
                      </div>
                    </td>
                    <td>{money(product.pricePaise)}</td>
                    <td>{product.stock} units</td>
                    <td>
                      <span
                        className={`badge ${product.stock <= product.lowStockThreshold ? 'pending' : 'delivered'}`}
                      >
                        {product.stock <= product.lowStockThreshold
                          ? 'Running low'
                          : 'Well stocked'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="text-link" onClick={() => setEdit(product)}>
                          Edit
                        </button>
                        <button
                          className="text-link danger"
                          disabled={archive.isPending}
                          onClick={() => {
                            if (
                              window.confirm(`Archive ${product.name}? Existing orders are kept.`)
                            )
                              archive.mutate(product._id);
                          }}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </State>
        {query.data && <Pager page={page} total={query.data.total} setPage={setPage} />}
      </section>
      {edit && (
        <ProductForm product={edit === 'new' ? undefined : edit} close={() => setEdit(null)} />
      )}
    </>
  );
}
