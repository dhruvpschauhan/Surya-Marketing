import { useState, useRef } from 'react';
import { uploadProducts, syncProducts, listProducts } from '../../api/client';
import { getCategoryBadgeClass, getMaterialBadgeClass, formatIndianCurrency } from '../../utils/helpers';

export default function ProductMaster({ adminPassword }) {
  const [preview, setPreview] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState({ search: '', category: '', material_type: '' });
  const [loadingProducts, setLoadingProducts] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadProducts(file, adminPassword);
      setPreview(res.data);
      setSyncResult(null);
    } catch (err) {
      alert(`Upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setUploading(false);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCategoryOverride = (idx, newCat) => {
    const updated = { ...preview };
    updated.products = [...updated.products];
    updated.products[idx] = { ...updated.products[idx], category: newCat };
    setPreview(updated);
  };

  const handleSync = async () => {
    if (!preview) return;
    setSyncing(true);
    try {
      const res = await syncProducts(preview.products, adminPassword);
      setSyncResult(res.data);
      setPreview(null);
      fetchProducts();
    } catch (err) {
      alert(`Sync failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await listProducts(filter);
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSearch = () => fetchProducts();

  return (
    <div className="space-y-6">
      {/* Upload */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">Upload Product Master</h3>
        <div className="flex items-center gap-3 mb-3">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleUpload}
            className="text-xs text-[var(--color-text-muted)]"
          />
          {uploading && <span className="text-xs text-[var(--color-accent)]">Parsing...</span>}
        </div>

        {preview && preview.errors?.length > 0 && (
          <div className="mb-3 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
            {preview.errors.map((e, i) => (
              <p key={i} className="text-xs text-[var(--color-error)]">{e}</p>
            ))}
          </div>
        )}

        {/* Preview Table */}
        {preview && preview.products?.length > 0 && (
          <div className="animate-fade-in">
            <p className="text-xs text-[var(--color-text-muted)] mb-2">
              Preview: {preview.total_rows} products found
            </p>
            <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] max-h-[400px] overflow-y-auto">
              <table className="data-table">
                <thead className="sticky top-0 bg-[var(--color-card)]">
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Material</th>
                    <th className="text-right">Apollo</th>
                    <th className="text-right">Supreme</th>
                    <th className="text-right">Astral</th>
                    <th className="text-right">Ashirvad</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.products.slice(0, 100).map((p, idx) => (
                    <tr key={idx}>
                      <td className="mono text-xs text-[var(--color-accent)]">{p.product_code}</td>
                      <td className="text-xs max-w-[200px] truncate">{p.description}</td>
                      <td>
                        <select
                          value={p.category}
                          onChange={(e) => handleCategoryOverride(idx, e.target.value)}
                          className="input-field text-xs py-1 px-2 w-[90px]"
                        >
                          <option value="Pipe">Pipe</option>
                          <option value="Fitting">Fitting</option>
                          <option value="Solvent">Solvent</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${getMaterialBadgeClass(p.material_type)}`}>
                          {p.material_type}
                        </span>
                      </td>
                      <td className="text-right mono text-xs">{p.mrp_apollo ? formatIndianCurrency(p.mrp_apollo) : '—'}</td>
                      <td className="text-right mono text-xs">{p.mrp_supreme ? formatIndianCurrency(p.mrp_supreme) : '—'}</td>
                      <td className="text-right mono text-xs">{p.mrp_astral ? formatIndianCurrency(p.mrp_astral) : '—'}</td>
                      <td className="text-right mono text-xs">{p.mrp_ashirvad ? formatIndianCurrency(p.mrp_ashirvad) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.products.length > 100 && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Showing 100 of {preview.products.length} products
              </p>
            )}
            <div className="flex gap-3 mt-3">
              <button onClick={handleSync} disabled={syncing} className="btn-primary text-xs">
                {syncing ? 'Syncing...' : '📥 Sync to Database'}
              </button>
              <button onClick={() => setPreview(null)} className="btn-secondary text-xs">Cancel</button>
            </div>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className="mt-3 p-3 rounded-lg bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] animate-fade-in">
            <p className="text-xs font-medium text-[var(--color-success)] mb-1">Sync Complete</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              ✅ {syncResult.new_count} new  |  📝 {syncResult.updated_count} updated  |
              ➖ {syncResult.unchanged_count} unchanged  |  ❌ {syncResult.error_count} errors
            </p>
            {syncResult.errors?.length > 0 && (
              <div className="mt-2">
                {syncResult.errors.map((e, i) => (
                  <p key={i} className="text-xs text-[var(--color-error)]">{e}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Table */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">Product Database</h3>
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search code or description..."
            className="input-field w-[250px]"
          />
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="input-field w-[120px]"
          >
            <option value="">All Categories</option>
            <option value="Pipe">Pipe</option>
            <option value="Fitting">Fitting</option>
            <option value="Solvent">Solvent</option>
          </select>
          <select
            value={filter.material_type}
            onChange={(e) => setFilter({ ...filter, material_type: e.target.value })}
            className="input-field w-[120px]"
          >
            <option value="">All Types</option>
            <option value="PVC">PVC</option>
            <option value="CPVC">CPVC</option>
          </select>
          <button onClick={handleSearch} className="btn-secondary text-xs">🔍 Search</button>
        </div>

        {loadingProducts ? (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-6">Loading...</p>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] max-h-[500px] overflow-y-auto">
            <table className="data-table">
              <thead className="sticky top-0 bg-[var(--color-card)]">
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th className="text-center">Category</th>
                  <th className="text-center">Material</th>
                  <th className="text-right">Apollo</th>
                  <th className="text-right">Supreme</th>
                  <th className="text-right">Astral</th>
                  <th className="text-right">Ashirvad</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.product_code}>
                    <td className="mono text-xs text-[var(--color-accent)]">{p.product_code}</td>
                    <td className="text-xs max-w-[200px] truncate">{p.description}</td>
                    <td className="text-center">
                      <span className={`badge ${getCategoryBadgeClass(p.category)}`}>{p.category}</span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${getMaterialBadgeClass(p.material_type)}`}>{p.material_type}</span>
                    </td>
                    <td className="text-right mono text-xs">{p.mrp_apollo ? formatIndianCurrency(p.mrp_apollo) : '—'}</td>
                    <td className="text-right mono text-xs">{p.mrp_supreme ? formatIndianCurrency(p.mrp_supreme) : '—'}</td>
                    <td className="text-right mono text-xs">{p.mrp_astral ? formatIndianCurrency(p.mrp_astral) : '—'}</td>
                    <td className="text-right mono text-xs">{p.mrp_ashirvad ? formatIndianCurrency(p.mrp_ashirvad) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-6">
            No products loaded. Upload a product master file or click Search.
          </p>
        )}
      </div>
    </div>
  );
}
