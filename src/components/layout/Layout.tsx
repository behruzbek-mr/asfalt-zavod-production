import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import GlobalAddModal from './GlobalAddModal';
import { useAuthStore } from '../../store/auth';
import { useStore } from '../../store';
import LoginPage from '../auth/LoginPage';
import { Factory, Menu, X, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useLocalStorage';

const ALL_NAV = [
  { to: '/', label: 'Boshqaruv paneli' },
  { to: '/sotuv', label: 'Sotuv' },
  { to: '/mijozlar', label: 'Mijozlar' },
  { to: '/haydovchilar', label: 'Haydovchilar' },
  { to: '/firmalar', label: 'Firmalar' },
  { to: '/ombor', label: 'Xomashyo / Ombor' },
  { to: '/xarajatlar', label: 'Xarajatlar' },
  { to: '/ishchilar', label: 'Ishchilar' },
  { to: '/foydalanuvchilar', label: 'Foydalanuvchilar' },
  { to: '/hisobotlar', label: 'Hisobotlar' },
  { to: '/sozlamalar', label: 'Sozlamalar' },
];

export default function Layout() {
  const { isAuthenticated, fetchUsers, currentUser, logout } = useAuthStore();
  const { fetchInitialData, isLoaded, settings } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchInitialData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-dark-900 text-white">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
          <Factory className="w-8 h-8 text-white" />
        </div>
        <p className="text-dark-300 animate-pulse">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-900 relative">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-dark-800 z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-dark-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-dark-900 dark:text-white">{settings?.factoryName}</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-700">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {ALL_NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400' 
                    : 'text-slate-600 dark:text-dark-300 hover:bg-slate-50 dark:hover:bg-dark-700/50'
                }`
              }
            >
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        {currentUser && (
          <div className="p-4 border-t border-slate-200 dark:border-dark-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
                {currentUser.fullName[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-dark-900 dark:text-white truncate">{currentUser.fullName}</p>
                <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
              </div>
            </div>
            <button onClick={() => { logout(); navigate('/'); }} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onOpenMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      <BottomNav 
        onOpenMenu={() => setMobileMenuOpen(true)} 
        onOpenAddMenu={() => setAddMenuOpen(true)} 
      />
      <GlobalAddModal 
        isOpen={addMenuOpen} 
        onClose={() => setAddMenuOpen(false)} 
      />
    </div>
  );
}
