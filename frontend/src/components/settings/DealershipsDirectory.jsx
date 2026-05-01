import { useState, useEffect } from 'react';
import { listDealerships, createDealership, updateDealership, deleteDealership } from '../../api/client';

const emptyForm = { company_name: '', contact_person: '', mobile_number: '', email: '', address: '', notes: '' };

export default function DealershipsDirectory() {
  const [dealerships, setDealerships] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchDealerships(); }, []);

  const fetchDealerships = async () => {
    try {
      const res = await listDealerships();
      setDealerships(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDealership(editingId, form);
      } else {
        await createDealership(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchDealerships();
    } catch (err) {
      alert(`Save failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleEdit = (d) => {
    setForm({
      company_name: d.company_name,
      contact_person: d.contact_person,
      mobile_number: d.mobile_number,
      email: d.email,
      address: d.address,
      notes: d.notes,
    });
    setEditingId(d.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this dealership contact?')) return;
    try {
      await deleteDealership(id);
      fetchDealerships();
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleCopy = (d) => {
    const text = `${d.company_name}\n${d.contact_person}\n${d.mobile_number}\n${d.email}\n${d.address}`;
    navigator.clipboard.writeText(text);
    alert('Contact copied to clipboard!');
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold">Dealerships Directory</h3>
          <p className="text-[10px] text-[var(--color-text-muted)]">Internal supplier contacts — not shown on client output</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="btn-primary text-xs">
          + Add Contact
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-5 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-input)] animate-fade-in">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Company Name *" className="input-field" />
            <input type="text" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="Contact Person" className="input-field" />
            <input type="text" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} placeholder="Mobile Number" className="input-field" />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input-field" />
          </div>
          <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="input-field mb-3" />
          <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="input-field mb-3" />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!form.company_name} className="btn-primary text-xs">
              {editingId ? 'Update' : 'Add'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="btn-secondary text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {dealerships.length > 0 ? (
        <div className="space-y-2">
          {dealerships.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-hover)] transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium">{d.company_name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {d.contact_person && `${d.contact_person} · `}
                  {d.mobile_number && `${d.mobile_number} · `}
                  {d.email}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleCopy(d)} className="btn-secondary text-[10px] py-1 px-2">📋</button>
                <button onClick={() => handleEdit(d)} className="btn-secondary text-[10px] py-1 px-2">✏️</button>
                <button onClick={() => handleDelete(d.id)} className="btn-danger text-[10px] py-1 px-2">🗑</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-text-muted)] text-center py-6">No dealership contacts yet.</p>
      )}
    </div>
  );
}
