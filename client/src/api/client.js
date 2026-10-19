async function request(path, { method = 'GET', body, params } = {}) {
  const qs = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString()
    : '';
  const res = await fetch(`/api${path}${qs}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.errors = data.errors || {};
    throw err;
  }
  return data;
}

export const api = {
  meta: () => request('/candidates/meta'),
  list: (params) => request('/candidates', { params }),
  get: (id) => request(`/candidates/${id}`),
  create: (body) => request('/candidates', { method: 'POST', body }),
  update: (id, body) => request(`/candidates/${id}`, { method: 'PUT', body }),
  setStage: (id, stage) => request(`/candidates/${id}/stage`, { method: 'PATCH', body: { stage } }),
  addNote: (id, text) => request(`/candidates/${id}/notes`, { method: 'POST', body: { text } }),
  deleteNote: (id, noteId) => request(`/candidates/${id}/notes/${noteId}`, { method: 'DELETE' }),
  remove: (id) => request(`/candidates/${id}`, { method: 'DELETE' }),
  metrics: () => request('/dashboard/metrics'),
};
