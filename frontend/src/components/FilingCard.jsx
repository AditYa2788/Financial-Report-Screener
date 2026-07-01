import { useNavigate } from 'react-router-dom';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function FilingCard({ filing, onSelect }) {
  const navigate = useNavigate();
  const topTerms = (filing.topKeywords || []).slice(0, 5);

  return (
    <div
      className="card p-4 hover:border-cyan-800 transition-colors cursor-pointer group"
      onClick={() => onSelect ? onSelect(filing) : navigate(`/search?q=&filing=${filing.accessionNumber}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold text-sm text-cyan-400">{filing.ticker}</span>
            <span className="badge-blue">{filing.filingType}</span>
          </div>
          <p className="text-sm text-gray-200 font-medium truncate">{filing.companyName}</p>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">{fmt(filing.filedAt)}</p>
        </div>
        <div className="text-right shrink-0">
          {filing.paragraphCount != null && (
            <p className="text-xs text-gray-500 font-mono">{filing.paragraphCount.toLocaleString()} paras</p>
          )}
          {filing.wordCount != null && (
            <p className="text-xs text-gray-500 font-mono">{Math.round(filing.wordCount / 1000)}k words</p>
          )}
        </div>
      </div>

      {topTerms.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {topTerms.map(({ term }) => (
            <span key={term} className="tag-pill text-[11px]">{term}</span>
          ))}
        </div>
      )}
    </div>
  );
}
