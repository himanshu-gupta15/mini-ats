import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { STAGES, fmtDate, fmtDateTime, initials } from '../constants.js';
import StageBadge from '../components/StageBadge.jsx';
import Rating from '../components/Rating.jsx';
import CandidateForm from '../components/CandidateForm.jsx';
import { useToast } from '../components/Toast.jsx';

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [c, setC] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    setC(null);
    api.get(id).then(setC).catch((e) => setError(e.message));
  }, [id]);

  const run = async (fn, msg) => {
    try {
      const updated = await fn();
      if (updated) setC(updated);
      if (msg) toast(msg);
      return true;
    } catch (e) {
      toast(e.message, 'error');
      return false;
    }
  };

  if (error) return <div className="empty error-box">{error} <Link to="/candidates">Back to candidates</Link></div>;
  if (!c) return <div className="empty">Loading…</div>;

  const pipeline = STAGES.filter((s) => s !== 'Rejected');
  const currentIdx = pipeline.indexOf(c.stage);

  return (
    <>
      <Link to="/candidates" className="back">← All candidates</Link>
      <header className="page-head profile-head">
        <div className="person lg">
          <span className="avatar lg">{initials(c.name)}</span>
          <div>
            <h1>{c.name}</h1>
            <p className="muted">{c.position}{c.location && ` · ${c.location}`}</p>
          </div>
          <StageBadge stage={c.stage} />
        </div>
        <div className="row-gap">
          <button className="btn" onClick={() => setEditing(true)}>Edit</button>
          <button
            className="btn btn-danger"
            onClick={async () => {
              if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
              if (await run(() => api.remove(c._id), 'Candidate deleted')) navigate('/candidates');
            }}
          >
            Delete
          </button>
        </div>
      </header>

      <div className="card stepper">
        {pipeline.map((s, i) => (
          <button
            key={s}
            className={`step ${c.stage === 'Rejected' ? '' : i < currentIdx ? 'done' : i === currentIdx ? 'current' : ''}`}
            onClick={() => run(() => api.setStage(c._id, s), `Moved to ${s}`)}
            disabled={c.stage === s}
          >
            <span className="step-dot">{i + 1}</span>
            {s}
          </button>
        ))}
        <button
          className={`step reject ${c.stage === 'Rejected' ? 'current' : ''}`}
          onClick={() => run(() => api.setStage(c._id, 'Rejected'), 'Marked as rejected')}
          disabled={c.stage === 'Rejected'}
        >
          Reject
        </button>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3>Profile</h3>
          <dl className="dl">
            <dt>Email</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd>
            <dt>Phone</dt><dd>{c.phone || '—'}</dd>
            <dt>Experience</dt><dd>{c.experience} years</dd>
            <dt>Source</dt><dd>{c.source}</dd>
            <dt>Applied</dt><dd>{fmtDate(c.appliedAt)}</dd>
            <dt>Rating</dt><dd><Rating value={c.rating} onChange={(r) => run(() => api.update(c._id, { rating: r }), 'Rating saved')} /></dd>
            <dt>Resume</dt><dd>{c.resumeUrl ? <a href={c.resumeUrl} target="_blank" rel="noreferrer">Open resume ↗</a> : '—'}</dd>
          </dl>
          <h4>Skills</h4>
          <div className="tags">{c.skills.length ? c.skills.map((s) => <span key={s} className="tag">{s}</span>) : <span className="muted">No skills listed</span>}</div>
        </div>

        <div className="card">
          <h3>Notes</h3>
          <form
            className="note-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!note.trim()) return;
              if (await run(() => api.addNote(c._id, note), 'Note added')) setNote('');
            }}
          >
            <textarea rows={3} placeholder="Add a note about this candidate…" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn btn-primary" disabled={!note.trim()}>Add note</button>
          </form>
          <ul className="notes">
            {c.notes.map((n) => (
              <li key={n._id}>
                <p>{n.text}</p>
                <div className="muted small">
                  {n.author} · {fmtDateTime(n.createdAt)}
                  <button className="link-btn" onClick={() => run(() => api.deleteNote(c._id, n._id), 'Note deleted')}>Delete</button>
                </div>
              </li>
            ))}
            {c.notes.length === 0 && <li className="muted">No notes yet.</li>}
          </ul>
        </div>

        <div className="card">
          <h3>Stage history</h3>
          <ol className="timeline">
            {[...c.stageHistory].reverse().map((h, i) => (
              <li key={i}>
                <span className="dot" style={{ background: `var(--stage-${h.to.toLowerCase()})` }} />
                <div>
                  {h.from ? <>{h.from} → <strong>{h.to}</strong></> : <>Entered as <strong>{h.to}</strong></>}
                  <div className="muted small">{fmtDateTime(h.changedAt)}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {editing && <CandidateForm candidate={c} onClose={() => setEditing(false)} onSaved={(u) => { setC(u); setEditing(false); }} />}
    </>
  );
}
