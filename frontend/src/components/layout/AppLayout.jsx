import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[var(--color-base)]">
      {/* Sidebar is fixed-positioned; this spacer reserves the same width in the flex flow on desktop */}
      <div className="hidden md:block shrink-0" style={{ width: '220px' }} />
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="p-4 md:p-6 overflow-x-hidden pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
