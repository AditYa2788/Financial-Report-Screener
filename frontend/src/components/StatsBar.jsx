import { useEffect, useState } from 'react';
import { getFilingStats } from '../services/api';

export default function StatsBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getFilingStats().then(setStats).catch(() => {});
  }, []);

  const items = stats
    ? [
        { label: 'Filings Indexed', value: stats.totalFilings.toLocaleString() },
        { label: 'Companies Tracked', value: stats.totalCompanies.toLocaleString() },
        { label: 'Algorithm', value: 'TF-IDF + Cosine' },
        { label: 'Source', value: 'SEC EDGAR' }
      ]
    : [
        { label: 'Filings Indexed', value: '—' },
        { label: 'Companies Tracked', value: '—' },
        { label: 'Algorithm', value: 'TF-IDF + Cosine' },
        { label: 'Source', value: 'SEC EDGAR' }
      ];

  return (
    <div className="border-b border-surface-700 bg-surface-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap gap-x-8 gap-y-1">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-mono">{label}</span>
            <span className="text-xs font-mono font-semibold text-cyan-400">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
