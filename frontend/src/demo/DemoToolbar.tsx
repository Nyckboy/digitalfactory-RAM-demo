import { useAuthStore } from '../store/useAuthStore';
import { resetDemo } from './adapter';

export function DemoToolbar() {
  const logout = useAuthStore(s => s.logout);
  const user = useAuthStore(s => s.user);
  return <aside aria-label="Demo controls" className="relative z-40 border-b border-outline-variant bg-surface-container-lowest px-4 py-3 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 rounded-full bg-primary-container/10 px-3 py-1 text-xs font-semibold text-primary">Portfolio demo</span>
        <p className="hidden sm:block text-xs text-secondary">Fictional data. Simulated AI. Explore freely.</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs sm:text-sm">
        {user && <button className="px-3 py-2 rounded-lg hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary" onClick={() => { logout(); window.location.assign('/login'); }}>Switch role</button>}
        <button className="px-3 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary" onClick={() => { if (window.confirm('Reset all sample projects, tasks, and comments in this tab?')) { logout(); resetDemo(); } }}>Reset demo</button>
      </div>
    </div>
  </aside>;
}
