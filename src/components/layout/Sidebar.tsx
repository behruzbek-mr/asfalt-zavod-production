import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Users, Truck,
  Package, TrendingDown, BarChart3, Factory,
  ChevronLeft, ChevronRight, UserCog, Settings, LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore, ROLE_NAV, ROLE_LABELS } from '../../store/auth';
import { useStore } from '../../store';

const ALL_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
  { to: '/sotuv', icon: ShoppingCart, label: 'Sotuv' },
  { to: '/mijozlar', icon: Users, label: 'Mijozlar' },
  { to: '/haydovchilar', icon: Truck, label: 'Haydovchilar' },
  { to: '/ombor', icon: Package, label: 'Xomashyo / Ombor' },
  { to: '/xarajatlar', icon: TrendingDown, label: 'Xarajatlar' },
  { to: '/ishchilar', icon: UserCog, label: 'Ishchilar' },
  { to: '/foydalanuvchilar', icon: UserCog, label: 'Foydalanuvchilar' },
  { to: '/hisobotlar', icon: BarChart3, label: 'Hisobotlar' },
  { to: '/sozlamalar', icon: Settings, label: 'Sozlamalar' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { settings } = useStore();
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const allowedPaths = currentUser ? ROLE_NAV[currentUser.role] : [];
  const navItems = ALL_NAV.filter(item => allowedPaths.includes(item.to));

  const ROLE_COLORS: Record<string, string> = {
    admin: 'text-amber-400', operator: 'text-blue-400', kassir: 'text-green-400', omborchi: 'text-purple-400'
  };

  return (
    <aside className={`relative flex-col h-screen bg-white dark:bg-dark-800 border-r border-slate-200 dark:border-dark-700 transition-all duration-300 ease-in-out flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'} hidden md:flex`}>
      {/* Logo */}
      <div
        className={`flex items-center gap-3 p-4 border-b border-slate-200 dark:border-dark-700 cursor-pointer ${collapsed ? 'justify-center' : ''}`}
        onClick={() => navigate('/')}
      >
        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-600/30">
          <Factory className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-dark-900 dark:text-white leading-tight truncate">{settings?.factoryName}</p>
            <p className="text-xs text-primary-500 font-medium">ERP Tizimi</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isActive
                ? `sidebar-link-active ${collapsed ? 'justify-center px-2' : ''}`
                : `sidebar-link ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      {currentUser && !collapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {currentUser.fullName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-dark-900 dark:text-white truncate">{currentUser.fullName}</p>
              <p className={`text-xs font-medium ${ROLE_COLORS[currentUser.role] || 'text-primary-400'}`}>
                {ROLE_LABELS[currentUser.role]}
              </p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost w-full justify-center text-xs text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-1.5">
            <LogOut className="w-3.5 h-3.5" /> Chiqish
          </button>
        </div>
      )}

      {/* Collapse */}
      <div className={`p-2.5 ${currentUser && !collapsed ? '' : 'border-t border-slate-200 dark:border-dark-700'}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`btn-ghost w-full ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          {!collapsed && <span className="text-xs">Yig'ish</span>}
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {collapsed && currentUser && (
          <button onClick={() => { logout(); navigate('/'); }} className="mt-1 btn-ghost w-full justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2" title="Chiqish">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
