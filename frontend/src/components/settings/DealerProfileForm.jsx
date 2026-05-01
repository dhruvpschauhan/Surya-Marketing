import { useState, useEffect } from 'react';
import { getDealerProfile, updateDealerProfile, uploadLogo } from '../../api/client';

export default function DealerProfileForm() {
  const [profile, setProfile] = useState({
    dealer_name: '', gst_number: '', mobile_number: '', address: '', logo_url: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDealerProfile().then(res => setProfile(res.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateDealerProfile(profile);
      setProfile(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(`Save failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadLogo(file);
      setProfile(prev => ({ ...prev, logo_url: res.data.logo_url }));
    } catch (err) {
      alert(`Logo upload failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const fields = [
    { key: 'dealer_name', label: 'Business Name', placeholder: 'e.g. Surya Marketing' },
    { key: 'gst_number', label: 'GST Number', placeholder: 'e.g. 24AXXXXXX1234X1Z5' },
    { key: 'mobile_number', label: 'Mobile Number', placeholder: 'e.g. +91 98765 43210' },
  ];

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold mb-5">Dealer Profile</h3>

      <div className="space-y-4 max-w-lg">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className="grid grid-cols-[140px_1fr] items-center gap-4">
            <label className="text-xs text-[var(--color-text-muted)] font-medium">{label}</label>
            <input
              type="text"
              value={profile[key] || ''}
              onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
              placeholder={placeholder}
              className="input-field"
            />
          </div>
        ))}

        <div className="grid grid-cols-[140px_1fr] items-start gap-4">
          <label className="text-xs text-[var(--color-text-muted)] font-medium mt-2">Address</label>
          <textarea
            value={profile.address || ''}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            placeholder="Full business address"
            rows={3}
            className="input-field resize-none"
          />
        </div>

        <div className="grid grid-cols-[140px_1fr] items-center gap-4">
          <label className="text-xs text-[var(--color-text-muted)] font-medium">Logo</label>
          <div className="flex items-center gap-3">
            {profile.logo_url && (
              <img src={profile.logo_url} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="text-xs text-[var(--color-text-muted)]"
            />
          </div>
        </div>

        <div className="pt-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
