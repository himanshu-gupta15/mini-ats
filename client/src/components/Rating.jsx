export default function Rating({ value = 0, onChange, size = 'md' }) {
  return (
    <span className={`rating rating-${size}`} aria-label={`Rating ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button type="button" key={n} className={n <= value ? 'on' : ''} onClick={() => onChange(n === value ? 0 : n)} aria-label={`${n} star`}>
            ★
          </button>
        ) : (
          <span key={n} className={n <= value ? 'on' : ''}>★</span>
        )
      )}
    </span>
  );
}
