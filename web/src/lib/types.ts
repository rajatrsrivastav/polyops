export type Page<T> = { items: T[]; page: number; limit: number; total: number };
export type Me = { id: string; shopId: string; shopName: string; role: 'owner' | 'staff' };
export type Product = {
  _id: string;
  name: string;
  sku: string;
  pricePaise: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};
export type Status = 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type Order = {
  _id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  channel: string;
  status: Status;
  createdAt: string;
  subtotalPaise: number;
  items: { productId: string; sku: string; name: string; qty: number; unitPricePaise: number }[];
  statusHistory: { status: Status; at: string }[];
};
export type Movement = {
  _id: string;
  type: string;
  qty: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
};
export type Dashboard = {
  summary: { revenuePaise: number; orderCount: number; units: number; pendingCount: number };
  salesByDay: { day: string; revenuePaise: number; orderCount: number }[];
  topSkus: { _id: string; name: string; sku: string; qty: number; revenuePaise: number }[];
  lowStock: Product[];
};
export type Brief = {
  headline: string;
  bullets: string[];
  risks: string[];
  provider: 'gemini' | 'template';
  cached: boolean;
  week: string;
  source: {
    revenuePaise: number;
    orderCount: number;
    units: number;
    lowStock: { name: string; stock: number }[];
  };
};
