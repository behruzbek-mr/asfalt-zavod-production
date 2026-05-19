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
  
  // Prioritize tabs to show on the bar:
  const priorityPaths = ['/', '/sotuv', '/mijozlar', '/ombor', '/firmalar', '/haydovchilar', '/xarajatlar'];
  const allowedPriority = ALL_NAV.filter(item => allowedPaths.includes(item.to) && priorityPaths.includes(item.to));

  // Determine left and right side items (we show 3 primary tabs + Menu button + Centered FAB)
  const leftItems = allowedPriority.slice(0, 2);
  const rightItems = allowedPriority.slice(2, 3);

  const navItemClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
      isActive 
        ? 'text-primary-600 dark:text-primary-400 scale-105' 
        : 'text-slate-400 dark:text-dark-400 hover:text-slate-600 dark:hover:text-dark-200'
    }`;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-dark-800/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-dark-700/50 z-40 shadow-[0_-8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.25)]">
      <div 
        className="flex items-center justify-between w-full relative px-2" 
        style={{ 
          height: '60px',
          paddingBottom: 'max(4px, env(safe-area-inset-bottom))' 
        }}
      >
        {/* Left Tabs */}
        <div className="flex flex-1 items-center justify-around h-full">
          {leftItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => navItemClass(isActive)}>
              <Icon className="w-5.5 h-5.5 mb-0.5" />
              <span className="text-[10px] font-bold">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Center Floating Plus Button */}
        <div className="flex-shrink-0 w-16 flex justify-center -mt-6 z-50">
          <button
            onClick={onOpenAddMenu}
            className="w-13 h-13 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_16px_rgba(59,130,246,0.4)] rounded-full flex items-center justify-center text-white border-4 border-slate-50 dark:border-dark-900"
            style={{ touchAction: 'manipulation' }}
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
        </div>

        {/* Right Tabs */}
        <div className="flex flex-1 items-center justify-around h-full">
          {rightItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => navItemClass(isActive)}>
              <Icon className="w-5.5 h-5.5 mb-0.5" />
              <span className="text-[10px] font-bold">{label}</span>
            </NavLink>
          ))}
          
          {/* Menu Drawer Button (always at the end on mobile) */}
          <button
            onClick={onOpenMenu}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 dark:text-dark-400 hover:text-slate-600 dark:hover:text-dark-200"
          >
            <MenuIcon className="w-5.5 h-5.5 mb-0.5" />
            <span className="text-[10px] font-bold">Menyu</span>
          </button>
        </div>

      </div>
    </div>
  );
}
