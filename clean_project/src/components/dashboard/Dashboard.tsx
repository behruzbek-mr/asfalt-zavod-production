import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Users, Package, Truck, ShoppingCart,
  AlertTriangle, Plus, Brain
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, ReferenceLine
} from 'recharts';
import { useStore } from '../../store';
import { formatCurrency, formatTons, getDateNDaysAgo, getTodayDate, generateId } from '../../utils';
import { useAuthStore } from '../../store/auth';

// === Linear Regression AI Forecast ===
function linearRegression(values: number[]) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  values.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) ** 2; });
  const slope = den !== 0 ? num / den : 0;
  return { slope, intercept: yMean - slope * xMean };
}

function predictNext(values: number[], days: number): number[] {
  const { slope, intercept } = linearRegression(values);
  const n = values.length;
  return Array.from({ length: days }, (_, i) => Math.max(0, Math.round(intercept + slope * (n + i))));
}

// Simple animated counter
function StatCard({ label, value, sub, color, icon: Icon, onClick }: {
  label: string; value: string; sub?: string; color: string;
  icon: React.ElementType; onClick?: () => void;
}) {
  return (
    <div className={`stat-card ${onClick ? 'cursor-pointer active:scale-95' : ''}`} onClick={onClick}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5.5 h-5.5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-dark-400">{label}</p>
        <p className="text-xl font-black text-dark-900 dark:text-white leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-dark-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { sales, expenses, clients, rawMaterials, drivers } = useStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  const today = getTodayDate();

  // Today stats
  const todaySales = useMemo(() => sales.filter(s => s.date === today), [sales, today]);
  const todayTotal = useMemo(() => todaySales.reduce((s, x) => s + x.totalAmount, 0), [todaySales]);
  const todayTons = useMemo(() => todaySales.reduce((s, x) => s + x.tons, 0), [todaySales]);
  const todayNaqd = useMemo(() => todaySales.filter(s => s.paymentType === 'naqd').reduce((s, x) => s + x.totalAmount, 0), [todaySales]);
  const todayNasiya = useMemo(() => todaySales.filter(s => s.paymentType === 'nasiya').reduce((s, x) => s + x.totalAmount, 0), [todaySales]);
  const todayKarta = useMemo(() => todaySales.filter(s => s.paymentType === 'karta').reduce((s, x) => s + x.totalAmount, 0), [todaySales]);

  const uniqueDriversToday = useMemo(() => new Set(todaySales.map(s => s.driverId)).size, [todaySales]);
  const totalDebt = useMemo(() => clients.reduce((s, c) => s + c.totalDebt, 0), [clients]);
  const lowStock = useMemo(() => rawMaterials.filter(m => m.quantity <= m.minQuantity), [rawMaterials]);

  // 30-day chart + AI forecast (next 7 days)
  const { chartData, forecastData } = useMemo(() => {
    const historical = Array.from({ length: 30 }, (_, i) => {
      const date = getDateNDaysAgo(29 - i);
      const daySales = sales.filter(s => s.date === date);
      const dayExp = expenses.filter(e => e.date === date);
      return {
        date: date.slice(5),
        sotuv: daySales.reduce((s, x) => s + x.totalAmount, 0),
        xarajat: dayExp.reduce((s, e) => s + e.amount, 0),
        tonna: daySales.reduce((s, x) => s + x.tons, 0),
        isHistory: true,
      };
    });

    const salesValues = historical.map(d => d.sotuv);
    const predictions = predictNext(salesValues, 7);

    const forecast = predictions.map((val, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return {
        date: `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        sotuv: undefined as number | undefined,
        prognoz: val,
        xarajat: 0,
        tonna: 0,
        isHistory: false,
      };
    });

    return { chartData: historical, forecastData: [...historical.slice(-5).map(d => ({ ...d, prognoz: undefined })), ...forecast] };
  }, [sales, expenses]);

  // AI insight
  const aiInsight = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const date = getDateNDaysAgo(6 - i);
      return sales.filter(s => s.date === date).reduce((s, x) => s + x.totalAmount, 0);
    });
    const prev7 = Array.from({ length: 7 }, (_, i) => {
      const date = getDateNDaysAgo(13 - i);
      return sales.filter(s => s.date === date).reduce((s, x) => s + x.totalAmount, 0);
    });
    const last7Total = last7.reduce((a, b) => a + b, 0);
    const prev7Total = prev7.reduce((a, b) => a + b, 0);
    const { slope } = linearRegression(last7);
    const trend = slope > 0 ? 'o\'sish' : 'pasayish';
    const nextWeekEst = predictNext(last7, 7).reduce((a, b) => a + b, 0);
    const change = prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total * 100) : 0;
    return { trend, nextWeekEst, change, last7Total };
  }, [sales]);

  // Top 5 clients (30 days)
  const topClients = useMemo(() => {
    const cutoff = getDateNDaysAgo(30);
    const map: Record<string, { name: string; total: number; count: number }> = {};
    sales.filter(s => s.date >= cutoff).forEach(s => {
      if (!map[s.clientId]) map[s.clientId] = { name: s.clientName, total: 0, count: 0 };
      map[s.clientId].total += s.totalAmount;
      map[s.clientId].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [sales]);

  // Today's trips
  const todayTrips = useMemo(() => {
    const driversMap: Record<string, { name: string; car: string; trips: number; tons: number }> = {};
    todaySales.forEach(s => {
      if (!driversMap[s.driverId]) driversMap[s.driverId] = { name: s.driverName, car: s.driverCarNumber, trips: 0, tons: 0 };
      driversMap[s.driverId].trips++;
      driversMap[s.driverId].tons += s.tons;
    });
    return Object.values(driversMap);
  }, [todaySales]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Boshqaruv paneli</h1>
          <p className="text-sm text-slate-500 dark:text-dark-400">
            {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/sotuv')} className="btn-primary py-2 text-sm">
            <Plus className="w-4 h-4" /> Yangi sotuv
          </button>
          <button onClick={() => navigate('/ombor')} className="btn-secondary py-2 text-sm">
            <Package className="w-4 h-4" /> Xomashyo
          </button>
          <button onClick={() => navigate('/xarajatlar')} className="btn-secondary py-2 text-sm">
            <TrendingDown className="w-4 h-4" /> Xarajat
          </button>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Xomashyo kam qoldi!</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">{lowStock.map(m => `${m.name}: ${m.quantity} ${m.unit}`).join(' • ')}</p>
          </div>
          <button onClick={() => navigate('/ombor')} className="ml-auto text-xs font-semibold text-amber-700 dark:text-amber-300 underline whitespace-nowrap">Ko'rish →</button>
        </div>
      )}

      {/* Today's main card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-dark-400">Bugungi sotuv</p>
            <p className="text-4xl font-black text-primary-600 dark:text-primary-400 mt-1">{formatCurrency(todayTotal)}</p>
            <p className="text-sm text-slate-500 mt-1">{formatTons(todayTons)} • {todaySales.length} ta sotuv</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-2">To'lov turlari</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm justify-end"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-slate-500">Naqd:</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(todayNaqd)}</span></div>
              <div className="flex items-center gap-2 text-sm justify-end"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-slate-500">Nasiya:</span><span className="font-bold text-red-500">{formatCurrency(todayNasiya)}</span></div>
              <div className="flex items-center gap-2 text-sm justify-end"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-slate-500">Karta:</span><span className="font-bold text-blue-500">{formatCurrency(todayKarta)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aktiv mijozlar" value={`${clients.length}`} sub="so'nggi 30 kun" color="bg-primary-100 dark:bg-primary-900/20 text-primary-600" icon={Users} onClick={() => navigate('/mijozlar')} />
        <StatCard label="Nasiya qarzi" value={formatCurrency(totalDebt)} sub={`${clients.filter(c => c.totalDebt > 0).length} ta mijoz`} color="bg-red-100 dark:bg-red-900/20 text-red-500" icon={TrendingDown} onClick={() => navigate('/mijozlar')} />
        <StatCard label="Bugungi haydovchilar" value={`${uniqueDriversToday}`} sub={`${todaySales.length} ta reys`} color="bg-orange-100 dark:bg-orange-900/20 text-orange-500" icon={Truck} onClick={() => navigate('/haydovchilar')} />
        <StatCard label="Jami haydovchilar" value={`${drivers.length}`} sub="ro'yxatda" color="bg-violet-100 dark:bg-violet-900/20 text-violet-600" icon={ShoppingCart} />
      </div>

      {/* Raw materials mini */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {rawMaterials.slice(0, 4).map(m => {
          const isLow = m.quantity <= m.minQuantity;
          const pct = Math.min((m.quantity / Math.max(m.minQuantity * 3, 1)) * 100, 100);
          return (
            <div key={m.id} className={`card p-4 cursor-pointer hover:shadow-md transition-all`} onClick={() => navigate('/ombor')}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-600 dark:text-dark-300">{m.name}</p>
                {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
              </div>
              <p className={`text-xl font-black ${isLow ? 'text-red-500' : 'text-dark-900 dark:text-white'}`}>{m.quantity} <span className="text-xs font-normal text-slate-400">{m.unit}</span></p>
              <div className="h-1.5 bg-slate-100 dark:bg-dark-700 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : pct > 60 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-4">Daromad / Xarajat (30 kun)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-dark-700" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="sotuv" name="Sotuv" fill="#2563eb" opacity={0.85} radius={[2,2,0,0]} />
              <Line type="monotone" dataKey="xarajat" name="Xarajat" stroke="#f87171" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Tons chart */}
        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-4">Tonna (7 kun)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} t`} />
              <Area type="monotone" dataKey="tonna" name="Tonna" stroke="#2563eb" fill="#2563eb20" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Prognosis */}
      <div className="card p-5 border-l-4 border-l-violet-500">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/20 rounded-xl flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="font-bold text-dark-900 dark:text-white">AI Prognoz — Keyingi 7 kun</h2>
            <p className="text-xs text-slate-500">Chiziqli regressiya asosida bashorat</p>
          </div>
          <div className={`ml-auto px-3 py-1.5 rounded-xl text-sm font-bold ${aiInsight.change >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
            {aiInsight.change >= 0 ? '📈' : '📉'} {aiInsight.change >= 0 ? '+' : ''}{aiInsight.change.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-violet-50 dark:bg-violet-900/10 rounded-xl p-3">
            <p className="text-xs text-slate-500">Keyingi hafta (prognoz)</p>
            <p className="font-bold text-violet-700 dark:text-violet-400 mt-1">{formatCurrency(aiInsight.nextWeekEst)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-dark-700/50 rounded-xl p-3">
            <p className="text-xs text-slate-500">O'tgan 7 kun</p>
            <p className="font-bold text-dark-900 dark:text-white mt-1">{formatCurrency(aiInsight.last7Total)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-dark-700/50 rounded-xl p-3">
            <p className="text-xs text-slate-500">Trend yo'nalishi</p>
            <p className={`font-bold mt-1 ${aiInsight.trend === "o'sish" ? 'text-emerald-600' : 'text-red-500'}`}>
              {aiInsight.trend === "o'sish" ? '↑ O\'sish' : '↓ Pasayish'}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <ComposedChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1_000_000).toFixed(0)}M`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="sotuv" name="Haqiqiy" fill="#2563eb" opacity={0.7} radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="prognoz" name="Prognoz" stroke="#8b5cf6" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 4, fill: '#8b5cf6' }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom: Top clients + Today's trips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 clients */}
        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-4">Top-5 mijoz (30 kun)</h2>
          <div className="space-y-3">
            {topClients.map((c, i) => {
              const pct = topClients[0]?.total ? (c.total / topClients[0].total) * 100 : 0;
              const colors = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400', 'bg-primary-400', 'bg-primary-300'];
              return (
                <div key={i} className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/mijozlar')}>
                  <div className={`w-6 h-6 rounded-full ${colors[i]} flex items-center justify-center text-white font-bold text-xs`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <p className="text-sm font-medium text-dark-800 dark:text-dark-100 truncate">{c.name}</p>
                      <p className="text-xs font-bold text-primary-600 dark:text-primary-400 ml-2 whitespace-nowrap">{formatCurrency(c.total)}</p>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's trips */}
        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-4">Bugungi haydovchilar ({todayTrips.length})</h2>
          {todayTrips.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
              <Truck className="w-10 h-10" />
              <p className="text-sm">Bugun hali reys yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTrips.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-dark-700/50 rounded-xl">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-600 font-bold text-sm">{d.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark-800 dark:text-dark-100 truncate">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.car}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-dark-900 dark:text-white">{d.trips} reys</p>
                    <p className="text-xs text-slate-400">{d.tons.toFixed(1)} t</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
