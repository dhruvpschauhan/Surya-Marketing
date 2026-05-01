import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Quote', icon: '⚡' },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/admin', label: 'Admin', icon: '⚙️' },
  { to: '/settings', label: 'Settings', icon: '🔧' },
];

export default function BottomTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[var(--color-card)] border-t border-[var(--color-border)] flex items-center justify-around px-2 z-50">
      {navItems.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              isActive
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <span className="text-xl">{icon}</span>
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? 'text-[var(--color-accent)]' : ''}`}>
                {label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-[3px] bg-[var(--color-accent)] rounded-t-md" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
