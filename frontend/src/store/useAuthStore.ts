import { create } from 'zustand';
import type { User } from '../types/auth';
import { personas } from '../demo/data';
const KEY = 'digitalfactory-demo-role';
function initialUser(): User | null {
  try { return personas.find(p => p.role === sessionStorage.getItem(KEY)) || null; } catch { return null; }
}
const user = initialUser();
interface AuthState {
  token: string | null; user: User | null; isAuthenticated: boolean;
  login: (token: string, user: User) => void; logout: () => void;
}
export const useAuthStore = create<AuthState>(set => ({
  token: user ? 'demo-local' : null, user, isAuthenticated: !!user,
  login: (_token, user) => {
    try { sessionStorage.setItem(KEY, user.role); } catch { /* In-memory session. */ }
    set({ token: 'demo-local', user, isAuthenticated: true });
  },
  logout: () => {
    try { sessionStorage.removeItem(KEY); } catch { /* In-memory session. */ }
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
