import { create } from 'zustand';
import { User, UserRole } from '../types';

const API_URL = window.location.origin + '/api';

const loadCurrentUser = (): User | null => {
  try {
    const u = localStorage.getItem('erp_current_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  kassir: 'Kassir',
  omborchi: 'Omborchi',
};

export const ROLE_NAV: Record<UserRole, string[]> = {
  admin: ['/', '/sotuv', '/mijozlar', '/haydovchilar', '/firmalar', '/ombor', '/xarajatlar', '/ishchilar', '/foydalanuvchilar', '/hisobotlar', '/sozlamalar'],
  operator: ['/', '/sotuv', '/mijozlar', '/haydovchilar', '/firmalar', '/ombor', '/xarajatlar', '/hisobotlar'],
  kassir: ['/', '/sotuv', '/mijozlar', '/hisobotlar'],
  omborchi: ['/', '/ombor', '/haydovchilar', '/firmalar', '/hisobotlar'],
};

interface AuthState {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  loginError: string;

  fetchUsers: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  canAccess: (path: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: loadCurrentUser(),
  users: [],
  isAuthenticated: !!loadCurrentUser(),
  loginError: '',

  fetchUsers: async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (res.ok) {
        const users = await res.json();
        set({ users });
      }
    } catch (e) {
      console.error(e);
    }
  },

  login: async (username, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('erp_current_user', JSON.stringify(user));
        set({ currentUser: user, isAuthenticated: true, loginError: '' });
        return true;
      } else {
        const data = await res.json();
        set({ loginError: data.error || "Login yoki parol noto'g'ri" });
        return false;
      }
    } catch (e) {
      set({ loginError: "Server bilan ulanishda xatolik" });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('erp_current_user');
    set({ currentUser: null, isAuthenticated: false });
  },

  addUser: async (user) => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (res.ok) {
      const newUser = await res.json();
      set(s => ({ users: [...s.users, newUser] }));
    }
  },

  updateUser: async (id, updates) => {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const updatedUser = await res.json();
      set(s => {
        const users = s.users.map(u => u.id === id ? updatedUser : u);
        const currentUser = s.currentUser?.id === id ? updatedUser : s.currentUser;
        if (s.currentUser?.id === id) localStorage.setItem('erp_current_user', JSON.stringify(currentUser));
        return { users, currentUser };
      });
    }
  },

  deleteUser: async (id) => {
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
    set(s => ({ users: s.users.filter(u => u.id !== id) }));
  },

  canAccess: (path) => {
    const user = get().currentUser;
    if (!user) return false;
    const allowed = ROLE_NAV[user.role as UserRole];
    if (!allowed) return false;
    return allowed.some(p => path === '/' ? path === p : p.startsWith(path) || path.startsWith(p));
  },
}));
