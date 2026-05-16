import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Users, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuthStore, ROLE_LABELS } from '../../store/auth';
import { User, UserRole } from '../../types';
import { generateId } from '../../utils';
import Modal from '../ui/Modal';

const ROLE_OPTIONS: { value: UserRole; label: string; color: string }[] = [
  { value: 'admin', label: 'Administrator', color: 'text-amber-500' },
  { value: 'operator', label: 'Operator', color: 'text-blue-400' },
  { value: 'kassir', label: 'Kassir', color: 'text-emerald-400' },
  { value: 'omborchi', label: 'Omborchi', color: 'text-purple-400' },
];

function UserForm({ user, onClose }: { user?: User; onClose: () => void }) {
  const { addUser, updateUser, users } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user?.role || 'operator');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setError("To'liq ism kiritilmagan"); return; }
    if (!username.trim()) { setError('Login kiritilmagan'); return; }
    if (!user && !password.trim()) { setError('Parol kiritilmagan'); return; }
    if (users.find(u => u.username === username && u.id !== user?.id)) { setError('Bu login allaqachon mavjud'); return; }

    try {
      if (user) {
        await updateUser(user.id, { 
          fullName: fullName.trim(), 
          username: username.trim(), 
          role, 
          isActive, 
          ...(password ? { password } : {}) 
        });
      } else {
        await addUser({ 
          id: generateId(), 
          fullName: fullName.trim(), 
          username: username.trim(), 
          password, 
          role, 
          isActive, 
          createdAt: new Date().toISOString() 
        });
      }
      onClose();
    } catch (e) {
      setError("Saqlashda xatolik yuz berdi");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-900/20 border border-red-700/50 text-red-300 text-sm rounded-xl px-4 py-2.5">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">To'liq ismi *</label>
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Login *</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Parol {user ? '(o\'zgartirish)' : '*'}</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 pr-10 text-white focus:ring-2 focus:ring-primary-500 outline-none" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1.5">Rol *</label>
        <div className="grid grid-cols-2 gap-2">
          {ROLE_OPTIONS.map(r => (
            <button key={r.value} type="button" onClick={() => setRole(r.value)} className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${role === r.value ? 'border-primary-500 bg-primary-900/20' : 'border-dark-600 bg-dark-700/50'}`}>
              <span className={`text-sm font-bold ${role === r.value ? 'text-primary-400' : r.color}`}>{r.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-dark-600 text-primary-600" />
        <label htmlFor="isActive" className="text-sm font-medium text-dark-200">Faol (tizimga kirishi mumkin)</label>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white font-semibold py-2.5 rounded-xl transition-all">Bekor</button>
        <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl transition-all">{user ? 'Saqlash' : "Qo'shish"}</button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const { currentUser, users, fetchUsers, deleteUser } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const ROLE_BADGE_COLORS: Record<UserRole, string> = {
    admin: 'bg-amber-900/20 text-amber-400 border-amber-800/50',
    operator: 'bg-blue-900/20 text-blue-400 border-blue-800/50',
    kassir: 'bg-emerald-900/20 text-emerald-400 border-emerald-800/50',
    omborchi: 'bg-purple-900/20 text-purple-400 border-purple-800/50',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-500" />
            Foydalanuvchilar
          </h1>
          <p className="text-dark-400 mt-1">Tizim foydalanuvchilarini boshqarish va rollarni sozlash</p>
        </div>
        <button 
          onClick={() => { setEditUser(null); setShowModal(true); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Yangi foydalanuvchi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id} className={`bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-3xl p-5 hover:border-primary-500/30 transition-all group ${!user.isActive ? 'opacity-60 grayscale' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary-600/20">
                  {user.fullName[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white group-hover:text-primary-400 transition-colors">{user.fullName}</h3>
                  <p className="text-sm text-dark-400">@{user.username}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${ROLE_BADGE_COLORS[user.role as UserRole]}`}>
                {ROLE_LABELS[user.role as UserRole]}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-dark-700/50">
              <div className="flex items-center gap-2">
                {user.role === 'admin' && <Shield className="w-4 h-4 text-amber-500" title="Administrator" />}
                <span className="text-xs text-dark-400">
                  {user.isActive ? '🟢 Faol' : '🔴 Nofaol'}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setEditUser(user); setShowModal(true); }}
                  className="p-2.5 bg-dark-700 hover:bg-primary-600/20 text-dark-300 hover:text-primary-400 rounded-xl transition-all"
                  title="Tahrirlash"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {user.id !== currentUser?.id && (
                  <button 
                    onClick={() => { if(confirm('O\'chirishni tasdiqlaysizmi?')) deleteUser(user.id); }}
                    className="p-2.5 bg-dark-700 hover:bg-red-600/20 text-dark-300 hover:text-red-400 rounded-xl transition-all"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal isOpen={true} onClose={() => setShowModal(false)} title={editUser ? 'Foydalanuvchini tahrirlash' : "Yangi foydalanuvchi qo'shish"} size="md">
          <UserForm user={editUser || undefined} onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </div>
  );
}
