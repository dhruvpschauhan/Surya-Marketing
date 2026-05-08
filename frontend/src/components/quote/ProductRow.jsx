import { useState, useEffect, useRef } from 'react';
import Autocomplete from './Autocomplete';
import { formatIndianCurrency, getCategoryBadgeClass, getMaterialBadgeClass } from '../../utils/helpers';

const COMPANIES = ['Apollo', 'Supreme', 'Astral', 'Ashirvad'];

export default function ProductRow({ item, index, onUpdate, onRemove, getMasterDiscount }) {
  const [isMobile, setIsMobile] = useState(false);
  const [showOverrides, setShowOverrides] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [shakeField, setShakeField] = useState(null);
  const drawerRef = useRef(null);

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
      discount_overrides: { Apollo: null, Supreme: null, Astral: null, Ashirvad: null },
    });
  };

  const handleCodeChange = (code) => {
    onUpdate(index, { ...item, product_code: code, isValid: false });
  };

  const handleQtyChange = (e) => {
    const val = e.target.value;
    onUpdate(index, { ...item, quantity: val });
  };

  const handleOverrideChange = (company, rawValue) => {
    let val = rawValue;

    // Empty = null (use master)
    if (val === '' || val === null || val === undefined) {
      const newOverrides = { ...item.discount_overrides, [company]: null };
      onUpdate(index, { ...item, discount_overrides: newOverrides });
      return;
    }

    let num = parseFloat(val);

    if (num > 100) {
      num = 100;
      val = '100';
      setShakeField(company);
      setTimeout(() => setShakeField(null), 500);
    }
    if (num < 0) {
      num = 0;
      val = '0';
    }

    const newOverrides = { ...item.discount_overrides, [company]: val };
    onUpdate(index, { ...item, discount_overrides: newOverrides });
  };

  const handleResetAll = () => {
    const newOverrides = { Apollo: null, Supreme: null, Astral: null, Ashirvad: null };
    onUpdate(index, { ...item, discount_overrides: newOverrides });
  };

  const hasAnyOverride = COMPANIES.some(c =>
    item.discount_overrides?.[c] !== null &&
    item.discount_overrides?.[c] !== undefined &&
    item.discount_overrides?.[c] !== ''
  );

  const getPlaceholder = (company) => {
    if (!item.category || !item.material_type || !getMasterDiscount) return '—';
    const master = getMasterDiscount(company, item.category, item.material_type);
    return master !== null ? String(master) : '0';
  };

  const isOverridden = (company) => {
    const v = item.discount_overrides?.[company];
    return v !== null && v !== undefined && v !== '';
  };

  // ─── MOBILE LAYOUT ───
  if (isMobile) {
    return (
      <>
        <div
          className="p-3 mb-3 animate-slide-in-left group hover:bg-[rgba(255,255,255,0.03)] transition-all relative rounded-xl bg-[var(--color-card)]"
          style={{
            animationDelay: `${index * 30}ms`,
            border: hasAnyOverride ? '1px solid rgba(245,166,35,0.4)' : '1px solid rgba(29, 185, 84, 0.25)',
            borderLeft: hasAnyOverride ? '3px solid #F5A623' : '3px solid #1DB954',
          }}
        >
          <div className="flex flex-col gap-3">
            {/* Top Row: Autocomplete + Delete */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 flex items-center gap-1">
                {hasAnyOverride && (
                  <span className="text-[#F5A623] text-xs" title="Custom discounts active for this item">●</span>
                )}
                <div className="flex-1">
                  <Autocomplete
                    value={item.product_code}
                    onChange={handleCodeChange}
                    onSelect={handleProductSelect}
                  />
                </div>
              </div>
              {item.error && <p className="text-[10px] text-[var(--color-error)] mt-1">{item.error}</p>}
              <button
                onClick={() => onRemove(index)}
                className="w-11 h-11 shrink-0 rounded-lg bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:border-[rgba(239,68,68,0.3)] transition-all flex items-center justify-center text-lg"
              >
                ✕
              </button>
            </div>

            {/* Description + Badges */}
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

            {/* Mobile Override Trigger */}
            {item.isValid && (
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className={`text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-md transition-colors ${hasAnyOverride ? 'text-[#F5A623] bg-[rgba(245,166,35,0.08)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
              >
                ✎ Discounts {hasAnyOverride && <span className="text-[8px]">● {COMPANIES.filter(c => isOverridden(c)).length} custom</span>}
              </button>
            )}
          </div>
        </div>

        {/* ─── MOBILE BOTTOM DRAWER ─── */}
        {mobileDrawerOpen && (
          <div
            className="fixed inset-0 z-[999] flex flex-col justify-end"
            onClick={(e) => { if (e.target === e.currentTarget) setMobileDrawerOpen(false); }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileDrawerOpen(false)} />

            {/* Drawer */}
            <div
              ref={drawerRef}
              className="relative z-10 bg-[#1A1A1A] rounded-t-2xl border-t border-[rgba(245,166,35,0.2)] p-5 pb-8 animate-slide-up"
              style={{ maxHeight: '80vh' }}
            >
              <div className="w-10 h-1 bg-[var(--color-border)] rounded-full mx-auto mb-4" />
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
                Override Discounts — <span className="mono text-[#F5A623]">{item.product_code}</span>
              </h4>

              <div className="flex flex-col gap-3">
                {COMPANIES.map(company => (
                  <div key={company}>
                    <label className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold mb-1 block tracking-wider">
                      {company} Discount %
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="0.5"
                      value={item.discount_overrides?.[company] ?? ''}
                      onChange={(e) => handleOverrideChange(company, e.target.value)}
                      placeholder={getPlaceholder(company)}
                      className={`input-field w-full h-12 mono text-[15px] ${isOverridden(company) ? 'border-[#F5A623] text-[#F5A623]' : ''}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 mt-5">
                <button
                  onClick={handleResetAll}
                  className="w-full py-3 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] text-sm hover:border-[var(--color-text-secondary)] transition-colors"
                >
                  × Reset All
                </button>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-full py-3 rounded-lg bg-[#F5A623] text-black font-semibold text-sm hover:bg-[#E09B1C] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ─── DESKTOP LAYOUT ───
  return (
    <>
      <div
        className="table-row animate-slide-in-left group hover:bg-[rgba(29,185,84,0.03)] transition-colors relative"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* Sr. with amber dot */}
        <div
          className="table-cell p-3 text-center text-[var(--color-text-muted)] align-middle border-b border-[rgba(29,185,84,0.2)] sticky left-0 bg-[#141414] group-hover:bg-[#1A1A1A] z-20"
          style={{ boxShadow: hasAnyOverride ? 'inset 3px 0 0 #F5A623' : 'inset 3px 0 0 #1DB954' }}
        >
          <span className="flex items-center justify-center gap-1">
            {hasAnyOverride && <span className="text-[#F5A623] text-[8px]" title="Custom discounts active for this item">●</span>}
            {index + 1}
          </span>
        </div>

        <div className="table-cell p-3 align-middle border-b border-[rgba(29,185,84,0.2)] sticky left-[40px] bg-[#141414] group-hover:bg-[#1A1A1A] z-20 min-w-[140px]">
          <Autocomplete
            value={item.product_code}
            onChange={handleCodeChange}
            onSelect={handleProductSelect}
          />
          {item.error && <p className="text-[10px] text-[var(--color-error)] mt-1 absolute">{item.error}</p>}
        </div>

        <div className="table-cell p-3 text-xs text-[var(--color-text-secondary)] align-middle border-b border-[rgba(29,185,84,0.2)] min-w-[200px] truncate max-w-[250px]">
          {item.description || '—'}
        </div>

        <div className="table-cell p-3 text-center align-middle border-b border-[rgba(29,185,84,0.2)]">
          {item.category ? <span className={`badge ${getCategoryBadgeClass(item.category)}`}>{item.category}</span> : '—'}
        </div>

        <div className="table-cell p-3 text-center align-middle border-b border-[rgba(29,185,84,0.2)]">
          {item.material_type ? <span className={`badge ${getMaterialBadgeClass(item.material_type)}`}>{item.material_type}</span> : '—'}
        </div>

        <div className="table-cell p-3 text-right font-mono text-[13px] align-middle border-b border-[rgba(29,185,84,0.2)] company-tint-apollo">
          {item.mrp_apollo ? formatIndianCurrency(item.mrp_apollo) : '—'}
        </div>
        <div className="table-cell p-3 text-right font-mono text-[13px] align-middle border-b border-[rgba(29,185,84,0.2)] company-tint-supreme">
          {item.mrp_supreme ? formatIndianCurrency(item.mrp_supreme) : '—'}
        </div>
        <div className="table-cell p-3 text-right font-mono text-[13px] align-middle border-b border-[rgba(29,185,84,0.2)] company-tint-astral">
          {item.mrp_astral ? formatIndianCurrency(item.mrp_astral) : '—'}
        </div>
        <div className="table-cell p-3 text-right font-mono text-[13px] align-middle border-b border-[rgba(29,185,84,0.2)] company-tint-ashirvad">
          {item.mrp_ashirvad ? formatIndianCurrency(item.mrp_ashirvad) : '—'}
        </div>

        <div className="table-cell p-3 align-middle border-b border-[rgba(29,185,84,0.2)] sticky right-[80px] bg-[#141414] group-hover:bg-[#1A1A1A] z-20 w-[90px]">
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

        {/* Pencil icon — toggle override sub-row */}
        <div className="table-cell p-3 text-center align-middle border-b border-[rgba(29,185,84,0.2)] sticky right-[40px] bg-[#141414] group-hover:bg-[#1A1A1A] z-20 w-[40px]">
          {item.isValid && (
            <button
              onClick={() => setShowOverrides(!showOverrides)}
              className={`w-7 h-7 rounded-md bg-transparent transition-all flex items-center justify-center text-sm ${showOverrides || hasAnyOverride ? 'text-[#F5A623] hover:bg-[rgba(245,166,35,0.1)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)] opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
              title="Override discounts for this item"
            >
              ✎
            </button>
          )}
        </div>

        {/* Delete button */}
        <div className="table-cell p-3 text-center align-middle border-b border-[rgba(29,185,84,0.2)] sticky right-0 bg-[#141414] group-hover:bg-[#1A1A1A] z-20 w-[40px]">
          <button
            onClick={() => onRemove(index)}
            className="w-7 h-7 rounded-md bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[rgba(239,68,68,0.1)] transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Remove row"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ─── OVERRIDE SUB-ROW (Desktop) ─── */}
      {showOverrides && item.isValid && (
        <div className="table-row">
          <div className="table-cell" colSpan="12" style={{ padding: 0 }}>
            {/* Force a full-width block inside */}
          </div>
          <div
            className="table-cell p-0 border-b border-[rgba(29,185,84,0.1)]"
            colSpan={12}
            style={{ background: '#1A1A1A' }}
          >
          </div>
        </div>
      )}
      {showOverrides && item.isValid && (
        <tr style={{ display: 'table-row' }}>
          <td colSpan={12} style={{ padding: 0, background: '#1A1A1A', borderTop: '1px dashed #2A2A2A', borderBottom: '1px solid rgba(29,185,84,0.15)' }}>
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold tracking-wider whitespace-nowrap">
                Custom Discounts:
              </span>
              {COMPANIES.map(company => (
                <div key={company} className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">{company}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.5"
                    value={item.discount_overrides?.[company] ?? ''}
                    onChange={(e) => handleOverrideChange(company, e.target.value)}
                    placeholder={getPlaceholder(company)}
                    className={`w-[70px] h-[28px] rounded-md text-xs text-center mono bg-[#111] border transition-all focus:outline-none focus:ring-1 ${
                      isOverridden(company)
                        ? 'border-[#F5A623] text-[#F5A623] focus:ring-[#F5A623]'
                        : 'border-[#333] text-[var(--color-text-muted)] placeholder:text-[#555] focus:ring-[var(--color-accent)]'
                    } ${shakeField === company ? 'animate-shake' : ''}`}
                    style={{ appearance: 'textfield', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                  />
                  <span className="text-[10px] text-[var(--color-text-muted)]">%</span>
                </div>
              ))}
              <button
                onClick={handleResetAll}
                className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors ml-2 whitespace-nowrap"
                title="Reset all overrides to master"
              >
                × Reset
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
