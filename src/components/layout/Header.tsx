import { Sun, Moon, Bell, Search, ChevronDown, Menu } from 'lucide-react';
import { useTheme } from '../../hooks/useLocalStorage';
import { useAuthStore, ROLE_LABELS } from '../../store/auth';
import { useStore } from '../../store';

const ROLE_COLORS: Record<string, string> = {
  admin: 'text-amber-500', operator: 'text-blue-400', kassir: 'text-emerald-400', omborchi: 'text-purple-400'
};

export default function Header({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuthStore();
  const { settings } = useStore();

  const now = new Date();
  const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('uz-UZ', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="h-14 bg-white dark:bg-dark-800 border-b border-slate-200 dark:border-dark-700 flex items-center px-3 md:px-5 gap-3 md:gap-4 flex-shrink-0">
      <button onClick={onOpenMenu} className="p-2 rounded-xl text-slate-600 dark:text-dark-300 hover:bg-slate-50 dark:hover:bg-dark-700/50 md:hidden flex flex-shrink-0">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Qidirish..." className="w-full bg-slate-50 dark:bg-dark-700 border border-slate-200 dark:border-dark-600 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
        </div>
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex flex-col items-end">
        <span className="text-xs font-bold text-dark-900 dark:text-white">{timeStr}</span>
        <span className="text-xs text-slate-400 capitalize">{dateStr}</span>
      </div>

      <button className="relative btn-ghost p-2">
        <Bell className="w-4.5 h-4.5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-dark-800" />
      </button>

      <button onClick={toggleTheme} className="btn-ghost p-2">
        {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
      </button>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-primary-600/30">
          {currentUser?.fullName?.[0]?.toUpperCase() || 'A'}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-bold text-dark-900 dark:text-white leading-none">{currentUser?.fullName || 'Admin'}</p>
          <p className={`text-xs font-medium ${ROLE_COLORS[currentUser?.role || 'admin']}`}>{ROLE_LABELS[currentUser?.role || 'admin']}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
      </div>
    </header>
  );
}
