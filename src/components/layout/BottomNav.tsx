import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Users, Truck,
  Package, TrendingDown, BarChart3, UserCog, Settings, Plus, Menu as MenuIcon, Building2
} from 'lucide-react';
import { useAuthStore, ROLE_NAV } from '../../store/auth';

const ALL_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Asosiy' },
  { to: '/sotuv', icon: ShoppingCart, label: 'Sotuv' },
  { to: '/mijozlar', icon: Users, label: 'Mijozlar' },
  { to: '/haydovchilar', icon: Truck, label: 'Haydovchilar' },
  { to: '/firmalar', icon: Building2, label: 'Firmalar' },
  { to: '/ombor', icon: Package, label: 'Ombor' },
  { to: '/xarajatlar', icon: TrendingDown, label: 'Xarajatlar' },
  { to: '/ishchilar', icon: UserCog, label: 'Ishchilar' },
  { to: '/foydalanuvchilar', icon: UserCog, label: 'Foydalanuvchilar' },
  { to: '/hisobotlar', icon: BarChart3, label: 'Hisobotlar' },
  { to: '/sozlamalar', icon: Settings, label: 'Sozlamalar' },
];

export default function BottomNav({ onOpenMenu, onOpenAddMenu }: { onOpenMenu: () => void, onOpenAddMenu: () => void }) {
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  const allowedPaths = ROLE_NAV[currentUser.role] || [];
  const navItems = ALL_NAV.filter(item => allowedPaths.includes(item.to));

  const navItemClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-1 transition-colors min-w-[72px] py-1 px-1 ${isActive ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400' : 'text-slate-400 dark:text-dark-400 border-b-2 border-transparent'}`;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-dark-800/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-dark-700/60 z-40 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)]">
      <div className="flex w-full" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        
        {/* Scrollable menu items */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-end justify-start px-2 pt-1 pb-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => navItemClass(isActive)}>
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Fixed FAB Button Container on the right */}
        <div className="flex items-end justify-center px-3 pt-1 pb-1 border-l border-slate-200 dark:border-dark-700 bg-white/50 dark:bg-dark-800/50">
          <button
            onClick={onOpenAddMenu}
            className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 transition-all active:scale-95"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

      </div>
    </div>
  );
}
