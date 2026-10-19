import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import BarList from '../components/BarList.jsx';
import WeeklyChart from '../components/WeeklyChart.jsx';

function Stat({ label, value, hint, accent }) {
  return (
    <div className="card stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={accent ? { color: accent } : undefined}>{value}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export default function Dashboard() {
  const [m, setM] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.metrics().then(setM).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="empty error-box">Failed to load metrics: {error}</div>;
  if (!m) return <div className="empty">Loading dashboard…</div>;

  const t = m.totals;
  return (
    <>
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Hiring overview across all open positions</p>
        </div>
        <Link to="/candidates" className="btn btn-primary">View candidates</Link>
      </header>

      <section className="stats">
        <Stat label="Total candidates" value={t.total} hint={`${t.newLast30Days} new in last 30 days`} />
        <Stat label="Active in pipeline" value={t.active} hint="Not hired or rejected" />
        <Stat label="Hired" value={t.hired} hint={`${t.hireRate}% hire rate`} accent="var(--good)" />
        <Stat label="Offer acceptance" value={`${t.offerAcceptance}%`} hint="Hired ÷ reached offer" />
        <Stat label="Avg time to hire" value={t.avgTimeToHireDays != null ? `${t.avgTimeToHireDays}d` : '—'} hint="Applied → Hired" />
        <Stat label="Rejected" value={t.rejected} hint={t.avgRating ? `Avg rating ${t.avgRating}/5` : ''} accent="var(--bad)" />
      </section>

      <section className="dash-grid">
        <div className="card">
          <h3>Candidates by stage</h3>
          <BarList data={m.byStage} labelKey="stage" total={t.total} colorFor={(d) => `var(--stage-${d.stage.toLowerCase()})`} />
        </div>
        <div className="card">
          <h3>Hiring funnel</h3>
          <p className="muted small">Candidates who reached each stage</p>
          <div className="funnel">
            {m.funnel.map((f, i) => {
              const pct = m.funnel[0].count ? (f.count / m.funnel[0].count) * 100 : 0;
              const prev = i ? m.funnel[i - 1].count : null;
              return (
                <div key={f.stage} className="funnel-row">
                  <span className="funnel-label">{f.stage}</span>
                  <div className="funnel-track"><div className="funnel-bar" style={{ width: `${Math.max(pct, 2)}%` }}>{f.count}</div></div>
                  <span className="funnel-conv">{prev ? `${Math.round((f.count / prev) * 100)}%` : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card span-2">
          <h3>Applications per week</h3>
          <WeeklyChart data={m.weekly} />
        </div>
        <div className="card">
          <h3>Sources</h3>
          <BarList data={m.bySource} labelKey="source" total={t.total} />
        </div>
        <div className="card">
          <h3>Top positions</h3>
          <table className="table compact">
            <thead><tr><th>Position</th><th className="num">Total</th><th className="num">Active</th><th className="num">Hired</th></tr></thead>
            <tbody>
              {m.topPositions.map((p) => (
                <tr key={p.position}>
                  <td><Link to={`/candidates?position=${encodeURIComponent(p.position)}`}>{p.position}</Link></td>
                  <td className="num">{p.count}</td>
                  <td className="num">{p.active}</td>
                  <td className="num">{p.hired}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
