// Horizontal bar list: label · bar · value. Single hue; magnitude reads from length.
export default function BarList({ data, labelKey, valueKey = 'count', total, colorFor }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <ul className="barlist">
      {data.map((d) => {
        const v = d[valueKey];
        return (
          <li key={d[labelKey]}>
            <span className="barlist-label">{d[labelKey]}</span>
            <span className="barlist-track">
              <span className="barlist-bar" style={{ width: `${(v / max) * 100}%`, background: colorFor?.(d) }} />
            </span>
            <span className="barlist-value">
              {v}
              {total ? <em>{Math.round((v / total) * 100)}%</em> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
