import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, MapPin, Building2, Calendar,
  ShoppingCart, TrendingUp, Wallet, Truck
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useStore } from '../../store';
import { formatCurrency, formatDate, formatTons, getPaymentBadgeClass, getPaymentLabel } from '../../utils';

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, sales } = useStore();

  const client = clients.find(c => c.id === id);
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-dark-500">Mijoz topilmadi</p>
        <button onClick={() => navigate('/mijozlar')} className="btn-primary">Orqaga</button>
      </div>
    );
  }

  const clientSales = useMemo(() => sales.filter(s => s.clientId === id).sort((a, b) => b.date.localeCompare(a.date)), [sales, id]);

  const stats = useMemo(() => ({
    totalAmount: clientSales.reduce((s, x) => s + x.totalAmount, 0),
    totalTons: clientSales.reduce((s, x) => s + x.tons, 0),
    count: clientSales.length,
    naqd: clientSales.filter(s => s.paymentType === 'naqd').reduce((s, x) => s + x.totalAmount, 0),
    nasiya: clientSales.filter(s => s.paymentType === 'nasiya').reduce((s, x) => s + x.totalAmount, 0),
    karta: clientSales.filter(s => s.paymentType === 'karta').reduce((s, x) => s + x.totalAmount, 0),
  }), [clientSales]);

  // Monthly chart
  const monthlyData = useMemo(() => {
    const map: Record<string, { sotuv: number; tonna: number }> = {};
    clientSales.forEach(s => {
      const m = s.date.slice(0, 7);
      if (!map[m]) map[m] = { sotuv: 0, tonna: 0 };
      map[m].sotuv += s.totalAmount;
      map[m].tonna += s.tons;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, d]) => ({ month: month.slice(5), ...d }));
  }, [clientSales]);

  // Drivers worked with this client
  const driversUsed = useMemo(() => {
    const map: Record<string, { name: string; car: string; trips: number; tons: number }> = {};
    clientSales.forEach(s => {
      if (!map[s.driverId]) map[s.driverId] = { name: s.driverName, car: s.driverCarNumber, trips: 0, tons: 0 };
      map[s.driverId].trips += 1;
      map[s.driverId].tons += s.tons;
    });
    return Object.values(map).sort((a, b) => b.trips - a.trips).slice(0, 5);
  }, [clientSales]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/mijozlar')} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary-600/25">
            {client.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">{client.name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-3">
              {client.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.phone}</span>}
              {client.company && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{client.company}</span>}
            </p>
          </div>
        </div>
        {client.totalDebt > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-2xl px-4 py-2 text-right">
            <p className="text-xs text-red-500">Nasiya qarzi</p>
            <p className="text-xl font-black text-red-500">{formatCurrency(client.totalDebt)}</p>
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        {client.address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div><p className="text-xs text-slate-400">Manzil</p><p className="text-sm font-medium text-dark-800 dark:text-dark-100">{client.address}</p></div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div><p className="text-xs text-slate-400">Ro'yxatga olingan</p><p className="text-sm font-medium text-dark-800 dark:text-dark-100">{formatDate(client.createdAt)}</p></div>
        </div>
        <div className="flex items-start gap-2">
          <ShoppingCart className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div><p className="text-xs text-slate-400">Jami xaridlar</p><p className="text-sm font-bold text-dark-900 dark:text-white">{stats.count} ta</p></div>
        </div>
        <div className="flex items-start gap-2">
          <TrendingUp className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div><p className="text-xs text-slate-400">Jami tonna</p><p className="text-sm font-bold text-dark-900 dark:text-white">{formatTons(stats.totalTons)}</p></div>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-primary-600" /></div>
          <div><p className="text-xs text-slate-500">Jami summa</p><p className="text-lg font-bold text-dark-900 dark:text-white">{formatCurrency(stats.totalAmount)}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center"><Wallet className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-xs text-slate-500">Naqd to'lagan</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.naqd)}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center"><Wallet className="w-5 h-5 text-red-500" /></div>
          <div><p className="text-xs text-slate-500">Nasiya</p><p className="text-lg font-bold text-red-500">{formatCurrency(stats.nasiya)}</p></div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center"><Wallet className="w-5 h-5 text-blue-500" /></div>
          <div><p className="text-xs text-slate-500">Karta</p><p className="text-lg font-bold text-blue-500">{formatCurrency(stats.karta)}</p></div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-4">Oylik xarid dinamikasi</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="sotuv" name="Sotuv" fill="#2563eb" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-4">Tonna dinamikasi</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} t`} />
              <Line type="monotone" dataKey="tonna" name="Tonna" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drivers */}
      {driversUsed.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-orange-500" /> Reyslar (haydovchilar bo'yicha)</h2>
          <div className="space-y-2">
            {driversUsed.map((d, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-dark-700/50 rounded-xl">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center text-orange-600 font-bold text-sm">{i + 1}</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-dark-800 dark:text-dark-100">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.car}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{d.trips} reys</p>
                  <p className="text-xs text-slate-500">{formatTons(d.tons)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase history */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-dark-700">
          <h2 className="font-bold text-dark-900 dark:text-white">Xaridlar tarixi ({clientSales.length} ta)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-dark-700/50">
              <tr>
                <th className="table-header">Sana</th>
                <th className="table-header">Tonna</th>
                <th className="table-header">Narx/t</th>
                <th className="table-header">Jami</th>
                <th className="table-header">To'lov</th>
                <th className="table-header">Haydovchi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
              {clientSales.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-dark-700/30">
                  <td className="table-cell text-xs text-slate-500">{formatDate(s.date)}</td>
                  <td className="table-cell font-semibold">{formatTons(s.tons)}</td>
                  <td className="table-cell text-xs">{formatCurrency(s.pricePerTon)}</td>
                  <td className="table-cell font-bold text-primary-600 dark:text-primary-400">{formatCurrency(s.totalAmount)}</td>
                  <td className="table-cell"><span className={getPaymentBadgeClass(s.paymentType)}>{getPaymentLabel(s.paymentType)}</span></td>
                  <td className="table-cell"><p className="text-sm">{s.driverName}</p><p className="text-xs text-slate-400">{s.driverCarNumber}</p></td>
                </tr>
              ))}
              {clientSales.length === 0 && (
                <tr><td colSpan={6} className="table-cell text-center py-8 text-slate-400">Hali xarid yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
