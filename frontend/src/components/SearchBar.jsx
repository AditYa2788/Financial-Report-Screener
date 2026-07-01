import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SUGGESTIONS = [
  'supply chain disruption',
  'margin expansion',
  'revenue growth',
  'artificial intelligence investment',
  'regulatory risk',
  'operating leverage',
  'customer acquisition cost',
  'debt refinancing',
  'capital allocation',
  'competitive moat'
];

export default function SearchBar({ initialQuery = '', onSearch }) {
  const [q, setQ] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();

  const submit = (query) => {
    const trimmed = (query || q).trim();
    if (!trimmed) return;
    if (onSearch) {
      onSearch(trimmed);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
    setFocused(false);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder='Search concepts: "supply chain issues", "margin growth", "AI investment"…'
          className="w-full bg-surface-800 border border-surface-600 rounded-xl pl-11 pr-28 py-4
                     text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500
                     focus:ring-1 focus:ring-cyan-500 transition-colors"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary text-xs py-2"
        >
          Search Filings
        </button>
      </form>

      {/* Suggestion chips */}
      {focused && !q && (
        <div className="absolute top-full left-0 right-0 mt-2 card p-3 z-40 shadow-2xl">
          <p className="section-title mb-2">Try searching for</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onMouseDown={() => submit(s)}
                className="tag-pill text-xs"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
