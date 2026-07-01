import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getTrendingKeywords } from '../services/api';

const COLORS = [
  '#22d3ee','#34d399','#60a5fa','#a78bfa','#f472b6',
  '#facc15','#fb923c','#4ade80','#38bdf8','#e879f9'
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card px-3 py-2 text-xs">
      <p className="font-mono text-cyan-300 font-semibold">{d.term}</p>
      <p className="text-gray-400">Score: <span className="text-white">{d.score.toFixed(3)}</span></p>
      <p className="text-gray-400">Filings: <span className="text-white">{d.filingCount}</span></p>
      {d.companies?.length > 0 && (
        <p className="text-gray-400">
          Companies: <span className="text-emerald-400">{d.companies.slice(0, 3).join(', ')}</span>
        </p>
      )}
    </div>
  );
};

export default function TrendingKeywords() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('chart'); // 'chart' | 'pills'
  const navigate = useNavigate();

  useEffect(() => {
    getTrendingKeywords({ limit: 20 })
      .then(res => setData(res.keywords || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleTermClick = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  if (loading) return (
    <div className="card p-6">
      <div className="section-title mb-4">Trending Keywords</div>
      <div className="h-40 flex items-center justify-center text-gray-500 text-sm">Loading...</div>
    </div>
  );

  if (!data.length) return (
    <div className="card p-6">
      <div className="section-title mb-4">Trending Keywords</div>
      <p className="text-gray-500 text-sm">No keyword data yet. Run the seed script or wait for the cron job.</p>
    </div>
  );

  const chartData = data.slice(0, 12).map(k => ({ ...k, score: parseFloat(k.score.toFixed(3)) }));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="section-title">Trending Keywords</div>
          <p className="text-xs text-gray-500 mt-0.5">Uniquely significant terms across today's filings (TF-IDF)</p>
        </div>
        <div className="flex gap-1">
          {['chart', 'pills'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs px-2.5 py-1 rounded font-mono transition-colors ${
                view === v ? 'bg-cyan-900 text-cyan-300' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'chart' ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} onClick={e => e?.activePayload && handleTermClick(e.activePayload[0].payload.term)}>
            <XAxis
              dataKey="term"
              tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="score" radius={[3, 3, 0, 0]} className="cursor-pointer">
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-wrap gap-2 mt-2">
          {data.map((kw, i) => (
            <button
              key={kw.term}
              onClick={() => handleTermClick(kw.term)}
              className="tag-pill flex items-center gap-1.5"
              title={`Score: ${kw.score.toFixed(3)} · ${kw.filingCount} filing(s)`}
            >
              <span style={{ color: COLORS[i % COLORS.length] }}>▪</span>
              {kw.term}
              <span className="text-gray-500 text-[10px]">{kw.filingCount}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
