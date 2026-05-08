import { useState } from 'react';
import { formatIndianCurrency, getCategoryBadgeClass, getMaterialBadgeClass, COMPANIES } from '../../utils/helpers';
import { exportQuoteExcel } from '../../api/client';

export default function QuoteResults({ data, onNewQuote }) {
  const [exporting, setExporting] = useState(null);

  if (!data) return null;

  const { quote_id, line_items = [], company_totals = [] } = data;

  // Find lowest line total per row
  const getRowLowest = (item) => {
    const vals = COMPANIES.map(c => {
      const val = item[`line_total_${c.toLowerCase()}`];
      return val ? parseFloat(val) : Infinity;
    });
    return Math.min(...vals);
  };

  const handleExcelExport = async () => {
    setExporting('excel');
    try {
      const res = await exportQuoteExcel(quote_id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `QuoteForge_${quote_id.slice(0, 8)}.xlsx`;
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

  const handlePdfExport = async () => {
    if (!quote_id) return;
    setExporting('pdf');

    try {
      const companies = ['Apollo', 'Supreme', 'Astral', 'Ashirvad'];

      const baseUrl = import.meta.env.VITE_API_URL || '';

      // Fire all 5 requests simultaneously
      const requests = [
        fetch(`${baseUrl}/api/pdf/comparison`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quote_id }),
        }),
        ...companies.map(company =>
          fetch(`${baseUrl}/api/pdf/brand/${company}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quote_id }),
          })
        ),
      ];

      const responses = await Promise.all(requests);
      const filenames = ['Comparison', ...companies];

      // Download all 5 files
      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) throw new Error(`Failed: ${filenames[i]}.pdf`);
        const blob = await responses[i].blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filenames[i]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('PDF download failed:', err);
      alert(`PDF export failed: ${err.message}`);
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
            <button onClick={handleExcelExport} className="btn-secondary text-xs" disabled={!!exporting}>
              {exporting === 'excel' ? '⏳' : '📊'} Excel
            </button>
            <button onClick={handlePdfExport} className="btn-secondary text-xs" disabled={!!exporting}>
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
                const hasOverride = item.has_override;
                return (
                  <tr
                    key={idx}
                    className="stagger-reveal"
                    style={{
                      animationDelay: `${idx * 60}ms`,
                      borderLeft: hasOverride ? '3px solid #F5A623' : undefined,
                    }}
                  >
                    <td className="text-center text-[var(--color-text-muted)]">
                      <span className="flex items-center justify-center gap-1">
                        {hasOverride && <span className="text-[#F5A623] text-[8px]" title="Custom discounts were used for this item">●</span>}
                        {item.sr}
                      </span>
                    </td>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2 mt-4">
          {company_totals.map((ct) => (
            <div
              key={ct.company}
              className={`card p-4 text-center flex flex-col justify-center items-center gap-1 ${ct.is_best_price ? 'animate-pulse-glow border-[var(--color-success)]' : ''}`}
            >
              {ct.is_best_price && (
                <span className="best-price-badge whitespace-nowrap shadow-md mb-1">
                  🏆 Best Price
                </span>
              )}
              <p className={`text-xs ${ct.is_best_price ? 'text-[var(--color-success)] font-semibold' : 'text-[var(--color-text-muted)]'}`}>
                {ct.company}
              </p>
              <p className={`text-lg font-bold font-mono ${ct.is_best_price ? 'text-[var(--color-success)]' : 'text-[var(--color-text-primary)]'}`}>
                {formatIndianCurrency(ct.total_with_gst)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] text-center mb-6 italic">
          * Rates are GST inclusive
        </p>

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
