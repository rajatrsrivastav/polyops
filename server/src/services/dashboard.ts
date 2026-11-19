import { Order, Product } from '../models';
import type { Actor } from '../middleware/auth';
import { dateRange, IST } from '../lib/time';
export async function dashboard(actor: Actor, range: '7d' | '30d', now = new Date()) {
  const dates = dateRange(range === '7d' ? 7 : 30, now);
  const match = {
    shopId: actor.shopId,
    createdAt: { $gte: dates.start, $lt: dates.end },
    status: { $ne: 'cancelled' },
  };
  const [summary, daily, topSkus, lowStock, pendingCount] = await Promise.all([
    Order.aggregate<{ revenuePaise: number; orderCount: number; units: number }>([
      { $match: match },
      {
        $group: {
          _id: null,
          revenuePaise: { $sum: '$subtotalPaise' },
          orderCount: { $sum: 1 },
          units: { $sum: { $sum: '$items.qty' } },
        },
      },
    ]),
    Order.aggregate<{ _id: string; revenuePaise: number; orderCount: number }>([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: IST } },
          revenuePaise: { $sum: '$subtotalPaise' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate<{ _id: string; name: string; sku: string; qty: number; revenuePaise: number }>([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $last: '$items.name' },
          sku: { $last: '$items.sku' },
          qty: { $sum: '$items.qty' },
          revenuePaise: { $sum: { $multiply: ['$items.qty', '$items.unitPricePaise'] } },
        },
      },
      { $sort: { qty: -1, _id: 1 } },
      { $limit: 10 },
    ]),
    Product.find({
      shopId: actor.shopId,
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .select('name sku stock lowStockThreshold')
      .sort({ stock: 1, _id: 1 })
      .limit(20)
      .lean(),
    Order.countDocuments({ shopId: actor.shopId, status: { $in: ['pending', 'packed'] } }),
  ]);
  const dailyMap = new Map(daily.map((row) => [row._id, row]));
  return {
    range,
    from: dates.start.toISOString(),
    to: dates.end.toISOString(),
    summary: {
      revenuePaise: summary[0]?.revenuePaise ?? 0,
      orderCount: summary[0]?.orderCount ?? 0,
      units: summary[0]?.units ?? 0,
      pendingCount,
    },
    salesByDay: dates.days.map((day) => ({
      day,
      revenuePaise: dailyMap.get(day)?.revenuePaise ?? 0,
      orderCount: dailyMap.get(day)?.orderCount ?? 0,
    })),
    topSkus,
    lowStock,
  };
}
export type Dashboard = Awaited<ReturnType<typeof dashboard>>;
