import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../lib/api';
import type { Dashboard as Data } from '../../lib/types';
import { money } from '../../lib/format.mjs';
import { Icon, PageTitle, State } from '../../components/ui';
export function Dashboard() {
  const [range, setRange] = useState('7d');
  const query = useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => api<Data>(`/dashboard?range=${range}`),
  });
  const data = query.data;
  return (
    <>
      <PageTitle
        eyebrow="FACTORY OPERATIONS"
        title="Factory overview"
        description="Review buyer orders, stock alerts and the dispatch queue."
        action={
          <Link className="button primary" to="/orders?new=1">
            <Icon name="plus" /> Create order
          </Link>
        }
      />
      <div className="toolbar">
        <span className="section-caption">The bigger picture</span>
        <div className="segments" aria-label="Reporting period">
          {['7d', '30d'].map((value) => (
            <button
              key={value}
              aria-pressed={range === value}
              className={range === value ? 'active' : ''}
              onClick={() => setRange(value)}
            >
              Last {value === '7d' ? '7' : '30'} days
            </button>
          ))}
        </div>
      </div>
      <State loading={query.isPending} error={query.error}>
        {data && (
          <>
            <section className="stats">
              {[
                {
                  title: 'Total sales',
                  value: money(data.summary.revenuePaise),
                  caption: 'Excludes cancelled orders',
                  icon: 'stock',
                },
                {
                  title: 'Orders received',
                  value: data.summary.orderCount,
                  caption: 'In your selected period',
                  icon: 'orders',
                },
                {
                  title: 'Units ordered',
                  value: data.summary.units,
                  caption: 'Across non-cancelled orders',
                  icon: 'box',
                },
                {
                  title: 'Awaiting dispatch',
                  value: data.summary.pendingCount,
                  caption: 'Pending & packed, all dates',
                  icon: 'check',
                },
              ].map((stat) => (
                <article className="stat" key={stat.title}>
                  <div>
                    <span>{stat.title}</span>
                    <Icon name={stat.icon} />
                  </div>
                  <strong>{stat.value}</strong>
                  <small>{stat.caption}</small>
                </article>
              ))}
            </section>
            <div className="dashboard-grid">
              <section className="panel sales-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Sales, day by day</h2>
                    <p className="muted">Value of non-cancelled orders by order date.</p>
                  </div>
                  <span className="chart-legend">Sales in ₹</span>
                </div>
                <div
                  className="chart"
                  role="img"
                  aria-label={`Sales chart. Total ${money(data.summary.revenuePaise)} across the selected period.`}
                >
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart
                      data={data.salesByDay.map((row) => ({
                        ...row,
                        sales: row.revenuePaise / 100,
                        label: row.day.slice(5).split('-').reverse().join('/'),
                      }))}
                      margin={{ top: 16, right: 20, left: 8, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E8A838" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#E8A838" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#e9ece8" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                        tick={{ fill: '#59696b', fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#59696b', fontSize: 12 }}
                      />
                      <Tooltip formatter={(value) => money(Number(value) * 100)} />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#b47716"
                        strokeWidth={2.5}
                        fill="url(#salesFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="panel low-stock">
                <div className="panel-heading">
                  <div>
                    <span className="label-pill amber">STOCK ALERTS</span>
                    <h2>Low stock</h2>
                  </div>
                  <Icon name="box" />
                </div>
                {data.lowStock.length ? (
                  <ul className="stock-list">
                    {data.lowStock.slice(0, 4).map((item) => (
                      <li key={item._id}>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.sku}</small>
                        </div>
                        <span className="stock-count">{item.stock} left</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="state compact">
                    Your active products are above their stock thresholds.
                  </p>
                )}
                <Link className="text-link" to="/inventory">
                  Take stock
                </Link>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Most ordered products</h2>
                    <p className="muted">Your most ordered products.</p>
                  </div>
                  <Link className="text-link" to="/products">
                    All products
                  </Link>
                </div>
                {data.topSkus.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Units</th>
                          <th>Sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topSkus.slice(0, 5).map((item) => (
                          <tr key={item._id}>
                            <td>
                              <strong>{item.name}</strong>
                              <small>{item.sku}</small>
                            </td>
                            <td>{item.qty}</td>
                            <td>{money(item.revenuePaise)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="state compact">Product rankings appear when orders are recorded.</p>
                )}
              </section>
              <section className="brief-teaser">
                <span className="spark-tile">
                  <Icon name="spark" size={28} />
                </span>
                <p className="eyebrow">OPERATIONS REPORT</p>
                <h2>
                  Weekly factory brief
                </h2>
                <p>Review seven days of orders and stock alerts.</p>
                <Link className="button secondary" to="/brief">
                  Read my weekly brief
                </Link>
                <small>Uses factory totals and excludes buyer contact details.</small>
              </section>
            </div>
          </>
        )}
      </State>
    </>
  );
}
