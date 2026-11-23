import { query, type Sql } from '../db/pool';
import { asInt, asString } from '../db/rows';
import type { Actor } from '../middleware/auth';
import { dateRange, IST } from '../lib/time';
const db: Sql = { query };
export async function dashboard(actor: Actor, range: '7d' | '30d', now = new Date()) {
  const dates = dateRange(range === '7d' ? 7 : 30, now);
  const bounds = [actor.shopId, dates.start, dates.end];
  const [summaryRow, dailyRows, topRows, lowStock, pendingCount] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(subtotal_paise), 0)::bigint AS revenue,
              COUNT(*)::bigint AS orders,
              COALESCE(SUM((
                SELECT COALESCE(SUM((item->>'qty')::int), 0)
                FROM jsonb_array_elements(items) item
              )), 0)::bigint AS units
       FROM orders
       WHERE shop_id = $1 AND created_at >= $2 AND created_at < $3 AND status <> 'cancelled'`,
      bounds,
    ),
    db.query(
      `SELECT to_char(created_at AT TIME ZONE $4, 'YYYY-MM-DD') AS day,
              COALESCE(SUM(subtotal_paise), 0)::bigint AS revenue,
              COUNT(*)::bigint AS orders
       FROM orders
       WHERE shop_id = $1 AND created_at >= $2 AND created_at < $3 AND status <> 'cancelled'
       GROUP BY 1
       ORDER BY 1`,
      [...bounds, IST],
    ),
    db.query(
      `SELECT item->>'productId' AS id,
              (array_agg(item->>'name' ORDER BY orders.created_at DESC, orders.id DESC))[1] AS name,
              (array_agg(item->>'sku' ORDER BY orders.created_at DESC, orders.id DESC))[1] AS sku,
              COALESCE(SUM((item->>'qty')::bigint), 0)::bigint AS qty,
              COALESCE(SUM((item->>'qty')::bigint * (item->>'unitPricePaise')::bigint), 0)::bigint AS revenue
       FROM orders
       CROSS JOIN LATERAL jsonb_array_elements(items) AS item
       WHERE shop_id = $1 AND created_at >= $2 AND created_at < $3 AND status <> 'cancelled'
       GROUP BY item->>'productId'
       ORDER BY qty DESC, id ASC
       LIMIT 10`,
      bounds,
    ),
    db.query(
      `SELECT id, name, sku, stock, low_stock_threshold
       FROM products
       WHERE shop_id = $1 AND is_active = true AND stock <= low_stock_threshold
       ORDER BY stock ASC, id ASC
       LIMIT 20`,
      [actor.shopId],
    ),
    db.query(
      `SELECT COUNT(*)::bigint AS total FROM orders WHERE shop_id = $1 AND status IN ('pending', 'packed')`,
      [actor.shopId],
    ),
  ]);
  const summary = summaryRow.rows[0];
  const dailyMap = new Map(
    dailyRows.rows.map((row) => [
      asString(row, 'day'),
      { revenuePaise: asInt(row.revenue, 'revenue'), orderCount: asInt(row.orders, 'orders') },
    ]),
  );
  return {
    range,
    from: dates.start.toISOString(),
    to: dates.end.toISOString(),
    summary: {
      revenuePaise: summary ? asInt(summary.revenue, 'revenue') : 0,
      orderCount: summary ? asInt(summary.orders, 'orders') : 0,
      units: summary ? asInt(summary.units, 'units') : 0,
      pendingCount: asInt(pendingCount.rows[0]?.total ?? 0, 'pending'),
    },
    salesByDay: dates.days.map((day) => ({
      day,
      revenuePaise: dailyMap.get(day)?.revenuePaise ?? 0,
      orderCount: dailyMap.get(day)?.orderCount ?? 0,
    })),
    topSkus: topRows.rows.map((row) => ({
      _id: asString(row, 'id'),
      name: asString(row, 'name'),
      sku: asString(row, 'sku'),
      qty: asInt(row.qty, 'qty'),
      revenuePaise: asInt(row.revenue, 'revenue'),
    })),
    lowStock: lowStock.rows.map((row) => ({
      _id: asString(row, 'id'),
      name: asString(row, 'name'),
      sku: asString(row, 'sku'),
      stock: asInt(row.stock, 'stock'),
      lowStockThreshold: asInt(row.low_stock_threshold, 'low_stock_threshold'),
    })),
  };
}
export type Dashboard = Awaited<ReturnType<typeof dashboard>>;
