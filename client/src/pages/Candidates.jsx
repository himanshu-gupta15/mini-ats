import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { SOURCES, STAGES, fmtDate, initials } from '../constants.js';
import { useDebounce } from '../useDebounce.js';
import Rating from '../components/Rating.jsx';
import CandidateForm from '../components/CandidateForm.jsx';
import { useToast } from '../components/Toast.jsx';

const FILTER_KEYS = ['search', 'stage', 'source', 'position', 'skill', 'minExp', 'sort', 'page'];

export default function Candidates() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState(params.get('search') || '');
  const debounced = useDebounce(search);
  const [data, setData] = useState({ items: [], total: 0, pages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const q = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
      if (!('page' in patch)) next.delete('page');
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  useEffect(() => {
    if (debounced !== (params.get('search') || '')) update({ search: debounced });
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(() => {
    setLoading(true);
    api
      .list({ ...q, limit: 15 })
      .then(setData)
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [params.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(load, [load]);

  async function changeStage(c, stage) {
    try {
      await api.setStage(c._id, stage);
      setData((d) => ({ ...d, items: d.items.map((x) => (x._id === c._id ? { ...x, stage } : x)) }));
      toast(`${c.name} moved to ${stage}`);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const hasFilters = FILTER_KEYS.some((k) => k !== 'sort' && k !== 'page' && q[k]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Candidates</h1>
          <p className="muted">{data.total} {data.total === 1 ? 'candidate' : 'candidates'}{hasFilters ? ' matching filters' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add candidate</button>
      </header>

      <div className="card filters">
        <input className="search" type="search" placeholder="Search name, email, position, skill, location…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={q.stage} onChange={(e) => update({ stage: e.target.value })} aria-label="Stage">
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={q.source} onChange={(e) => update({ source: e.target.value })} aria-label="Source">
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input placeholder="Skill (e.g. React)" value={q.skill} onChange={(e) => update({ skill: e.target.value })} aria-label="Skill" />
        <select value={q.minExp} onChange={(e) => update({ minExp: e.target.value })} aria-label="Minimum experience">
          <option value="">Any experience</option>
          {[1, 2, 3, 5, 8].map((n) => <option key={n} value={n}>{n}+ years</option>)}
        </select>
        <select value={q.sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort">
          <option value="">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
          <option value="rating">Top rated</option>
          <option value="experience">Most experienced</option>
        </select>
        {(hasFilters || q.position) && (
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setParams({}, { replace: true }); }}>Clear</button>
        )}
      </div>
      {q.position && (
        <div className="chips">
          Position: <span className="chip">{q.position} <button onClick={() => update({ position: '' })} aria-label="Remove">×</button></span>
        </div>
      )}

      <div className="card table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Position</th>
              <th className="hide-sm">Skills</th>
              <th className="hide-sm">Exp</th>
              <th>Stage</th>
              <th className="hide-sm">Rating</th>
              <th className="hide-sm">Applied</th>
            </tr>
          </thead>
          <tbody className={loading ? 'loading' : ''}>
            {data.items.map((c) => (
              <tr key={c._id} className="row-link" onClick={() => navigate(`/candidates/${c._id}`)}>
                <td>
                  <div className="person">
                    <span className="avatar">{initials(c.name)}</span>
                    <div>
                      <Link to={`/candidates/${c._id}`} onClick={(e) => e.stopPropagation()}>{c.name}</Link>
                      <div className="muted small">{c.email}</div>
                    </div>
                  </div>
                </td>
                <td>{c.position}<div className="muted small">{c.location}</div></td>
                <td className="hide-sm">
                  <div className="tags">{c.skills.slice(0, 3).map((s) => <span key={s} className="tag">{s}</span>)}{c.skills.length > 3 && <span className="tag muted">+{c.skills.length - 3}</span>}</div>
                </td>
                <td className="hide-sm">{c.experience}y</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select className={`stage-select stage-${c.stage.toLowerCase()}`} value={c.stage} onChange={(e) => changeStage(c, e.target.value)} aria-label="Change stage">
                    {STAGES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="hide-sm"><Rating value={c.rating} size="sm" /></td>
                <td className="hide-sm muted">{fmtDate(c.appliedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data.items.length === 0 && <div className="empty">No candidates found. Try adjusting your search or filters.</div>}
      </div>

      {data.pages > 1 && (
        <div className="pager">
          <button className="btn" disabled={data.page <= 1} onClick={() => update({ page: String(data.page - 1) })}>← Prev</button>
          <span className="muted">Page {data.page} of {data.pages}</span>
          <button className="btn" disabled={data.page >= data.pages} onClick={() => update({ page: String(data.page + 1) })}>Next →</button>
        </div>
      )}

      {showForm && (
        <CandidateForm onClose={() => setShowForm(false)} onSaved={(c) => { setShowForm(false); navigate(`/candidates/${c._id}`); }} />
      )}
    </>
  );
}
