import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import TrendingKeywords from '../components/TrendingKeywords';
import StatsBar from '../components/StatsBar';
import FilingCard from '../components/FilingCard';
import { getFilings, getFilingStats, ingestCompany } from '../services/api';

const QUICK_QUERIES = [
  'supply chain disruption', 'AI investment', 'margin expansion',
  'regulatory risk', 'debt reduction', 'workforce reduction'
];

function IngestForm() {
  const [cik, setCik] = useState('');
  const [ticker, setTicker] = useState('');
  const [status, setStatus] = useState('idle');

  const submit = async (e) => {
    e.preventDefault();
    if (!cik.trim()) return;
    setStatus('loading');
    try {
      await ingestCompany({ cik: cik.trim(), ticker: ticker.trim().toUpperCase() });
      setStatus('success');
      setCik('');
      setTicker('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        value={cik}
        onChange={e => setCik(e.target.value)}
        placeholder="CIK (e.g. 320193 for Apple)"
        className="input-field text-xs"
      />
      <input
        value={ticker}
        onChange={e => setTicker(e.target.value)}
        placeholder="Ticker symbol (optional)"
        className="input-field text-xs"
      />
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full text-xs disabled:opacity-50">
        {status === 'loading' ? 'Queuing…' : 'Ingest Filings'}
      </button>
      {status === 'success' && <p className="text-xs text-emerald-400">Queued — processing in background.</p>}
      {status === 'error' && <p className="text-xs text-red-400">Failed. Check the CIK and server connection.</p>}
    </form>
  );
}

export default function Home() {
  const [recentFilings, setRecentFilings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingFilings, setLoadingFilings] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getFilings({ limit: 6 }), getFilingStats()])
      .then(([filingsData, statsData]) => {
        setRecentFilings(filingsData.filings || []);
        setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoadingFilings(false));
  }, []);

  return (
    <div>
      <StatsBar />

      {/* Hero */}
      <div className="border-b border-surface-700 bg-gradient-to-b from-surface-800/40 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-3xl">
            <p className="section-title mb-3">Thematic · Semantic · Instant</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
              Search SEC Filings by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                Concept, Not Keyword
              </span>
            </h1>
            <p className="text-gray-400 mb-8 max-w-xl">
              TF-IDF extracts what's uniquely significant per filing. Cosine similarity ranks paragraphs by semantic closeness to your query.
            </p>
            <SearchBar />
            <div className="flex flex-wrap gap-2 mt-3">
              {QUICK_QUERIES.map(q => (
                <button
                  key={q}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
                  className="tag-pill text-xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col */}
        <div className="lg:col-span-2 space-y-6">
          <TrendingKeywords />

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="section-title">Recent Filings</div>
              <button onClick={() => navigate('/search')} className="text-xs text-cyan-400 hover:text-cyan-300 font-mono">
                View all →
              </button>
            </div>
            {loadingFilings ? (
              <div className="card p-8 text-center text-gray-500 text-sm">Loading filings…</div>
            ) : recentFilings.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-gray-400 mb-2">No filings indexed yet.</p>
                <p className="text-gray-600 text-sm">
                  Run <code className="text-cyan-400 font-mono">npm run seed</code> in the backend to populate demo data.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentFilings.map(f => (
                  <FilingCard key={f._id} filing={f} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="section-title mb-4">How It Works</div>
            <ol className="space-y-3">
              {[
                { n: '01', t: 'EDGAR Scraper', d: 'Cron jobs pull 10-K and 8-K filings from SEC EDGAR every day.' },
                { n: '02', t: 'TF-IDF Analysis', d: 'Extracts terms uniquely significant to each filing vs. the corpus.' },
                { n: '03', t: 'Cosine Similarity', d: 'Matches your query to the most semantically relevant paragraphs.' },
                { n: '04', t: 'Ranked Results', d: 'Results sorted by similarity score with query-term highlighting.' }
              ].map(({ n, t, d }) => (
                <li key={n} className="flex gap-3">
                  <span className="text-xs font-mono text-cyan-500 font-bold mt-0.5 shrink-0">{n}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-200">{t}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {stats?.recentFilings?.length > 0 && (
            <div className="card p-5">
              <div className="section-title mb-3">Latest Processed</div>
              <div className="space-y-2">
                {stats.recentFilings.slice(0, 5).map(f => (
                  <div key={f._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{f.ticker}</span>
                      <span className="badge-blue text-[9px]">{f.filingType}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(f.filedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="section-title mb-3">Add a Company</div>
            <p className="text-xs text-gray-500 mb-3">Enter an SEC CIK number to index filings for any public company.</p>
            <IngestForm />
          </div>
        </div>
      </div>
    </div>
  );
}
