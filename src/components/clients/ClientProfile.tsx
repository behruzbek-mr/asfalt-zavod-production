import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, MapPin, Building2, Calendar,
  ShoppingCart, TrendingUp, Wallet, Truck, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { useStore } from '../../store';
import { formatCurrency, formatDate, formatTons, getPaymentBadgeClass, getPaymentLabel } from '../../utils';

function PurchaseCalendar({ salesByDate }: { salesByDate: Array<{ date: string; tons: number; amount: number; count: number }> }) {
  const purchaseDates = useMemo(() => {
    const map = new Map<string, { tons: number; amount: number }>();
    salesByDate.forEach(d => {
      map.set(d.date, { tons: d.tons, amount: d.amount });
    });
    return map;
  }, [salesByDate]);

  const initialDate = useMemo(() => {
    if (salesByDate.length > 0) {
      return new Date(salesByDate[0].date);
    }
    return new Date();
  }, [salesByDate]);

  const [currentDate, setCurrentDate] = useState(initialDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let startDayOfWeek = new Date(year, month, 1).getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const weekDays = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];

  return (
    <div className="card p-4 w-full bg-white dark:bg-dark-800 border border-slate-100 dark:border-dark-700/50 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-dark-900 dark:text-white text-sm">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button type="button" onClick={prevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-lg text-slate-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={nextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-lg text-slate-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-dark-400 mb-1">
        {weekDays.map(wd => (
          <div key={wd} className="py-0.5">{wd}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const purchase = purchaseDates.get(dateStr);

          return (
            <div
              key={`day-${day}`}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all relative group cursor-pointer ${
                purchase
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm hover:scale-105'
                  : 'hover:bg-slate-100 dark:hover:bg-dark-700/50 text-slate-700 dark:text-dark-200'
              }`}
            >
              <span>{day}</span>
              {purchase && (
                <div className="absolute bottom-0.5 w-1 h-1 bg-white rounded-full" />
              )}
              
              {purchase && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 dark:bg-dark-950 text-white text-[10px] rounded-lg p-2 whitespace-nowrap z-50 shadow-xl border border-slate-800 pointer-events-none">
                  <p className="font-bold text-emerald-400">{formatDate(dateStr)}</p>
                  <p className="mt-0.5">Asfalt: {formatTons(purchase.tons)}</p>
                  <p>Summa: {formatCurrency(purchase.amount)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  const salesByDate = useMemo(() => {
    const map: Record<string, { date: string; tons: number; amount: number; count: number }> = {};
    clientSales.forEach(s => {
      const d = s.date;
      if (!map[d]) {
        map[d] = { date: d, tons: 0, amount: 0, count: 0 };
      }
      map[d].tons += s.tons;
      map[d].amount += s.totalAmount;
      map[d].count += 1;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [clientSales]);

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

      {/* Asfalt olingan kunlar section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="card p-5 h-full flex flex-col justify-between">
            <div>
              <h2 className="font-bold text-dark-900 dark:text-white flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Asfalt olingan kunlar
              </h2>
              <p className="text-xs text-slate-500 dark:text-dark-400">
                Mijoz jami <b>{salesByDate.length}</b> kun davomida asfalt sotib olgan. Kalendarda yashil rang bilan belgilangan kunlarda xarid amalga oshirilgan.
              </p>
            </div>
            
            <div className="mt-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                  {salesByDate.length}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Xarid kunlari</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Jami faol kunlar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1 flex justify-center">
          <PurchaseCalendar salesByDate={salesByDate} />
        </div>
        
        <div className="md:col-span-1">
          <div className="card p-5 h-full flex flex-col">
            <h3 className="font-bold text-dark-900 dark:text-white mb-3 text-sm">
              Xarid kunlari ro'yxati
            </h3>
            <div className="overflow-y-auto max-h-[220px] pr-1 space-y-2 custom-scrollbar">
              {salesByDate.map(day => (
                <div key={day.date} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-dark-700/30 hover:bg-slate-100 dark:hover:bg-dark-700/60 rounded-xl transition-colors border border-slate-100 dark:border-dark-700/50">
                  <div>
                    <p className="text-xs font-bold text-dark-800 dark:text-dark-200">{formatDate(day.date)}</p>
                    <p className="text-[10px] text-slate-400">{day.count} marta reys</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatTons(day.tons)}</p>
                    <p className="text-[10px] text-slate-500">{formatCurrency(day.amount)}</p>
                  </div>
                </div>
              ))}
              {salesByDate.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">Kunlar ro'yxati bo'sh</p>
              )}
            </div>
          </div>
        </div>
      </div>

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
