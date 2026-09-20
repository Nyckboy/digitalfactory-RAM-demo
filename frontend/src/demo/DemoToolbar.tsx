import { useAuthStore } from '../store/useAuthStore';
import { resetDemo } from './adapter';
export function DemoToolbar() {
  const logout = useAuthStore(s => s.logout);
  return <aside aria-label="Demo controls" className="fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest border-t border-outline-variant px-4 py-3 flex flex-wrap gap-3 items-center justify-between shadow-lg">
    <p className="text-xs sm:text-sm text-secondary"><strong className="text-on-surface">Portfolio demo</strong> &middot; Fictional data &middot; AI is simulated</p>
    <div className="flex gap-3 text-sm">
      <button className="px-3 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-low" onClick={() => window.location.assign('/login')}>Switch role</button>
      <button className="px-3 py-2 rounded-lg bg-primary-container text-on-primary" onClick={() => { if (window.confirm('Reset all sample projects, tasks, and comments in this tab?')) { logout(); resetDemo(); } }}>Reset demo</button>
    </div>
  </aside>;
}
