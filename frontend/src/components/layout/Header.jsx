import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDealerProfile } from '../../hooks/useDealerProfile';

const navItems = [
  { to: '/',        label: 'Quote',    icon: '⚡' },
  { to: '/history', label: 'History',  icon: '📋' },
  { to: '/admin',   label: 'Admin',    icon: '⚙️' },
  { to: '/settings',label: 'Settings', icon: '🔧' },
];

export default function Header() {
  const { profile } = useDealerProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="h-14 bg-[var(--color-base)] md:bg-[var(--color-card)] border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="md:hidden w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shrink-0">
            <span className="text-black font-bold text-sm">QF</span>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
              {profile?.dealer_name || 'QuoteForge'}
            </h2>
            <div className="hidden md:flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] mt-0.5 font-medium tracking-wide">
              {profile?.gst_number && <span>GSTIN: {profile.gst_number}</span>}
              {profile?.gst_number && profile?.mobile_number && <span>·</span>}
              {profile?.mobile_number && <span>Mob: {profile.mobile_number}</span>}
            </div>
            <div className="md:hidden text-[11px] text-[var(--color-text-muted)] mt-0.5 font-medium tracking-wide">
              Multi-Brand Quotes
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Online indicator (desktop only) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" title="System Online" />
            <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">Online</span>
          </div>

          {/* Hamburger button — mobile only */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-all"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="4"  width="14" height="1.8" rx="0.9" fill="currentColor"/>
              <rect x="2" y="8.1" width="14" height="1.8" rx="0.9" fill="currentColor"/>
              <rect x="2" y="12.2" width="14" height="1.8" rx="0.9" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile Slide-in Drawer ── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="md:hidden fixed top-0 right-0 h-full w-[72vw] max-w-[280px] bg-[var(--color-card)] border-l border-[var(--color-border)] z-[9999] flex flex-col animate-slide-in-right shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
                  <span className="text-black font-bold text-xs">QF</span>
                </div>
                <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">QuoteForge</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.05)] transition-all"
              >
                ✕
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 py-3 px-3 flex flex-col gap-1">
              {navItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[rgba(245,166,35,0.12)] text-[var(--color-accent)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.04)]'
                    }`
                  }
                >
                  <span className="text-xl leading-none">{icon}</span>
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Drawer Footer */}
            <div className="px-5 py-4 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                <span className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">System Online</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
