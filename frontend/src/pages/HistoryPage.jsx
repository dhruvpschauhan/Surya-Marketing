import { useState, useEffect } from 'react';
import { getQuoteHistory, deleteQuote, getQuoteDetail } from '../api/client';
import { formatIndianCurrency } from '../utils/helpers';
import QuoteResults from '../components/quote/QuoteResults';

export default function HistoryPage() {
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 15 };
      if (search) params.search = search;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await getQuoteHistory(params);
      setQuotes(res.data.quotes);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [page]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this quote?')) return;
    try {
      await deleteQuote(id);
      fetchHistory();
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleViewDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await getQuoteDetail(id);
      setSelectedQuote(res.data);
    } catch (err) {
      alert(`Failed to load quote: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (selectedQuote) {
    return (
      <div>
        <button onClick={() => setSelectedQuote(null)} className="btn-secondary text-xs mb-4">
          ← Back to History
        </button>
        <QuoteResults data={selectedQuote} onNewQuote={() => setSelectedQuote(null)} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-5">Quote History</h2>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
          placeholder="Search by client name..."
          className="input-field w-[250px]"
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="input-field w-[150px]"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="input-field w-[150px]"
        />
        <button onClick={fetchHistory} className="btn-secondary text-xs">🔍 Filter</button>
      </div>

      {loading ? (
        <p className="text-xs text-[var(--color-text-muted)] text-center py-10">Loading...</p>
      ) : quotes.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="data-table">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.03)]">
                  <th>Date</th>
                  <th>Client</th>
                  <th className="text-center">Items</th>
                  <th className="text-right company-tint-apollo">Apollo</th>
                  <th className="text-right company-tint-supreme">Supreme</th>
                  <th className="text-right company-tint-astral">Astral</th>
                  <th className="text-right company-tint-ashirvad">Ashirvad</th>
                  <th className="text-center w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                    onClick={() => handleViewDetail(q.id)}
                  >
                    <td className="text-xs text-[var(--color-text-muted)]">
                      {new Date(q.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="font-medium text-sm">{q.client_name || '—'}</td>
                    <td className="text-center">
                      <span className="badge badge-pipe">{q.item_count}</span>
                    </td>
                    <td className="text-right mono text-xs">{q.total_apollo ? formatIndianCurrency(q.total_apollo) : '—'}</td>
                    <td className="text-right mono text-xs">{q.total_supreme ? formatIndianCurrency(q.total_supreme) : '—'}</td>
                    <td className="text-right mono text-xs">{q.total_astral ? formatIndianCurrency(q.total_astral) : '—'}</td>
                    <td className="text-right mono text-xs">{q.total_ashirvad ? formatIndianCurrency(q.total_ashirvad) : '—'}</td>
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="btn-danger text-[10px] py-1 px-2"
                        title="Delete quote"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[var(--color-text-muted)]">{total} quotes total</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs"
              >← Prev</button>
              <span className="text-xs text-[var(--color-text-muted)] flex items-center">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={quotes.length < 15}
                className="btn-secondary text-xs"
              >Next →</button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-2xl mb-3">📋</p>
          <p className="text-sm text-[var(--color-text-muted)]">No quotes yet. Generate your first quote!</p>
        </div>
      )}
    </div>
  );
}
