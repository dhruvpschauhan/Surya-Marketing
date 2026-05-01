import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { searchProducts } from '../../api/client';
import { getCategoryBadgeClass, getMaterialBadgeClass, formatIndianCurrency } from '../../utils/helpers';

export default function Autocomplete({ value, onChange, onSelect, disabled }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const isSelectingRef = useRef(false);
  
  const debouncedQuery = useDebounce(query, 200);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const mobileInputRef = useRef(null);

  // Check mobile status
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => { 
    if (value !== query) {
      isSelectingRef.current = true;
      setQuery(value || ''); 
      setTimeout(() => { isSelectingRef.current = false; }, 300);
    }
  }, [value]);

  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      try {
        const res = await searchProducts(debouncedQuery);
        setResults(res.data || []);
        
        const isActive = 
          (inputRef.current && document.activeElement === inputRef.current) ||
          (mobileInputRef.current && document.activeElement === mobileInputRef.current);

        if (isActive && !isSelectingRef.current && !isOpen) {
          setIsOpen(true);
        }
        setHighlightIdx(-1);
      } catch { setResults([]); }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Position dropdown on desktop
  useEffect(() => {
    if (isOpen && !isMobile && inputRef.current) {
      const updatePosition = () => {
        const rect = inputRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = Math.min(results.length * 60 + 10, 320); // max 320px
        
        let top, bottom;
        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
          // Flip upward
          bottom = window.innerHeight - rect.top + 4;
          top = 'auto';
        } else {
          // Drop downward
          top = rect.bottom + 4;
          bottom = 'auto';
        }

        setDropdownStyle({
          position: 'fixed',
          top,
          bottom,
          left: rect.left,
          width: Math.max(rect.width, 420),
          zIndex: 9999,
        });
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, isMobile, results.length]);

  // Focus mobile input when sheet opens
  useEffect(() => {
    if (isOpen && isMobile && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [isOpen, isMobile]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (isMobile) return; // handled by backdrop
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMobile]);

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIdx >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (product) => {
    isSelectingRef.current = true;
    setQuery(product.product_code);
    setIsOpen(false);
    onSelect(product);
    
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 300);
  };

  const renderDropdownContent = () => (
    <div className="flex flex-col h-full w-full">
      {results.map((product, idx) => (
        <button
          key={product.product_code}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSelect(product)}
          className={`w-full text-left px-3 py-2 flex flex-col gap-1.5 transition-colors border-b border-[var(--color-border)] last:border-b-0 ${
            idx === highlightIdx
              ? 'bg-[var(--color-accent-dim)]'
              : 'hover:bg-[rgba(255,255,255,0.04)]'
          } ${isMobile ? 'min-h-[64px] py-3' : ''}`}
        >
          {/* Line 1 */}
          <div className="flex items-center gap-2 w-full">
            <span className="font-mono text-[var(--color-accent)] font-bold text-[13px] tracking-wide shrink-0">
              {product.product_code}
            </span>
            <span className="text-[var(--color-text-primary)] text-xs truncate flex-1 opacity-90">
              {product.description?.substring(0, 40)}{product.description?.length > 40 ? '...' : ''}
            </span>
          </div>
          {/* Line 2 */}
          <div className="flex flex-wrap items-center gap-2 w-full">
            <span className={`badge ${getCategoryBadgeClass(product.category)} shrink-0 scale-90 origin-left`}>
              {product.category}
            </span>
            <span className={`badge ${getMaterialBadgeClass(product.material_type)} shrink-0 scale-90 origin-left`}>
              {product.material_type}
            </span>
            <div className="flex items-center gap-2 ml-auto text-[10px] font-mono text-[var(--color-text-secondary)]">
               <span title="Apollo" className="text-red-400">AP: {product.mrp_apollo || '—'}</span>
               <span title="Supreme" className="text-blue-400">SU: {product.mrp_supreme || '—'}</span>
               <span title="Astral" className="text-green-400">AS: {product.mrp_astral || '—'}</span>
               <span title="Ashirvad" className="text-amber-400">AV: {product.mrp_ashirvad || '—'}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (isMobile) {
            setIsOpen(true);
          } else if (results.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type code..."
        className="input-field mono w-full min-w-[120px]"
        style={{ letterSpacing: '0.05em', fontSize: '12px' }}
      />

      {isOpen && !isMobile && results.length > 0 && createPortal(
        <div 
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-2xl overflow-y-auto max-h-[320px] animate-fade-in"
        >
          {renderDropdownContent()}
        </div>,
        document.body
      )}

      {isOpen && isMobile && createPortal(
        <div className="fixed inset-0 z-[10000] flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Bottom Sheet */}
          <div className="relative w-full max-h-[70vh] min-h-[50vh] bg-[var(--color-base)] rounded-t-2xl flex flex-col shadow-2xl animate-slide-up border-t border-[var(--color-border)]">
            {/* Handle/Header */}
            <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3">
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  onChange(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search product code..."
                className="flex-1 input-field mono h-11 text-base bg-[var(--color-input)]"
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-input)] text-[var(--color-text-secondary)]"
              >
                ✕
              </button>
            </div>
            
            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-2 pb-20">
              {results.length > 0 ? renderDropdownContent() : (
                <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
                  {debouncedQuery.length > 0 ? "No matches found" : "Start typing to search..."}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
