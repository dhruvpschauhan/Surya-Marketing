import { useState, useEffect } from 'react';
import ProductRow from './ProductRow';
import QuoteResults from './QuoteResults';
import { generateQuote, getDiscounts } from '../../api/client';

const COMPANIES = ['Apollo', 'Supreme', 'Astral', 'Ashirvad'];

const emptyItem = () => ({
  product_code: '',
  description: '',
  category: '',
  material_type: '',
  mrp_apollo: null,
  mrp_supreme: null,
  mrp_astral: null,
  mrp_ashirvad: null,
  quantity: '',
  isValid: false,
  error: null,
  discount_overrides: { Apollo: null, Supreme: null, Astral: null, Ashirvad: null },
});

export default function QuoteBuilder() {
  const [clientName, setClientName] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [masterDiscounts, setMasterDiscounts] = useState({});

  // Fetch master discount rates once on mount
  useEffect(() => {
    getDiscounts()
      .then(res => {
        const lookup = {};
        for (const cell of (res.data?.cells || [])) {
          const key = `${cell.company}|${cell.category}|${cell.material_type}`;
          lookup[key] = parseFloat(cell.discount_percent);
        }
        setMasterDiscounts(lookup);
      })
      .catch(() => {});
  }, []);

  const getMasterDiscount = (company, category, materialType) => {
    const key = `${company}|${category}|${materialType}`;
    return masterDiscounts[key] ?? null;
  };

  const handleUpdateItem = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      setItems([emptyItem()]);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleAddRow = () => {
    setItems([...items, emptyItem()]);
  };

  const canGenerate = items.some(
    (item) => item.isValid && item.quantity && parseFloat(item.quantity) > 0
  );

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const validItems = items
        .filter(i => i.product_code && i.quantity && parseFloat(i.quantity) > 0)
        .map(i => {
          // Build discount_overrides: only include non-null values
          const overrides = {};
          let hasAny = false;
          for (const c of COMPANIES) {
            const v = i.discount_overrides?.[c];
            overrides[c] = v !== null && v !== undefined && v !== '' ? parseFloat(v) : null;
            if (overrides[c] !== null) hasAny = true;
          }

          return {
            product_code: i.product_code,
            quantity: parseFloat(i.quantity),
            discount_overrides: hasAny ? overrides : null,
          };
        });

      const res = await generateQuote({
        client_name: clientName,
        items: validItems,
      });

      setResults(res.data);
    } catch (err) {
      alert(`Error generating quote: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuote = () => {
    setResults(null);
    setClientName('');
    setItems([emptyItem()]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pb-16 md:pb-0">
      {/* Quote Form */}
      <div className="card p-4 md:p-6 mb-4 relative z-10">
        <div className="mb-6">
          <h2 className="text-[20px] font-semibold text-[var(--color-text-primary)] tracking-tight">Quote Builder</h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Add products and quantities to generate multi-brand comparison
          </p>
        </div>

        {/* Client Name */}
        <div className="mb-6">
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client or contractor name..."
            className="input-field w-full md:max-w-md h-11 text-[14px]"
            id="client-name-input"
          />
        </div>

        {/* Product List */}
        <div className="md:border md:border-[var(--color-border)] md:rounded-lg md:overflow-x-auto mb-4">
          <div className="flex flex-col md:table w-full md:min-w-[900px] gap-3 md:gap-0">
            {/* Desktop Header */}
            <div className="hidden md:table-header-group bg-[#141414] sticky top-0 z-20">
              <div className="table-row">
                <div className="table-cell p-3 text-left text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)] sticky left-0 bg-[#141414] w-[40px] z-30">Sr.</div>
                <div className="table-cell p-3 text-left text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)] sticky left-[40px] bg-[#141414] min-w-[140px] z-30">Product Code</div>
                <div className="table-cell p-3 text-left text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)] min-w-[200px]">Description</div>
                <div className="table-cell p-3 text-center text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)]">Category</div>
                <div className="table-cell p-3 text-center text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)]">Material</div>
                <div className="table-cell p-3 text-right text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)] company-tint-apollo" title="Apollo MRP">Apollo</div>
                <div className="table-cell p-3 text-right text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)] company-tint-supreme" title="Supreme MRP">Supreme</div>
                <div className="table-cell p-3 text-right text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)] company-tint-astral" title="Astral MRP">Astral</div>
                <div className="table-cell p-3 text-right text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)] company-tint-ashirvad" title="Ashirvad MRP">Ashirvad</div>
                <div className="table-cell p-3 text-center text-[10px] uppercase font-semibold text-[var(--color-text-muted)] tracking-wider border-b border-[var(--color-border)] sticky right-[80px] bg-[#141414] w-[90px] z-30">Qty</div>
                <div className="table-cell p-3 border-b border-[var(--color-border)] sticky right-[40px] bg-[#141414] w-[40px] z-30"></div>
                <div className="table-cell p-3 border-b border-[var(--color-border)] sticky right-0 bg-[#141414] w-[40px] z-30"></div>
              </div>
            </div>

            {/* Rows / Cards */}
            <div className="flex flex-col md:table-row-group gap-3 md:gap-0">
              {items.map((item, index) => (
                <ProductRow
                  key={index}
                  item={item}
                  index={index}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                  getMasterDiscount={getMasterDiscount}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center justify-between mt-2">
          <button onClick={handleAddRow} className="btn-secondary text-[13px] border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
            <span className="text-lg mr-1 leading-none">+</span> Add Product
          </button>
          
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="btn-primary w-[140px] justify-center h-[40px]"
            id="generate-quote-btn-desktop"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-black/20 border-t-black rounded-full"></span>
              </>
            ) : (
              <>Generate Quote</>
            )}
          </button>
        </div>

        {/* Mobile: Add Product + Generate — both in-flow, never overlap */}
        <div className="md:hidden flex flex-col gap-3 mt-3">
          <button onClick={handleAddRow} className="w-full btn-secondary flex items-center justify-center border-dashed py-3">
            <span className="text-xl mr-2 leading-none">+</span> Add Product
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="w-full btn-primary h-[50px] text-[15px] justify-center"
            id="generate-quote-btn-mobile"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-black/20 border-t-black rounded-full mr-2"></span>
                Calculating...
              </>
            ) : (
              <>⚡ Generate Quote</>
            )}
          </button>
        </div>
      </div>

      {/* Shimmer effect on generating */}
      {loading && (
        <div className="card p-8 text-center animate-shimmer relative z-0">
          <p className="text-sm text-[var(--color-text-muted)]">
            Calculating quotes across all 4 brands...
          </p>
        </div>
      )}

      {/* Results */}
      <QuoteResults data={results} onNewQuote={handleNewQuote} />
    </div>
  );
}
