import { useState } from 'react';
import { Plus, Trash2, Pencil, Save, CheckCircle, Users, Lock, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../store';
import { useAuthStore, ROLE_LABELS, ROLE_NAV } from '../../store/auth';
import { useTheme } from '../../hooks/useLocalStorage';
import { User, UserRole } from '../../types';
import { generateId } from '../../utils';
import Modal from '../ui/Modal';

const ROLE_OPTIONS: { value: UserRole; label: string; color: string }[] = [
  { value: 'admin', label: 'Administrator', color: 'text-amber-500' },
  { value: 'operator', label: 'Operator', color: 'text-blue-400' },
  { value: 'kassir', label: 'Kassir', color: 'text-emerald-400' },
  { value: 'omborchi', label: 'Omborchi', color: 'text-purple-400' },
];

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['Barcha sahifalar', 'Foydalanuvchilar boshqaruvi', "Ma'lumotlarni tahrirlash"],
  operator: ['Dashboard', 'Sotuv', 'Mijozlar', 'Haydovchilar', 'Ombor', 'Xarajatlar', 'Hisobotlar'],
  kassir: ['Dashboard', 'Sotuv', 'Mijozlar', 'Hisobotlar'],
  omborchi: ['Dashboard', 'Xomashyo/Ombor', 'Haydovchilar', 'Hisobotlar'],
};

function UserForm({ user, onClose, currentUserId }: { user?: User; onClose: () => void; currentUserId: string }) {
  const { addUser, updateUser, users } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user?.role || 'operator');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError("To'liq ism kiritilmagan"); return; }
    if (!username.trim()) { setError('Login kiritilmagan'); return; }
    if (!user && !password.trim()) { setError('Parol kiritilmagan'); return; }
    if (users.find(u => u.username === username && u.id !== user?.id)) { setError('Bu login allaqachon mavjud'); return; }

    if (user) {
      updateUser(user.id, { fullName: fullName.trim(), username: username.trim(), role, isActive, ...(password ? { password } : {}) });
    } else {
      addUser({ id: generateId(), fullName: fullName.trim(), username: username.trim(), password, role, isActive, createdAt: new Date().toISOString() });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">{error}</div>}
      <div><label className="label">To'liq ismi *</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input" autoFocus /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Login *</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input" placeholder="username" /></div>
        <div>
          <label className="label">Parol {user ? '(o\'zgartirish)' : '*'}</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input pr-10" placeholder={user ? 'Yangi parol...' : 'Parol'} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
        </div>
      </div>
      <div>
        <label className="label">Rol *</label>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map(r => (
            <button key={r.value} type="button" onClick={() => setRole(r.value)} className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${role === r.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-dark-600'}`}>
              <span className={`text-sm font-bold ${role === r.value ? 'text-primary-700 dark:text-primary-300' : r.color}`}>{r.label}</span>
              <span className="text-xs text-slate-500 mt-0.5">{ROLE_PERMISSIONS[r.value].slice(0, 2).join(', ')}...</span>
            </button>
          ))}
        </div>
        <div className="mt-2 bg-slate-50 dark:bg-dark-700/50 rounded-xl p-3">
          <p className="text-xs text-slate-500 font-medium mb-1">Ko'rish huquqlari:</p>
          <div className="flex flex-wrap gap-1">
            {ROLE_PERMISSIONS[role].map((p, i) => <span key={i} className="text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-lg">{p}</span>)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary-600" />
        <label htmlFor="isActive" className="text-sm font-medium text-dark-700 dark:text-dark-200">Faol (tizimga kirishi mumkin)</label>
      </div>
      <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor</button><button type="submit" className="btn-primary flex-1">{user ? 'Saqlash' : "Qo'shish"}</button></div>
    </form>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings } = useStore();
  const { currentUser, users, deleteUser } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(settings.factoryName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [price, setPrice] = useState(settings.defaultPricePerTon.toString());
  const [saved, setSaved] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'factory' | 'users'>('factory');

  const isAdmin = currentUser?.role === 'admin';

  const handleSave = () => {
    updateSettings({ factoryName: name, address, phone, defaultPricePerTon: parseFloat(price) || 900000 });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };



  const ROLE_BADGE_COLORS: Record<UserRole, string> = {
    admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    operator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    kassir: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    omborchi: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div><h1 className="text-2xl font-bold text-dark-900 dark:text-white">Sozlamalar</h1><p className="text-sm text-slate-500">Tizim konfiguratsiyasi</p></div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-dark-700 rounded-xl p-1 gap-1">
        {([['factory', '🏭 Zavod'], ['users', '👥 Foydalanuvchilar']] as [typeof activeTab, string][]).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as typeof activeTab)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-white dark:bg-dark-600 text-dark-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>{label}</button>
        ))}
      </div>

      {/* Factory info */}
      {activeTab === 'factory' && (
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-dark-900 dark:text-white">Zavod ma'lumotlari</h2>
            <div><label className="label">Zavod nomi</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input" /></div>
            <div><label className="label">Manzil</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} className="input" /></div>
            <div><label className="label">Telefon</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="input" /></div>
            <div><label className="label">Standart asfalt narxi (1 t, so'm)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input" /></div>
            <button onClick={handleSave} className="btn-primary">{saved ? <><CheckCircle className="w-4 h-4" /> Saqlandi!</> : <><Save className="w-4 h-4" /> Saqlash</>}</button>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-dark-900 dark:text-white">Ko'rinish</h2>
            <div className="flex items-center justify-between">
              <div><p className="font-medium text-dark-800 dark:text-dark-100">Mavzu</p><p className="text-sm text-slate-500">{theme === 'dark' ? "Qorong'i rejim" : "Yorug' rejim"}</p></div>
              <button onClick={toggleTheme} className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${theme === 'dark' ? 'bg-primary-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${theme === 'dark' ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="card p-6 space-y-2">
            <h2 className="font-bold text-dark-900 dark:text-white">Tizim haqida</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-slate-500">Versiya:</span><span className="font-medium">v2.0.0</span>
              <span className="text-slate-500">Texnologiya:</span><span className="font-medium">React + TypeScript</span>
              <span className="text-slate-500">Ma'lumot:</span><span className="font-medium">LocalStorage</span>
              <span className="text-slate-500">Valyuta:</span><span className="font-medium">{settings.currency}</span>
            </div>
          </div>
        </div>
      )}

      {/* Users management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {!isAdmin && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-amber-700 dark:text-amber-300">Foydalanuvchilarni boshqarish faqat Admin uchun</p>
            </div>
          )}
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={() => { setEditUser(null); setShowUserModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Yangi foydalanuvchi</button>
            </div>
          )}
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className={`card p-4 flex items-center gap-4 ${!u.isActive ? 'opacity-60' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">{u.fullName[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-dark-900 dark:text-white">{u.fullName}</p>
                    {!u.isActive && <span className="text-xs bg-slate-200 dark:bg-dark-600 text-slate-500 px-2 py-0.5 rounded-full">Nofaol</span>}
                    {u.id === currentUser?.id && <span className="text-xs bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">Siz</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">@{u.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_BADGE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{ROLE_PERMISSIONS[u.role].slice(0, 3).join(' • ')}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => { setEditUser(u); setShowUserModal(true); }} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl"><Pencil className="w-4 h-4" /></button>
                    {u.id !== currentUser?.id && <button onClick={() => deleteUser(u.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}



      {showUserModal && (
        <Modal isOpen={true} onClose={() => setShowUserModal(false)} title={editUser ? 'Foydalanuvchini tahrirlash' : "Yangi foydalanuvchi qo'shish"} size="md">
          <UserForm user={editUser || undefined} onClose={() => setShowUserModal(false)} currentUserId={currentUser?.id || ''} />
        </Modal>
      )}
    </div>
  );
}
