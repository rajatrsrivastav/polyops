import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Page, type StaffProduct } from '../../lib/api';

export type Material = StaffProduct & { pricePaise: number; lowStockThreshold: number };
export type Totals = { revenuePaise: number; orderCount: number; units: number };
export type Dashboard = {
  summary: Totals & { pendingCount: number };
  salesByDay: (Pick<Totals, 'revenuePaise' | 'orderCount'> & { day: string })[];
  lowStock: StaffProduct[];
  topSkus: (Pick<Material, '_id' | 'name' | 'sku'> & { qty: number; revenuePaise: number })[];
};
export type Brief = {
  headline: string;
  bullets: string[];
  risks: string[];
  provider: 'gemini' | 'template';
  cached: boolean;
  week: string;
  source: Totals;
};

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
export function money(paise: number) {
  return currency.format(paise / 100);
}

export function priceInPaise(input: string) {
  const value = input.trim();
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(value)) return null;
  const [rupees, fraction = ''] = value.split('.');
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, '0'));
  return paise <= 100000000 ? paise : null;
}

export function useMaterials() {
  const [search, setSearch] = useState('');
  const [q, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['products', 'admin', q, page],
    queryFn: () => api<Page<Material>>(`/products?q=${encodeURIComponent(q)}&page=${page}`),
  });
  return {
    query,
    page,
    search,
    setSearch,
    setPage,
    submit() {
      setPage(1);
      setQuery(search.trim());
    },
  };
}
