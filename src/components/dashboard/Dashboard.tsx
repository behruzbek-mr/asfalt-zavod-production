import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Users, Package, Truck, ShoppingCart,
  AlertTriangle, Plus, Brain
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, Bar, Line
} from 'recharts';
import { useStore } from '../../store';
import { formatCurrency, formatTons, getDateNDaysAgo, getTodayDate } from '../../utils';
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

// Compact and responsive StatCard
function StatCard({ label, value, sub, color, icon: Icon, onClick }: {
  label: string; value: string; sub?: string; color: string;
  icon: React.ElementType; onClick?: () => void;
}) {
  return (
    <div className={`stat-card ${onClick ? 'cursor-pointer active:scale-95' : ''}`} onClick={onClick}>
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-dark-400 font-semibold uppercase tracking-wider truncate">{label}</p>
          <p className="text-sm sm:text-xl font-black text-dark-900 dark:text-white leading-tight mt-0.5 truncate">{value}</p>
        </div>
      </div>
      {sub && (
        <div className="text-[10px] sm:text-xs text-slate-400 dark:text-dark-500 mt-1 border-t border-slate-100 dark:border-dark-700/50 pt-1 truncate">
          {sub}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { sales, expenses, clients, rawMaterials, drivers } = useStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white">Boshqaruv paneli</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-400">
            {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
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
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Xomashyo kam qoldi!</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 truncate">{lowStock.map(m => `${m.name}: ${m.quantity} ${m.unit}`).join(' • ')}</p>
          </div>
          <button onClick={() => navigate('/ombor')} className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline whitespace-nowrap">Ko'rish →</button>
        </div>
      )}

      {/* Today's Sales Card */}
      <div className="card p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/50 dark:from-dark-800 dark:to-dark-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-dark-400 uppercase tracking-wider">Bugungi jami sotuv</p>
            <p className="text-2xl sm:text-3.5xl font-black text-primary-600 dark:text-primary-400 mt-1">{formatCurrency(todayTotal)}</p>
            <p className="text-xs text-slate-500 mt-1">{formatTons(todayTons)} • {todaySales.length} ta sotuv</p>
          </div>
          
          <div className="border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-dark-700/60 pt-3.5 md:pt-0 md:pl-6">
            <p className="text-[10px] text-slate-400 dark:text-dark-500 font-bold uppercase tracking-wider mb-2">To'lov turlari bo'yicha</p>
            <div className="grid grid-cols-3 gap-2 md:flex md:flex-col md:gap-1.5">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 p-2 md:p-0 md:bg-transparent md:border-0 rounded-xl flex flex-col md:flex-row md:items-center md:gap-2 text-[11px] md:text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 hidden md:inline-block" />
                <span className="text-slate-500 dark:text-dark-400 font-semibold">Naqd:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 md:ml-auto">{formatCurrency(todayNaqd)}</span>
              </div>
              <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20 p-2 md:p-0 md:bg-transparent md:border-0 rounded-xl flex flex-col md:flex-row md:items-center md:gap-2 text-[11px] md:text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 hidden md:inline-block" />
                <span className="text-slate-500 dark:text-dark-400 font-semibold">Nasiya:</span>
                <span className="font-bold text-red-500 md:ml-auto">{formatCurrency(todayNasiya)}</span>
              </div>
              <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 p-2 md:p-0 md:bg-transparent md:border-0 rounded-xl flex flex-col md:flex-row md:items-center md:gap-2 text-[11px] md:text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 hidden md:inline-block" />
                <span className="text-slate-500 dark:text-dark-400 font-semibold">Karta:</span>
                <span className="font-bold text-blue-500 md:ml-auto">{formatCurrency(todayKarta)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Card Grid (Compact & Responsive) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Aktiv mijozlar" value={`${clients.length}`} sub="so'nggi 30 kun" color="bg-primary-50 dark:bg-primary-950/30 text-primary-600" icon={Users} onClick={() => navigate('/mijozlar')} />
        <StatCard label="Nasiya qarzi" value={formatCurrency(totalDebt)} sub={`${clients.filter(c => c.totalDebt > 0).length} ta mijoz`} color="bg-red-50 dark:bg-red-950/30 text-red-500" icon={TrendingDown} onClick={() => navigate('/mijozlar')} />
        <StatCard label="Bugungi haydovchilar" value={`${uniqueDriversToday}`} sub={`${todaySales.length} ta reys`} color="bg-orange-50 dark:bg-orange-950/30 text-orange-500" icon={Truck} onClick={() => navigate('/haydovchilar')} />
        <StatCard label="Jami haydovchilar" value={`${drivers.length}`} sub="ro'yxatda" color="bg-violet-50 dark:bg-violet-950/30 text-violet-600" icon={ShoppingCart} />
      </div>

      {/* Raw Materials Quick Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {rawMaterials.slice(0, 4).map(m => {
          const isLow = m.quantity <= m.minQuantity;
          const pct = Math.min((m.quantity / Math.max(m.minQuantity * 3, 1)) * 100, 100);
          return (
            <div key={m.id} className="card p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/ombor')}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-dark-300 truncate">{m.name}</p>
                {isLow && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
              </div>
              <p className={`text-base sm:text-lg font-black ${isLow ? 'text-red-500' : 'text-dark-900 dark:text-white'}`}>
                {m.quantity} <span className="text-[10px] font-normal text-slate-400">{m.unit}</span>
              </p>
              <div className="h-1 bg-slate-100 dark:bg-dark-700 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : pct > 60 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts (Daromad/Xarajat, Tonna) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Income/Expense Chart */}
        <div className="lg:col-span-2 card p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white mb-3">Daromad / Xarajat (30 kun)</h2>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-dark-700" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={isMobile ? 8 : 4} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="sotuv" name="Sotuv" fill="#2563eb" opacity={0.85} radius={[2,2,0,0]} />
              <Line type="monotone" dataKey="xarajat" name="Xarajat" stroke="#f87171" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Sales Volume (Tons) Chart */}
        <div className="card p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white mb-3">Tonna (7 kun)</h2>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 220}>
            <AreaChart data={chartData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} t`} />
              <Area type="monotone" dataKey="tonna" name="Tonna" stroke="#2563eb" fill="#2563eb20" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Prognosis */}
      <div className="card p-4 sm:p-5 border-l-4 border-l-violet-500">
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-violet-50 dark:bg-violet-950/30 rounded-xl flex items-center justify-center">
            <Brain className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white">AI Prognoz — Keyingi 7 kun</h2>
            <p className="text-[10px] sm:text-xs text-slate-500">Chiziqli regressiya asosida bashorat</p>
          </div>
          <div className={`ml-auto px-2.5 py-1 rounded-xl text-xs font-bold ${aiInsight.change >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'}`}>
            {aiInsight.change >= 0 ? '📈' : '📉'} {aiInsight.change >= 0 ? '+' : ''}{aiInsight.change.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4">
          <div className="bg-violet-50/50 dark:bg-violet-950/10 rounded-xl p-3 border border-violet-100/50 dark:border-violet-900/10">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Keyingi hafta (prognoz)</p>
            <p className="font-extrabold text-sm sm:text-base text-violet-700 dark:text-violet-400 mt-0.5">{formatCurrency(aiInsight.nextWeekEst)}</p>
          </div>
          <div className="bg-slate-50/50 dark:bg-dark-700/30 rounded-xl p-3 border border-slate-100 dark:border-dark-700/50">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">O'tgan 7 kun</p>
            <p className="font-extrabold text-sm sm:text-base text-dark-900 dark:text-white mt-0.5">{formatCurrency(aiInsight.last7Total)}</p>
          </div>
          <div className="bg-slate-50/50 dark:bg-dark-700/30 rounded-xl p-3 border border-slate-100 dark:border-dark-700/50">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Trend yo'nalishi</p>
            <p className={`font-extrabold text-sm sm:text-base mt-0.5 ${aiInsight.trend === "o'sish" ? 'text-emerald-600' : 'text-red-500'}`}>
              {aiInsight.trend === "o'sish" ? '↑ O\'sish' : '↓ Pasayish'}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={isMobile ? 120 : 160}>
          <ComposedChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={isMobile ? 6 : 4} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1_000_000).toFixed(0)}M`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="sotuv" name="Haqiqiy" fill="#2563eb" opacity={0.7} radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="prognoz" name="Prognoz" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: '#8b5cf6' }} connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Layout: Top 5 Clients & Today's Driver Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Clients list */}
        <div className="card p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white mb-3.5">Top-5 mijoz (30 kun)</h2>
          <div className="space-y-3.5">
            {topClients.map((c, i) => {
              const pct = topClients[0]?.total ? (c.total / topClients[0].total) * 100 : 0;
              const colors = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400', 'bg-primary-400', 'bg-primary-300'];
              return (
                <div key={i} className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/mijozlar')}>
                  <div className={`w-5.5 h-5.5 rounded-full ${colors[i]} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <p className="text-xs sm:text-sm font-medium text-dark-800 dark:text-dark-100 truncate">{c.name}</p>
                      <p className="text-xs font-bold text-primary-600 dark:text-primary-400 ml-2 whitespace-nowrap">{formatCurrency(c.total)}</p>
                    </div>
                    <div className="h-1 bg-slate-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Driver Trips log */}
        <div className="card p-4 sm:p-5">
          <h2 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white mb-3.5">Bugungi haydovchilar ({todayTrips.length})</h2>
          {todayTrips.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-slate-400 gap-2">
              <Truck className="w-8 h-8" />
              <p className="text-xs">Bugun hali reys yo'q</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {todayTrips.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-dark-700/40 rounded-xl">
                  <div className="w-8 h-8 bg-orange-50 dark:bg-orange-950/20 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">{d.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-dark-800 dark:text-dark-100 truncate">{d.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{d.car}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-bold text-dark-900 dark:text-white">{d.trips} reys</p>
                    <p className="text-[10px] text-slate-400">{d.tons.toFixed(1)} t</p>
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
