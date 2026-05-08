import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Quote Builder', icon: '⚡' },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/admin', label: 'Admin', icon: '⚙️' },
  { to: '/settings', label: 'Settings', icon: '🔧' },
];

export default function Sidebar() {
  return (
    <aside 
      className="hidden md:flex fixed left-0 top-0 h-screen bg-[var(--color-card)] border-r border-[var(--color-border)] flex-col z-40"
      style={{ width: '220px' }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <img src="/logo_qf.ico" alt="QuoteForge Logo" className="w-8 h-8 rounded-lg object-contain" />
          <div>
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight">QuoteForge</h1>
            <p className="text-[10px] text-[var(--color-text-muted)]">Multi-Brand Quotes</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[rgba(245,166,35,0.1)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.04)]'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <p className="text-[10px] text-[var(--color-text-muted)] text-center">QuoteForge v1.0</p>
      </div>
    </aside>
  );
}
