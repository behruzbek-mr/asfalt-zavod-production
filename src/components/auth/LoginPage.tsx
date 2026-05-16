import { useState } from 'react';
import { LogIn, Factory, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

export default function LoginPage() {
  const { login, loginError, users } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  const quickLogin = (username: string, password: string) => {
    setUsername(username);
    setPassword(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-2xl shadow-primary-600/40 mb-4">
            <Factory className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Farg'ona Rustam Asfalt</h1>
          <p className="text-dark-400 text-sm mt-1">ERP Boshqaruv Tizimi</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800/80 backdrop-blur-xl border border-dark-700/50 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-6">Tizimga kirish</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Login</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="admin"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Parol</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 pr-12 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-xl px-4 py-2.5">
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30 active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-5 h-5" /> Kirish</>
              )}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
