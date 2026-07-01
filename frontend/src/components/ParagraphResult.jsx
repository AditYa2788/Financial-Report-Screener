function highlight(text, query) {
  if (!query || !text) return text;
  const words = query.split(/\s+/).filter(w => w.length > 2);
  if (!words.length) return text;
  const pattern = new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part)
      ? <mark key={i} className="bg-cyan-900/60 text-cyan-200 rounded px-0.5">{part}</mark>
      : part
  );
}

function pct(similarity) {
  return Math.round(similarity * 100);
}

function scoreColor(similarity) {
  if (similarity > 0.5) return 'text-emerald-400';
  if (similarity > 0.3) return 'text-cyan-400';
  if (similarity > 0.1) return 'text-blue-400';
  return 'text-gray-400';
}

export default function ParagraphResult({ result, query, index }) {
  const score = result.similarity || 0;
  const barWidth = Math.min(100, score * 200);

  return (
    <div className="card p-4 fade-up" style={{ animationDelay: `${index * 40}ms` }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-sm text-cyan-400">{result.ticker}</span>
          <span className="badge-blue text-[10px]">{result.filingType}</span>
          <span className="text-xs text-gray-500 truncate font-mono">
            {result.companyName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-mono text-xs font-bold ${scoreColor(score)}`}>
            {pct(score)}% match
          </span>
        </div>
      </div>

      {/* Match bar */}
      <div className="h-1 bg-surface-700 rounded-full mb-3">
        <div className="similarity-bar h-1 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
      </div>

      {/* Paragraph text */}
      <p className="text-sm text-gray-300 leading-relaxed">
        {highlight(result.text, query)}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-surface-700">
        <span className="text-xs text-gray-600 font-mono">
          {result.filedAt ? new Date(result.filedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
        </span>
        <span className="text-xs text-gray-600 font-mono">Para #{result.paragraphIndex}</span>
        {result.wordCount && (
          <span className="text-xs text-gray-600 font-mono">{result.wordCount} tokens</span>
        )}
        <span className="ml-auto text-[10px] text-gray-600 font-mono">{result.accessionNumber}</span>
      </div>
    </div>
  );
}
