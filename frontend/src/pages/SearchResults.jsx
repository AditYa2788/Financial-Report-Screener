import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ParagraphResult from '../components/ParagraphResult';
import FilingCard from '../components/FilingCard';
import { searchFilings, getFilings } from '../services/api';

const FILING_TYPES = ['All', '10-K', '8-K'];
const TICKERS = ['All', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'JNJ', 'PG'];

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const query = params.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(null);
  const [filingType, setFilingType] = useState('All');
  const [ticker, setTicker] = useState('All');
  const [filings, setFilings] = useState([]);
  const [showFilings, setShowFilings] = useState(false);

  // Load all filings for browse panel
  useEffect(() => {
    getFilings({ limit: 20 }).then(d => setFilings(d.filings || [])).catch(() => {});
  }, []);

  const doSearch = useCallback(async (q) => {
    if (!q?.trim()) {
      setResults([]);
      setShowFilings(true);
      return;
    }
    setShowFilings(false);
    setLoading(true);
    setError('');
    try {
      const data = await searchFilings(q, {
        limit: 25,
        ...(ticker !== 'All' && { company: ticker }),
        ...(filingType !== 'All' && { type: filingType })
      });
      setResults(data.results || []);
      setMeta({ total: data.total, filingsSearched: data.filingsSearched });
    } catch (err) {
      setError(err?.response?.data?.error || 'Search failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [ticker, filingType]);

  useEffect(() => {
    if (query) doSearch(query);
    else setShowFilings(true);
  }, [query, ticker, filingType]);

  const handleSearch = (q) => {
    setParams({ q });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Search bar */}
      <SearchBar initialQuery={query} onSearch={handleSearch} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="section-title">Filter:</span>
        <div className="flex gap-1">
          {FILING_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setFilingType(t)}
              className={`text-xs px-3 py-1.5 rounded-lg font-mono transition-colors border ${
                filingType === t
                  ? 'bg-cyan-900 text-cyan-300 border-cyan-700'
                  : 'border-surface-600 text-gray-400 hover:text-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {TICKERS.map(t => (
            <button
              key={t}
              onClick={() => setTicker(t)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-mono transition-colors border ${
                ticker === t
                  ? 'bg-cyan-900 text-cyan-300 border-cyan-700'
                  : 'border-surface-600 text-gray-400 hover:text-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="card p-10 text-center">
          <div className="inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Searching {meta?.filingsSearched || ''} filings…</p>
        </div>
      )}

      {error && (
        <div className="card p-6 border-red-900">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-gray-600 text-xs mt-1">Make sure the backend is running on port 5000.</p>
        </div>
      )}

      {!loading && !error && query && results.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-gray-400 mb-2">No matching paragraphs found for "{query}"</p>
          <p className="text-gray-600 text-sm">Try a broader query or seed the database first.</p>
        </div>
      )}

      {!loading && !error && query && results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">
              <span className="text-white font-semibold">{meta?.total}</span> results across{' '}
              <span className="text-white font-semibold">{meta?.filingsSearched}</span> filings for{' '}
              <span className="text-cyan-400 font-mono">"{query}"</span>
            </p>
          </div>
          <div className="space-y-3">
            {results.map((r, i) => (
              <ParagraphResult key={`${r.accessionNumber}-${r.paragraphIndex}`} result={r} query={query} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Browse all filings when no query */}
      {showFilings && !loading && (
        <div>
          <div className="section-title mb-3">Browse Indexed Filings</div>
          {filings.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400 mb-2">No filings indexed yet.</p>
              <p className="text-gray-600 text-sm">
                Run <code className="font-mono text-cyan-400">npm run seed</code> in the backend folder.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filings.map(f => (
                <FilingCard
                  key={f._id}
                  filing={f}
                  onSelect={f => handleSearch(f.topKeywords?.[0]?.term || f.ticker)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
