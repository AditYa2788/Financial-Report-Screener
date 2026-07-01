import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="border-b border-surface-700 bg-surface-900/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-cyan-400 font-mono text-lg font-bold tracking-tight">
            FIN<span className="text-emerald-400">SCREEN</span>
          </span>
          <span className="hidden sm:block text-xs text-gray-500 font-mono border border-surface-600 rounded px-1.5 py-0.5">
            SEC · AI
          </span>
        </Link>

        {/* Quick search */}
        {location.pathname !== '/' && (
          <form onSubmit={handleQuickSearch} className="flex-1 max-w-md">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Quick search filings..."
              className="input-field text-xs py-2"
            />
          </form>
        )}

        <nav className="ml-auto flex items-center gap-1">
          <Link to="/" className={`btn-ghost text-xs py-1.5 ${location.pathname === '/' ? 'text-cyan-400 border-cyan-800' : ''}`}>
            Dashboard
          </Link>
          <Link to="/search" className={`btn-ghost text-xs py-1.5 ${location.pathname === '/search' ? 'text-cyan-400 border-cyan-800' : ''}`}>
            Search
          </Link>
          <Link to="/trends" className={`btn-ghost text-xs py-1.5 ${location.pathname === '/trends' ? 'text-cyan-400 border-cyan-800' : ''}`}>
            Trends
          </Link>
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span className="text-xs text-gray-500 font-mono">LIVE</span>
        </div>
      </div>
    </header>
  );
}
