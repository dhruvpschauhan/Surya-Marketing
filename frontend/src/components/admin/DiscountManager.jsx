import { useState, useEffect, useRef } from 'react';
import { getDiscounts, updateDiscounts, uploadDiscounts, syncDiscounts } from '../../api/client';
import { COMPANIES, CATEGORIES, MATERIAL_TYPES } from '../../utils/helpers';

export default function DiscountManager({ adminPassword }) {
  const [matrix, setMatrix] = useState({});
  const [timestamps, setTimestamps] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const fileRef = useRef(null);

  const rows = [];
  for (const mt of MATERIAL_TYPES) {
    for (const cat of CATEGORIES) {
      rows.push({ material_type: mt, category: cat, label: `${mt} ${cat}` });
    }
  }

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await getDiscounts();
      const m = {};
      const ts = {};
      (res.data.cells || []).forEach(cell => {
        const key = `${cell.company}|${cell.category}|${cell.material_type}`;
        m[key] = cell.discount_percent;
        ts[key] = cell.updated_at;
      });
      setMatrix(m);
      setTimestamps(ts);
    } catch (err) {
      console.error('Failed to load discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDiscounts(); }, []);

  const handleCellChange = (company, category, materialType, value) => {
    const key = `${company}|${category}|${materialType}`;
    setMatrix(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updates = [];
      for (const { material_type, category } of rows) {
        for (const company of COMPANIES) {
          const key = `${company}|${category}|${material_type}`;
          const val = matrix[key];
          if (val !== undefined && val !== '') {
            updates.push({
              company,
              category,
              material_type,
              discount_percent: parseFloat(val),
            });
          }
        }
      }
      await updateDiscounts(updates, adminPassword);
      await fetchDiscounts();
      alert('Discounts saved successfully!');
    } catch (err) {
      alert(`Save failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadDiscounts(file, adminPassword);
      setUploadPreview(res.data);
    } catch (err) {
      alert(`Upload failed: ${err.response?.data?.detail || err.message}`);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSync = async () => {
    if (!uploadPreview) return;
    setSyncing(true);
    try {
      await syncDiscounts(uploadPreview.cells, adminPassword);
      setUploadPreview(null);
      await fetchDiscounts();
      alert('Discounts synced successfully!');
    } catch (err) {
      alert(`Sync failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="text-center text-[var(--color-text-muted)] py-10">Loading discounts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Editable Grid */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Discount Matrix</h3>
          <button onClick={handleSaveAll} disabled={saving} className="btn-primary text-xs">
            {saving ? 'Saving...' : '💾 Save All'}
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="data-table">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.03)]">
                <th></th>
                {COMPANIES.map(c => (
                  <th key={c} className={`text-center company-tint-${c.toLowerCase()}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ material_type, category, label }) => (
                <tr key={label}>
                  <td className="font-medium text-xs whitespace-nowrap">
                    <span className={`badge ${material_type === 'PVC' ? 'badge-pvc' : 'badge-cpvc'}`}>
                      {material_type}
                    </span>
                    <span className="ml-2">{category}</span>
                  </td>
                  {COMPANIES.map(company => {
                    const key = `${company}|${category}|${material_type}`;
                    const ts = timestamps[key];
                    return (
                      <td key={company} className="text-center p-1" title={ts ? `Last updated: ${new Date(ts).toLocaleString()}` : ''}>
                        <input
                          type="number"
                          step="0.01"
                          value={matrix[key] ?? ''}
                          onChange={(e) => handleCellChange(company, category, material_type, e.target.value)}
                          className="input-field mono text-center w-[80px] mx-auto"
                          placeholder="%"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Section */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">Upload Discount Data</h3>
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleUpload}
            className="text-xs text-[var(--color-text-muted)]"
          />
        </div>

        {uploadPreview && (
          <div className="mt-4 animate-fade-in">
            {uploadPreview.errors?.length > 0 && (
              <div className="mb-3 p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
                {uploadPreview.errors.map((e, i) => (
                  <p key={i} className="text-xs text-[var(--color-error)]">{e}</p>
                ))}
              </div>
            )}

            {uploadPreview.changes?.length > 0 && (
              <div className="mb-3 p-3 rounded-lg bg-[rgba(245,166,35,0.1)] border border-[rgba(245,166,35,0.2)]">
                <p className="text-xs font-medium text-[var(--color-accent)] mb-1">Changes detected:</p>
                {uploadPreview.changes.map((ch, i) => (
                  <p key={i} className="text-xs text-[var(--color-text-muted)]">
                    {ch.company} / {ch.category} / {ch.material_type}: {ch.old_value}% → {ch.new_value}%
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSync} disabled={syncing} className="btn-primary text-xs">
                {syncing ? 'Syncing...' : '✅ Confirm Sync'}
              </button>
              <button onClick={() => setUploadPreview(null)} className="btn-secondary text-xs">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
