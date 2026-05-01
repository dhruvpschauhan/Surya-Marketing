import { useState } from 'react';
import { formatIndianCurrency, getCategoryBadgeClass, getMaterialBadgeClass, COMPANIES } from '../../utils/helpers';
import { exportQuotePDF, exportQuoteExcel } from '../../api/client';

export default function QuoteResults({ data, onNewQuote }) {
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [exporting, setExporting] = useState(null);

  if (!data) return null;

  const { quote_id, line_items = [], company_totals = [], discounts_used = [] } = data;

  // Find lowest line total per row
  const getRowLowest = (item) => {
    const vals = COMPANIES.map(c => {
      const val = item[`line_total_${c.toLowerCase()}`];
      return val ? parseFloat(val) : Infinity;
    });
    return Math.min(...vals);
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res = type === 'pdf'
        ? await exportQuotePDF(quote_id)
        : await exportQuoteExcel(quote_id);

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `QuoteForge_${quote_id.slice(0, 8)}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setExporting(null);
    }
  };

  const validItems = line_items.filter(li => !li.error);
  const bestCompany = company_totals.find(ct => ct.is_best_price)?.company;

  return (
    <div className="animate-slide-up mt-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            Quote Results
            <span className="text-xs text-[var(--color-text-muted)] font-normal ml-3">
              ID: {quote_id?.slice(0, 8)}
            </span>
          </h3>
          <div className="flex gap-2">
            <button onClick={() => handleExport('excel')} className="btn-secondary text-xs" disabled={!!exporting}>
              {exporting === 'excel' ? '⏳' : '📊'} Excel
            </button>
            <button onClick={() => handleExport('pdf')} className="btn-secondary text-xs" disabled={!!exporting}>
              {exporting === 'pdf' ? '⏳' : '📄'} PDF
            </button>
            <button onClick={onNewQuote} className="btn-primary text-xs">
              ✨ New Quote
            </button>
          </div>
        </div>

        {/* ─── Line Items Table ─── */}
        <div className="overflow-x-auto mb-6 rounded-lg border border-[var(--color-border)]">
          <table className="data-table">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)]">
                <th className="text-center w-[40px]">Sr.</th>
                <th>Product Code</th>
                <th>Description</th>
                <th className="text-center">Cat.</th>
                <th className="text-center">Material</th>
                <th className="text-center">Qty</th>
                <th className="text-right company-tint-apollo">Apollo</th>
                <th className="text-right company-tint-supreme">Supreme</th>
                <th className="text-right company-tint-astral">Astral</th>
                <th className="text-right company-tint-ashirvad">Ashirvad</th>
              </tr>
            </thead>
            <tbody>
              {validItems.map((item, idx) => {
                const lowest = getRowLowest(item);
                return (
                  <tr key={idx} className="stagger-reveal" style={{ animationDelay: `${idx * 60}ms` }}>
                    <td className="text-center text-[var(--color-text-muted)]">{item.sr}</td>
                    <td className="mono text-[var(--color-accent)]">{item.product_code}</td>
                    <td className="text-xs text-[var(--color-text-secondary)] max-w-[180px] truncate">{item.description}</td>
                    <td className="text-center">
                      <span className={`badge ${getCategoryBadgeClass(item.category)}`}>{item.category}</span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${getMaterialBadgeClass(item.material_type)}`}>{item.material_type}</span>
                    </td>
                    <td className="text-center mono">{item.quantity}</td>
                    {COMPANIES.map(c => {
                      const val = item[`line_total_${c.toLowerCase()}`];
                      const isLowest = val && parseFloat(val) === lowest && lowest !== Infinity;
                      return (
                        <td key={c} className={`text-right mono text-xs ${isLowest ? 'best-price-cell' : ''}`}>
                          {val ? formatIndianCurrency(val) : '—'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ─── Company Totals ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {company_totals.map((ct) => (
            <div
              key={ct.company}
              className={`card p-4 text-center relative ${ct.is_best_price ? 'animate-pulse-glow border-[var(--color-success)]' : ''}`}
            >
              {ct.is_best_price && (
                <span className="best-price-badge absolute -top-2 left-1/2 -translate-x-1/2">
                  🏆 Best Price
                </span>
              )}
              <p className="text-xs text-[var(--color-text-muted)] mb-1 mt-1">{ct.company}</p>
              <p className={`text-lg font-bold font-mono ${ct.is_best_price ? 'text-[var(--color-success)]' : 'text-[var(--color-text-primary)]'}`}>
                {formatIndianCurrency(ct.total)}
              </p>
            </div>
          ))}
        </div>

        {/* ─── Collapsible Discounts ─── */}
        <button
          onClick={() => setShowDiscounts(!showDiscounts)}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors mb-3"
        >
          {showDiscounts ? '▾' : '▸'} Discount rates applied ({discounts_used.length} rates)
        </button>

        {showDiscounts && (
          <div className="animate-fade-in overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="data-table">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.03)]">
                  <th>Company</th>
                  <th>Category</th>
                  <th>Material</th>
                  <th className="text-right">Discount %</th>
                </tr>
              </thead>
              <tbody>
                {discounts_used.map((d, idx) => (
                  <tr key={idx}>
                    <td className="font-medium">{d.company}</td>
                    <td>
                      <span className={`badge ${getCategoryBadgeClass(d.category)}`}>{d.category}</span>
                    </td>
                    <td>
                      <span className={`badge ${getMaterialBadgeClass(d.material_type)}`}>{d.material_type}</span>
                    </td>
                    <td className="text-right mono font-medium text-[var(--color-accent)]">{d.discount_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Error items */}
        {line_items.filter(li => li.error).length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
            <p className="text-xs font-medium text-[var(--color-error)] mb-2">⚠ Items with errors (excluded from totals):</p>
            {line_items.filter(li => li.error).map((li, idx) => (
              <p key={idx} className="text-xs text-[var(--color-text-muted)]">
                <span className="mono text-[var(--color-error)]">{li.product_code}</span> — {li.error}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
