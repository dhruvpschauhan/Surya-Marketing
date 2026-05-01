import { useState, useEffect } from 'react';
import Autocomplete from './Autocomplete';
import { formatIndianCurrency, getCategoryBadgeClass, getMaterialBadgeClass } from '../../utils/helpers';

export default function ProductRow({ item, index, onUpdate, onRemove }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleProductSelect = (product) => {
    onUpdate(index, {
      ...item,
      product_code: product.product_code,
      description: product.description,
      category: product.category,
      material_type: product.material_type,
      mrp_apollo: product.mrp_apollo,
      mrp_supreme: product.mrp_supreme,
      mrp_astral: product.mrp_astral,
      mrp_ashirvad: product.mrp_ashirvad,
      isValid: true,
      error: null,
    });
  };

  const handleCodeChange = (code) => {
    onUpdate(index, { ...item, product_code: code, isValid: false });
  };

  const handleQtyChange = (e) => {
    const val = e.target.value;
    onUpdate(index, { ...item, quantity: val });
  };

  const inputStyle = item.error ? { borderColor: 'var(--color-error)' } : {};

  if (isMobile) {
    return (
      <div 
        className="card p-3 mb-3 animate-slide-in-left group hover:bg-[rgba(255,255,255,0.02)] transition-colors relative"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* ─── MOBILE LAYOUT (< 768px) ─── */}
        <div className="flex flex-col gap-3">
          {/* Top Row: Autocomplete + Delete */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Autocomplete
                value={item.product_code}
                onChange={handleCodeChange}
                onSelect={handleProductSelect}
              />
              {item.error && <p className="text-[10px] text-[var(--color-error)] mt-1">{item.error}</p>}
            </div>
            <button
              onClick={() => onRemove(index)}
              className="w-11 h-11 shrink-0 rounded-lg bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:border-[rgba(239,68,68,0.3)] transition-all flex items-center justify-center text-lg"
            >
              ✕
            </button>
          </div>

          {/* Auto-filled row: Description + Badges */}
          {item.description && (
            <div className="flex flex-col gap-1.5 p-2.5 rounded-md bg-[rgba(255,255,255,0.02)] border border-[var(--color-border)]">
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-tight">{item.description}</p>
              <div className="flex gap-2 mt-1">
                {item.category && <span className={`badge ${getCategoryBadgeClass(item.category)}`}>{item.category}</span>}
                {item.material_type && <span className={`badge ${getMaterialBadgeClass(item.material_type)}`}>{item.material_type}</span>}
              </div>
            </div>
          )}

          {/* MRPs (2x2 grid) */}
          {item.isValid && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between items-center bg-[rgba(220,38,38,0.05)] rounded p-2 border border-[rgba(220,38,38,0.1)]">
                <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold">Apollo</span>
                <span className="font-mono text-xs">{item.mrp_apollo ? formatIndianCurrency(item.mrp_apollo) : '—'}</span>
              </div>
              <div className="flex justify-between items-center bg-[rgba(37,99,235,0.05)] rounded p-2 border border-[rgba(37,99,235,0.1)]">
                <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold">Supreme</span>
                <span className="font-mono text-xs">{item.mrp_supreme ? formatIndianCurrency(item.mrp_supreme) : '—'}</span>
              </div>
              <div className="flex justify-between items-center bg-[rgba(22,163,74,0.05)] rounded p-2 border border-[rgba(22,163,74,0.1)]">
                <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold">Astral</span>
                <span className="font-mono text-xs">{item.mrp_astral ? formatIndianCurrency(item.mrp_astral) : '—'}</span>
              </div>
              <div className="flex justify-between items-center bg-[rgba(217,119,6,0.05)] rounded p-2 border border-[rgba(217,119,6,0.1)]">
                <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold">Ashirvad</span>
                <span className="font-mono text-xs">{item.mrp_ashirvad ? formatIndianCurrency(item.mrp_ashirvad) : '—'}</span>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-1">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={item.quantity}
              onChange={handleQtyChange}
              placeholder="Quantity..."
              className="input-field mono w-full h-11 text-[15px]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="table-row animate-slide-in-left group hover:bg-[rgba(255,255,255,0.02)] transition-colors relative"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* ─── DESKTOP LAYOUT (>= 768px) ─── */}
      <div className="table-cell p-3 text-center text-[var(--color-text-muted)] align-middle border-b border-[var(--color-border)] sticky left-0 bg-[#141414] group-hover:bg-[#1A1A1A] z-20">
        {index + 1}
      </div>

      <div className="table-cell p-3 align-middle border-b border-[var(--color-border)] sticky left-[40px] bg-[#141414] group-hover:bg-[#1A1A1A] z-20 min-w-[140px]">
        <Autocomplete
          value={item.product_code}
          onChange={handleCodeChange}
          onSelect={handleProductSelect}
        />
        {item.error && <p className="text-[10px] text-[var(--color-error)] mt-1 absolute">{item.error}</p>}
      </div>

      <div className="table-cell p-3 text-xs text-[var(--color-text-secondary)] align-middle border-b border-[var(--color-border)] min-w-[200px] truncate max-w-[250px]">
        {item.description || '—'}
      </div>

      <div className="table-cell p-3 text-center align-middle border-b border-[var(--color-border)]">
        {item.category ? <span className={`badge ${getCategoryBadgeClass(item.category)}`}>{item.category}</span> : '—'}
      </div>

      <div className="table-cell p-3 text-center align-middle border-b border-[var(--color-border)]">
        {item.material_type ? <span className={`badge ${getMaterialBadgeClass(item.material_type)}`}>{item.material_type}</span> : '—'}
      </div>

      <div className="table-cell p-3 text-right font-mono text-[13px] align-middle border-b border-[var(--color-border)] company-tint-apollo">
        {item.mrp_apollo ? formatIndianCurrency(item.mrp_apollo) : '—'}
      </div>
      <div className="table-cell p-3 text-right font-mono text-[13px] align-middle border-b border-[var(--color-border)] company-tint-supreme">
        {item.mrp_supreme ? formatIndianCurrency(item.mrp_supreme) : '—'}
      </div>
      <div className="table-cell p-3 text-right font-mono text-[13px] align-middle border-b border-[var(--color-border)] company-tint-astral">
        {item.mrp_astral ? formatIndianCurrency(item.mrp_astral) : '—'}
      </div>
      <div className="table-cell p-3 text-right font-mono text-[13px] align-middle border-b border-[var(--color-border)] company-tint-ashirvad">
        {item.mrp_ashirvad ? formatIndianCurrency(item.mrp_ashirvad) : '—'}
      </div>

      <div className="table-cell p-3 align-middle border-b border-[var(--color-border)] sticky right-[40px] bg-[#141414] group-hover:bg-[#1A1A1A] z-20 w-[90px]">
        <input
          type="number"
          step="any"
          min="0"
          value={item.quantity}
          onChange={handleQtyChange}
          placeholder="Qty"
          className="input-field mono w-full text-center h-[36px]"
        />
      </div>

      <div className="table-cell p-3 text-center align-middle border-b border-[var(--color-border)] sticky right-0 bg-[#141414] group-hover:bg-[#1A1A1A] z-20 w-[40px]">
        <button
          onClick={() => onRemove(index)}
          className="w-7 h-7 rounded-md bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[rgba(239,68,68,0.1)] transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Remove row"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
