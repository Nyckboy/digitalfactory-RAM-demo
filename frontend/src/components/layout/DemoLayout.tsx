import { NavLink, Outlet } from 'react-router';
import { useAuthStore } from '../../store/useAuthStore';
import { NotificationDropdown } from '../shared/NotificationDropdown';

type Section = 'admin' | 'supervisor' | 'intern';
const sections = {
  admin: { title: 'Admin workspace', links: [['', 'Dashboard', 'dashboard'], ['/projects', 'Projects', 'folder_managed'], ['/team', 'Team', 'groups']] },
  supervisor: { title: 'Supervisor workspace', links: [['', 'Dashboard', 'dashboard'], ['/projects', 'Projects', 'folder_managed'], ['/team', 'Team directory', 'groups']] },
  intern: { title: 'Intern workspace', links: [['', 'Dashboard', 'dashboard'], ['/tasks', 'Task board', 'checklist']] },
};
export function DemoLayout({ section }: { section: Section }) {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const config = sections[section];
  const links = (mobile = false) => config.links.map(([path, label, icon]) =>
    <NavLink key={path} to={'/' + section + path} end={!path}
      className={({ isActive }) => [
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
        mobile ? 'shrink-0 px-3 py-2' : 'px-4 py-3',
        isActive ? 'bg-primary-container text-on-primary' : 'text-secondary hover:bg-surface-container-low hover:text-on-surface',
      ].join(' ')}>
      <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{icon}</span>
      {label}
    </NavLink>);
  return <div className="h-full min-h-0 flex bg-background text-on-surface">
    <aside className="hidden md:flex w-60 lg:w-64 shrink-0 flex-col overflow-y-auto border-r border-surface-container-highest bg-surface-container-lowest px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8">
        <span className="size-10 shrink-0 rounded-xl bg-primary-container text-on-primary grid place-items-center font-bold text-sm">DF</span>
        <div><p className="font-bold tracking-tight">Digital Factory</p><p className="text-xs text-secondary mt-1">{config.title}</p></div>
      </div>
      <nav aria-label={config.title} className="space-y-2">{links()}</nav>
      <div className="mt-auto pt-6">
        <div className="border-t border-surface-container-highest pt-5 px-2">
          <p className="text-sm font-semibold break-words">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-secondary mt-1">Sample account</p>
          <button onClick={logout} className="mt-4 text-sm text-primary hover:underline">Back to role selection</button>
        </div>
      </div>
    </aside>
    <main className="min-w-0 min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <header className="sticky top-0 z-30 border-b border-surface-container-highest bg-surface-container-lowest/95 backdrop-blur-sm">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-secondary hidden sm:block">Digital Factory</p>
            <h1 className="text-sm font-semibold">{config.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <NotificationDropdown />
            <button onClick={logout} className="md:hidden text-xs font-medium text-primary">Change role</button>
          </div>
        </div>
        <nav aria-label="Mobile workspace navigation" className="md:hidden flex gap-2 overflow-x-auto px-4 pb-3">{links(true)}</nav>
      </header>
      <div className="w-full max-w-7xl mx-auto min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10">
        <Outlet />
      </div>
    </main>
  </div>;
}
