import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Brief } from '../../lib/types';
import { money } from '../../lib/format.mjs';
import { Icon, Notice, PageTitle } from '../../components/ui';
export function WeeklyBrief() {
  const mutation = useMutation({
    mutationFn: () => api<Brief>('/ai/weekly-brief', { method: 'POST', body: {} }),
  });
  const brief = mutation.data;
  return (
    <>
      <PageTitle
        eyebrow="FACTORY REPORTING"
        title="Weekly operations brief"
        description="Review order volume and stock alerts for the last seven days."
      />
      <div className="brief-layout">
        <section className="panel brief-content">
          <span className="spark-tile">
            <Icon name="spark" size={28} />
          </span>
          {brief ? (
            <>
              <span className="label-pill">
                {brief.provider === 'gemini' ? 'AI ASSISTED · VALIDATED' : 'TEMPLATE SUMMARY'}
                {brief.cached ? ' · CACHED' : ''}
              </span>
              <h2>{brief.headline}</h2>
              <ul>
                {brief.bullets.map((bullet, index) => (
                  <li key={index}>{bullet}</li>
                ))}
              </ul>
              {brief.risks.length > 0 && (
                <>
                  <h3>Worth your attention</h3>
                  <ul>
                    {brief.risks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </>
              )}
              <p className="muted">
                Saved for the week beginning {brief.week}. Check the source figures alongside this
                summary.
              </p>
            </>
          ) : (
            <>
              <h2>
                Generate a weekly report
              </h2>
              <p>
                We gather non-cancelled sales, top products, and low stock into a short weekly
                note. If AI is unavailable, you’ll receive a clear template summary.
              </p>
              <button
                className="button primary"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? 'Preparing your brief…' : 'Prepare my weekly brief'}
              </button>
            </>
          )}
          <Notice error={mutation.error} />
        </section>
        <aside className="panel">
          <h2>Behind the brief</h2>
          <p className="muted">Each factory has one saved brief per week, generated from aggregate figures.</p>
          {brief ? (
            <dl className="source-numbers">
              <div>
                <dt>Sales</dt>
                <dd>{money(brief.source.revenuePaise)}</dd>
              </div>
              <div>
                <dt>Orders</dt>
                <dd>{brief.source.orderCount}</dd>
              </div>
              <div>
                <dt>Units</dt>
                <dd>{brief.source.units}</dd>
              </div>
            </dl>
          ) : (
            <p className="muted section-gap">Source figures appear here with your summary.</p>
          )}
          <hr />
          <p className="muted">
            Generated text is checked for unsupported numbers. Always use the dashboard for
            operational decisions.
          </p>
        </aside>
      </div>
    </>
  );
}
