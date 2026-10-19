import { useState } from 'react';
import Modal from './Modal.jsx';
import Rating from './Rating.jsx';
import { api } from '../api/client.js';
import { SOURCES, STAGES } from '../constants.js';
import { useToast } from './Toast.jsx';

const EMPTY = { name: '', email: '', phone: '', position: '', location: '', experience: 0, skills: '', source: 'LinkedIn', stage: 'Applied', rating: 0, resumeUrl: '' };

export default function CandidateForm({ candidate, onClose, onSaved }) {
  const isEdit = Boolean(candidate?._id);
  const [form, setForm] = useState(() =>
    isEdit ? { ...EMPTY, ...candidate, skills: (candidate.skills || []).join(', ') } : EMPTY
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email is required';
    if (!form.position.trim()) e.position = 'Position is required';
    if (form.experience < 0) e.experience = 'Must be 0 or more';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      const body = { ...form, experience: Number(form.experience) || 0, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean) };
      const saved = isEdit ? await api.update(candidate._id, body) : await api.create(body);
      toast(isEdit ? 'Candidate updated' : 'Candidate added');
      onSaved(saved);
    } catch (err) {
      setErrors(err.errors || {});
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const field = (k, label, props = {}) => (
    <label className={`field ${errors[k] ? 'has-error' : ''}`}>
      <span>{label}</span>
      <input value={form[k]} onChange={set(k)} {...props} />
      {errors[k] && <small className="error">{errors[k]}</small>}
    </label>
  );

  return (
    <Modal title={isEdit ? 'Edit candidate' : 'Add candidate'} onClose={onClose}>
      <form onSubmit={submit} className="form" noValidate>
        <div className="grid-2">
          {field('name', 'Full name *', { autoFocus: true })}
          {field('email', 'Email *', { type: 'email' })}
          {field('phone', 'Phone')}
          {field('position', 'Position *', { list: 'positions' })}
          {field('location', 'Location')}
          {field('experience', 'Experience (years)', { type: 'number', min: 0, max: 60 })}
          <label className="field">
            <span>Source</span>
            <select value={form.source} onChange={set('source')}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          {!isEdit && (
            <label className="field">
              <span>Initial stage</span>
              <select value={form.stage} onChange={set('stage')}>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          )}
        </div>
        {field('skills', 'Skills (comma separated)', { placeholder: 'React, Node.js, MongoDB' })}
        {field('resumeUrl', 'Resume URL', { type: 'url', placeholder: 'https://…' })}
        <div className="field">
          <span>Rating</span>
          <Rating value={form.rating} onChange={set('rating')} />
        </div>
        <datalist id="positions">
          {['Frontend Engineer', 'Backend Engineer', 'Full Stack Developer', 'Product Designer', 'Data Analyst', 'DevOps Engineer'].map((p) => <option key={p} value={p} />)}
        </datalist>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add candidate'}</button>
        </div>
      </form>
    </Modal>
  );
}
