export const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
export const SOURCES = ['LinkedIn', 'Referral', 'Job Board', 'Company Site', 'Agency', 'Other'];

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const initials = (name = '') => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
