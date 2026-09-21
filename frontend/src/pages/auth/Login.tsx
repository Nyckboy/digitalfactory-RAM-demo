import { useNavigate } from 'react-router';
import { personas } from '../../demo/data';
import { useAuthStore } from '../../store/useAuthStore';
import hero from '../../assets/hero.png';
const destinations = { SUPER_ADMIN: '/admin', SUPERVISOR: '/supervisor', INTERN: '/intern' };
const labels = { SUPER_ADMIN: 'Explore as admin', SUPERVISOR: 'Explore as supervisor', INTERN: 'Explore as intern' };
const descriptions = { SUPER_ADMIN: 'Shape projects, manage the team, and try a simulated AI project draft.', SUPERVISOR: 'Assign tasks, review deliverables, and follow your team\'s progress.', INTERN: 'Work through your task board, share a deliverable, and join a discussion.' };
export const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  return <main className="min-h-full bg-background text-on-surface grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
    <section className="relative overflow-hidden bg-primary-container text-on-primary p-6 sm:p-10 xl:p-16 flex flex-col justify-center">
      <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
      <div className="relative max-w-lg">
        <p className="uppercase tracking-[0.25em] text-xs mb-5 lg:mb-8">Digital Factory / Interactive demo</p>
        <h1 className="text-3xl sm:text-4xl xl:text-6xl font-bold leading-tight mb-6">Good ideas.<br />Shared progress.</h1>
        <p className="text-base lg:text-lg leading-relaxed opacity-90">Explore how admins, supervisors, and interns turn a project brief into completed work.</p>
        <a href="https://github.com/Nyckboy/digitalfactory-RAM" target="_blank" rel="noreferrer" className="inline-block mt-5 lg:mt-10 text-sm underline underline-offset-4">View the full application's source code</a>
      </div>
    </section>
    <section className="min-w-0 p-5 sm:p-8 xl:p-12 flex flex-col justify-center">
      <div className="max-w-lg mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Choose your perspective</h2>
        <p className="text-sm leading-relaxed text-secondary mb-6">No account needed. All people and projects are fictional. Your changes stay in this browser tab; reset whenever you like.</p>
        <div className="space-y-3">{personas.map(person => <button key={person.id} onClick={() => { login('demo-local', person); navigate(destinations[person.role]); }} className="block w-full text-left p-4 sm:p-5 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary">
          <span className="block text-base font-semibold mb-2">{labels[person.role]} <span aria-hidden="true"> &rarr;</span></span>
          <span className="block text-sm text-secondary">{descriptions[person.role]}</span>
        </button>)}</div>
      </div>
    </section>
  </main>;
};
