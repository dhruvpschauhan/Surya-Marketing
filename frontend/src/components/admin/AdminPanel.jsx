import { useState } from 'react';
import DiscountManager from './DiscountManager';
import ProductMaster from './ProductMaster';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('discounts');
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return (
      <div className="card p-8 max-w-md mx-auto mt-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-[rgba(245,166,35,0.1)] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔒</span>
        </div>
        <h3 className="text-lg font-bold mb-2">Admin Access</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Enter the admin password to manage discounts and products.
        </p>
        <input
          type="password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adminPassword && setAuthenticated(true)}
          placeholder="Admin password"
          className="input-field mb-3"
          id="admin-password-input"
        />
        <button
          onClick={() => adminPassword && setAuthenticated(true)}
          disabled={!adminPassword}
          className="btn-primary w-full"
        >
          Unlock Admin Panel
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('discounts')}
          className={`tab-btn ${activeTab === 'discounts' ? 'active' : ''}`}
        >
          📊 Discount Manager
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
        >
          📦 Product Master
        </button>
      </div>

      {activeTab === 'discounts' && <DiscountManager adminPassword={adminPassword} />}
      {activeTab === 'products' && <ProductMaster adminPassword={adminPassword} />}
    </div>
  );
}
