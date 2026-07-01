import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getTrendingKeywords, getKeywordHistory } from '../services/api';

const COLORS = ['#22d3ee', '#34d399', '#f472b6', '#a78bfa', '#fb923c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs space-y-1">
      <p className="text-gray-400 font-mono mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ color: p.color }}>▪</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{p.name}</span>
          <span className="text-white">{p.value?.toFixed(4)}</span>
        </div>
      ))}
    </div>
  );
};

export default function Trends() {
  const [searchParams] = useSearchParams();
  const initialTerm = searchParams.get('term') || '';

  const [trending, setTrending] = useState([]);
  const [selectedTerms, setSelectedTerms] = useState(initialTerm ? [initialTerm] : []);
  const [input, setInput] = useState('');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    getTrendingKeywords({ limit: 25 }).then(r => setTrending(r.keywords || [])).catch(() => {});
  }, []);

  const fetchHistory = useCallback(async (terms) => {
    if (!terms.length) { setChartData([]); setNoData(false); return; }
    setLoading(true);
    setNoData(false);
    try {
      const results = await Promise.all(
        terms.map(t => getKeywordHistory({ term: t, days: 30 }))
      );

      // Merge all terms into date-keyed rows: { date: 'Jan 1', term1: score, term2: score }
      const merged = {};
      results.forEach((res, i) => {
        const term = terms[i];
        (res.data || []).forEach(d => {
          const dateKey = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!merged[dateKey]) merged[dateKey] = { date: dateKey, _ts: new Date(d.date).getTime() };
          merged[dateKey][term] = parseFloat((d.score || 0).toFixed(4));
        });
      });

      const sorted = Object.values(merged).sort((a, b) => a._ts - b._ts);
      setChartData(sorted);
      setNoData(sorted.length === 0);
    } catch {
      setNoData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(selectedTerms); }, [selectedTerms, fetchHistory]);

  const addTerm = (term) => {
    const t = term.toLowerCase().trim();
    if (!t || selectedTerms.includes(t) || selectedTerms.length >= 5) return;
    setSelectedTerms(prev => [...prev, t]);
  };

  const removeTerm = (term) => setSelectedTerms(prev => prev.filter(t => t !== term));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) { addTerm(input.trim()); setInput(''); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Keyword Trends</h1>
        <p className="text-gray-400 text-sm">
          Track how terms rise and fall in TF-IDF significance across SEC filings over the last 30 days.
        </p>
      </div>

      {/* Term selector */}
      <div className="card p-5 space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a term to track (e.g. tariff, AI, margin, revenue)…"
            className="input-field text-sm flex-1"
          />
          <button
            type="submit"
            disabled={selectedTerms.length >= 5 || !input.trim()}
            className="btn-primary text-sm px-5 disabled:opacity-40"
          >
            Track
          </button>
        </form>

        {selectedTerms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTerms.map((t, i) => (
              <span
                key={t}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border"
                style={{ borderColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length] }}
              >
                {t}
                <button
                  onClick={() => removeTerm(t)}
                  className="opacity-50 hover:opacity-100 ml-0.5 font-bold"
                  aria-label={`Remove ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-600 font-mono">Max 5 terms · Click any trending tag below to add it</p>
      </div>

      {/* Line chart */}
      <div className="card p-5">
        <div className="section-title mb-5">TF-IDF Score — Last 30 Days</div>

        {loading && (
          <div className="h-72 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !selectedTerms.length && (
          <div className="h-72 flex flex-col items-center justify-center text-center">
            <p className="text-gray-500 text-sm">Select a term above or click a tag below to see its trend.</p>
          </div>
        )}

        {!loading && selectedTerms.length > 0 && noData && (
          <div className="h-72 flex flex-col items-center justify-center text-center space-y-2">
            <p className="text-gray-400 text-sm">No historical data found for these terms.</p>
            <p className="text-gray-600 text-xs font-mono">
              Run <code className="text-cyan-400">npm run seed</code> in the backend to populate 30 days of sample data.
            </p>
          </div>
        )}

        {!loading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={v => v.toFixed(3)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '16px' }}
              />
              {selectedTerms.map((t, i) => (
                <Line
                  key={t}
                  type="monotone"
                  dataKey={t}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Trending pills */}
      {trending.length > 0 && (
        <div className="card p-5">
          <div className="section-title mb-3">Today's Trending Terms</div>
          <div className="flex flex-wrap gap-2">
            {trending.map((kw, i) => {
              const isSelected = selectedTerms.includes(kw.term);
              const isFull = selectedTerms.length >= 5;
              return (
                <button
                  key={kw.term}
                  onClick={() => addTerm(kw.term)}
                  disabled={isSelected || isFull}
                  className={`tag-pill text-xs flex items-center gap-1.5 transition-opacity ${
                    isSelected ? 'opacity-40 cursor-default' : isFull ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  title={`Score: ${kw.score?.toFixed(3)} · ${kw.filingCount} filing(s) · ${kw.companies?.join(', ')}`}
                >
                  <span style={{ color: COLORS[i % COLORS.length] }}>▪</span>
                  {kw.term}
                  <span className="text-gray-600">{kw.filingCount}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
