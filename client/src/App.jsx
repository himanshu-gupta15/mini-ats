import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Candidates from './pages/Candidates.jsx';
import Pipeline from './pages/Pipeline.jsx';
import CandidateDetail from './pages/CandidateDetail.jsx';

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span> Mini ATS
        </div>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/candidates">Candidates</NavLink>
          <NavLink to="/pipeline">Pipeline</NavLink>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
