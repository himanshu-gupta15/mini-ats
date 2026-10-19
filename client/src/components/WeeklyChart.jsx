import { useState } from 'react';

export default function WeeklyChart({ data }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const nice = Math.ceil(max / 5) * 5 || 5;
  const label = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <div className="weekly">
      <div className="weekly-grid">
        {[1, 0.5, 0].map((f) => (
          <div key={f} className="weekly-gridline" style={{ bottom: `${f * 100}%` }}>
            <span>{Math.round(nice * f)}</span>
          </div>
        ))}
        <div className="weekly-bars">
          {data.map((d, i) => (
            <div key={d.weekStart} className="weekly-col" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {hover === i && <div className="tip">{d.count} applied<br /><small>wk of {label(d.weekStart)}</small></div>}
              <div className="weekly-bar" style={{ height: `${(d.count / nice) * 100}%` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="weekly-axis">
        {data.map((d, i) => <span key={d.weekStart}>{(data.length - 1 - i) % 2 === 0 ? label(d.weekStart) : ''}</span>)}
      </div>
    </div>
  );
}
