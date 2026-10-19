import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { STAGES, initials } from '../constants.js';
import { useDebounce } from '../useDebounce.js';
import Rating from '../components/Rating.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Pipeline() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('');
  const [dragId, setDragId] = useState(null);
  const [over, setOver] = useState(null);
  const debounced = useDebounce(search);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    // Fetch all matching candidates in pages of 100 for the board
    (async () => {
      const all = [];
      let page = 1, pages = 1;
      do {
        const r = await api.list({ search: debounced, position, limit: 100, page, sort: 'rating' });
        all.push(...r.items);
        pages = r.pages;
      } while (++page <= pages);
      setItems(all);
    })()
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [debounced, position, toast]);

  const positions = useMemo(() => [...new Set(items.map((c) => c.position))].sort(), [items]);
  const columns = useMemo(() => Object.fromEntries(STAGES.map((s) => [s, items.filter((c) => c.stage === s)])), [items]);

  async function move(id, stage) {
    const c = items.find((x) => x._id === id);
    if (!c || c.stage === stage) return;
    const prev = c.stage;
    setItems((xs) => xs.map((x) => (x._id === id ? { ...x, stage } : x))); // optimistic
    try {
      await api.setStage(id, stage);
      toast(`${c.name} → ${stage}`);
    } catch (e) {
      setItems((xs) => xs.map((x) => (x._id === id ? { ...x, stage: prev } : x)));
      toast(e.message, 'error');
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Pipeline</h1>
          <p className="muted">Drag cards between stages to move candidates</p>
        </div>
        <div className="row-gap">
          <input className="search" type="search" placeholder="Filter cards…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={position} onChange={(e) => setPosition(e.target.value)} aria-label="Position">
            <option value="">All positions</option>
            {positions.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </header>

      <div className={`board ${loading ? 'loading' : ''}`}>
        {STAGES.map((stage) => (
          <section
            key={stage}
            className={`column ${over === stage ? 'over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setOver(null)}
            onDrop={(e) => { e.preventDefault(); setOver(null); move(e.dataTransfer.getData('text/plain'), stage); }}
          >
            <header className="column-head">
              <span className="dot" style={{ background: `var(--stage-${stage.toLowerCase()})` }} />
              {stage}
              <span className="count">{columns[stage].length}</span>
            </header>
            <div className="column-body">
              {columns[stage].map((c) => (
                <article
                  key={c._id}
                  className={`kcard ${dragId === c._id ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', c._id); e.dataTransfer.effectAllowed = 'move'; setDragId(c._id); }}
                  onDragEnd={() => setDragId(null)}
                >
                  <div className="person">
                    <span className="avatar sm">{initials(c.name)}</span>
                    <Link to={`/candidates/${c._id}`}>{c.name}</Link>
                  </div>
                  <div className="muted small">{c.position} · {c.experience}y</div>
                  <div className="kcard-foot">
                    <Rating value={c.rating} size="sm" />
                    <select
                      className="mini-select"
                      value=""
                      onChange={(e) => e.target.value && move(c._id, e.target.value)}
                      aria-label={`Move ${c.name} to another stage`}
                    >
                      <option value="" disabled>Move…</option>
                      {STAGES.filter((s) => s !== c.stage).map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </article>
              ))}
              {columns[stage].length === 0 && <div className="column-empty">Drop here</div>}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
