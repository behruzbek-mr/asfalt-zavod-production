import { useState, useMemo } from 'react';
import { Download, TrendingUp, TrendingDown, BarChart3, FileText, Calendar } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { useStore } from '../../store';
import { formatCurrency, formatTons, getDateNDaysAgo, exportToCSV, getTodayDate } from '../../utils';

type Period = '1' | '7' | '30' | '90' | '365' | 'custom';

export default function ReportsPage() {
  const { sales, expenses, clients, rawTransactions, rawMaterials, workers, settings } = useStore();
  const [period, setPeriod] = useState<Period>('30');
  const [customFrom, setCustomFrom] = useState(getDateNDaysAgo(30));
  const [customTo, setCustomTo] = useState(getTodayDate());

  const days = period === 'custom' ? 0 : parseInt(period);

  const cutoff = useMemo(() => {
    if (period === 'custom') return customFrom;
    return getDateNDaysAgo(days);
  }, [period, days, customFrom]);

  const endDate = period === 'custom' ? customTo : getTodayDate();

  const chartDays = period === 'custom'
    ? Math.min(90, Math.ceil((new Date(customTo).getTime() - new Date(customFrom).getTime()) / 86400000) + 1)
    : Math.min(days, 90);

  const chartData = useMemo(() => {
    return Array.from({ length: chartDays }, (_, i) => {
      const date = period === 'custom'
        ? new Date(new Date(customFrom).getTime() + i * 86400000).toISOString().split('T')[0]
        : getDateNDaysAgo(chartDays - 1 - i);
      const daySales = sales.filter(s => s.date === date);
      const dayExp = expenses.filter(e => e.date === date);
      const sotuv = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
      const xarajat = dayExp.reduce((sum, e) => sum + e.amount, 0);
      return {
        date: date.slice(5), sotuv, xarajat, foyda: sotuv - xarajat,
        tonna: daySales.reduce((sum, s) => sum + s.tons, 0),
        naqd: daySales.filter(s => s.paymentType === 'naqd').reduce((sum, s) => sum + s.totalAmount, 0),
        nasiya: daySales.filter(s => s.paymentType === 'nasiya').reduce((sum, s) => sum + s.totalAmount, 0),
        karta: daySales.filter(s => s.paymentType === 'karta').reduce((sum, s) => sum + s.totalAmount, 0),
      };
    });
  }, [sales, expenses, chartDays, period, customFrom]);

  const summary = useMemo(() => {
    const periodSales = sales.filter(s => s.date >= cutoff && s.date <= endDate);
    const periodExp = expenses.filter(e => e.date >= cutoff && e.date <= endDate);
    const totalSales = periodSales.reduce((s, x) => s + x.totalAmount, 0);
    const totalExp = periodExp.reduce((s, e) => s + e.amount, 0);
    const d = period === 'custom' ? chartDays : days;
    return {
      totalSales, totalExp, foyda: totalSales - totalExp,
      totalTons: periodSales.reduce((s, x) => s + x.tons, 0),
      salesCount: periodSales.length,
      avgPerDay: d > 0 ? totalSales / d : 0,
      marginPct: totalSales > 0 ? ((totalSales - totalExp) / totalSales * 100) : 0,
    };
  }, [sales, expenses, cutoff, endDate, days, period, chartDays]);

  const clientAnalysis = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    sales.filter(s => s.date >= cutoff && s.date <= endDate).forEach(s => {
      if (!map[s.clientId]) map[s.clientId] = { name: s.clientName, total: 0, count: 0 };
      map[s.clientId].total += s.totalAmount;
      map[s.clientId].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [sales, cutoff, endDate]);

  const materialConsumption = useMemo(() => {
    return rawMaterials.map(m => {
      const consumed = rawTransactions.filter(t => t.materialId === m.id && t.type === 'chiqim' && t.date >= cutoff && t.date <= endDate).reduce((s, t) => s + t.quantity, 0);
      const received = rawTransactions.filter(t => t.materialId === m.id && t.type === 'kirim' && t.date >= cutoff && t.date <= endDate).reduce((s, t) => s + t.quantity, 0);
      return { name: m.name, unit: m.unit, consumed, received, current: m.quantity };
    });
  }, [rawMaterials, rawTransactions, cutoff, endDate]);

  const debtClients = useMemo(() => clients.filter(c => c.totalDebt > 0).sort((a, b) => b.totalDebt - a.totalDebt), [clients]);
  const totalDebt = useMemo(() => debtClients.reduce((s, c) => s + c.totalDebt, 0), [debtClients]);

  const factoryName = settings?.factoryName || "Farg'ona Rustam Asfalt";

  const handleCSVExport = () => {
    const data = chartData.map(d => ({
      'Sana': d.date, 'Sotuv (so\'m)': d.sotuv, 'Xarajat (so\'m)': d.xarajat,
      'Foyda (so\'m)': d.foyda, 'Tonna': d.tonna, 'Naqd': d.naqd, 'Nasiya': d.nasiya, 'Karta': d.karta,
    }));
    exportToCSV(data as Record<string, unknown>[], `hisobot-${period}kun-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handlePDFExport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const periodSales = sales.filter(s => s.date >= cutoff && s.date <= endDate);
    printWindow.document.write(`<!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8"><title>Hisobot</title>
<style>body{font-family:Arial,sans-serif;padding:20px;color:#0f172a}h1{color:#1e3a8a;font-size:22px}h2{font-size:16px;color:#1e40af;margin-top:20px;border-bottom:2px solid #2563eb;padding-bottom:5px}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}th{background:#2563eb;color:white;padding:8px 12px;text-align:left}td{padding:7px 12px;border-bottom:1px solid #e2e8f0}tr:nth-child(even){background:#f8fafc}.stat{display:inline-block;min-width:180px;padding:10px 14px;margin:5px;background:#eff6ff;border-left:4px solid #2563eb;border-radius:4px}.stat-label{font-size:11px;color:#64748b}.stat-value{font-size:18px;font-weight:bold;color:#1e3a8a}@media print{@page{margin:20mm}}</style></head><body>
<h1>${factoryName}</h1><p style="color:#64748b">Davr: ${cutoff} — ${endDate} | Sana: ${new Date().toLocaleDateString('uz-UZ')}</p>
<div><div class="stat"><div class="stat-label">Jami daromad</div><div class="stat-value">${formatCurrency(summary.totalSales)}</div></div><div class="stat"><div class="stat-label">Jami xarajat</div><div class="stat-value" style="color:#dc2626">${formatCurrency(summary.totalExp)}</div></div><div class="stat"><div class="stat-label">Sof foyda</div><div class="stat-value" style="color:#059669">${formatCurrency(summary.foyda)}</div></div><div class="stat"><div class="stat-label">Sotilgan tonna</div><div class="stat-value">${formatTons(summary.totalTons)}</div></div></div>
<h2>Savdolar ro'yxati (${periodSales.length} ta)</h2><table><tr><th>#</th><th>Sana</th><th>Mijoz</th><th>Tonna</th><th>To'lov</th><th>Summa</th></tr>${periodSales.slice(0,50).map((s,i)=>`<tr><td>${i+1}</td><td>${s.date}</td><td>${s.clientName}</td><td>${s.tons.toFixed(1)} t</td><td>${s.paymentType}</td><td>${formatCurrency(s.totalAmount)}</td></tr>`).join('')}</table>
${debtClients.length>0?`<h2>Nasiya daftari</h2><table><tr><th>#</th><th>Mijoz</th><th>Telefon</th><th>Nasiya</th></tr>${debtClients.map((c,i)=>`<tr><td>${i+1}</td><td>${c.name}</td><td>${c.phone}</td><td style="color:#dc2626;font-weight:bold">${formatCurrency(c.totalDebt)}</td></tr>`).join('')}</table>`:''}
<p style="margin-top:30px;font-size:11px;color:#94a3b8">Hisobot ${factoryName} ERP tizimi orqali yaratildi</p></body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-dark-900 dark:text-white">Hisobotlar</h1><p className="text-sm text-slate-500">Moliyaviy tahlil</p></div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex bg-slate-100 dark:bg-dark-700 rounded-xl p-1 gap-1">
            {([['1','Bugun'],['7','Hafta'],['30','Oy'],['90','3 oy'],['365','1 yil'],['custom','Tanlash']] as [Period, string][]).map(([p, label]) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-white dark:bg-dark-600 text-dark-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
          <button onClick={handleCSVExport} className="btn-secondary"><Download className="w-4 h-4" /> CSV</button>
          <button onClick={handlePDFExport} className="btn-primary"><FileText className="w-4 h-4" /> PDF</button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">Dan:</span>
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="input py-1.5 text-sm w-auto" />
          <span className="text-slate-400">—</span>
          <span className="text-sm text-slate-500">Gacha:</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="input py-1.5 text-sm w-auto" />
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Jami daromad', value: formatCurrency(summary.totalSales), color: 'text-emerald-500', icon: TrendingUp, bg: 'bg-emerald-100 dark:bg-emerald-900/20', ic: 'text-emerald-500' },
          { label: 'Jami xarajat', value: formatCurrency(summary.totalExp), color: 'text-red-500', icon: TrendingDown, bg: 'bg-red-100 dark:bg-red-900/20', ic: 'text-red-500' },
          { label: 'Sof foyda', value: formatCurrency(summary.foyda), color: summary.foyda >= 0 ? 'text-primary-500' : 'text-red-500', icon: BarChart3, bg: 'bg-primary-100 dark:bg-primary-900/20', ic: 'text-primary-500' },
          { label: 'Sotilgan tonna', value: formatTons(summary.totalTons), color: 'text-blue-500', icon: BarChart3, bg: 'bg-blue-100 dark:bg-blue-900/20', ic: 'text-blue-500' },
        ].map((item, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center`}><item.icon className={`w-4 h-4 ${item.ic}`} /></div>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            {i === 0 && <p className="text-xs text-slate-400 mt-1">Kuniga: {formatCurrency(summary.avgPerDay)}</p>}
            {i === 2 && <p className="text-xs text-slate-400 mt-1">Marja: {summary.marginPct.toFixed(1)}%</p>}
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div className="card p-5">
        <h2 className="font-bold text-dark-900 dark:text-white mb-4">Daromad / Xarajat / Foyda</h2>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1_000_000).toFixed(0)}M`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="sotuv" name="Sotuv" fill="#2563eb" opacity={0.8} radius={[2,2,0,0]} />
            <Bar dataKey="xarajat" name="Xarajat" fill="#f87171" opacity={0.8} radius={[2,2,0,0]} />
            <Line type="monotone" dataKey="foyda" name="Foyda" stroke="#10b981" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Payment breakdown + Client analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-4">To'lov turlari</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.slice(-14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="naqd" name="Naqd" stackId="a" fill="#22c55e" />
              <Bar dataKey="nasiya" name="Nasiya" stackId="a" fill="#f87171" />
              <Bar dataKey="karta" name="Karta" stackId="a" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-4">Top mijozlar — kim qancha sotib olgan</h2>
          <div className="space-y-2.5">
            {clientAnalysis.slice(0, 7).map((c, i) => {
              const pct = clientAnalysis[0]?.total ? (c.total / clientAnalysis[0].total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-dark-800 dark:text-dark-100 truncate flex-1">{c.name}</span>
                    <div className="text-right ml-2">
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 block">{formatCurrency(c.total)}</span>
                      <span className="text-xs text-slate-400">{c.count} marta</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {clientAnalysis.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Ma'lumot yo'q</p>}
          </div>
        </div>
      </div>

      {/* Raw material consumption */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-dark-700"><h2 className="font-bold text-dark-900 dark:text-white">Xomashyo sarfi tahlili</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-dark-700/50">
              <tr>
                <th className="table-header">Material</th>
                <th className="table-header">Sarflangan</th>
                <th className="table-header">Olingan</th>
                <th className="table-header">Hozirgi qoldiq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
              {materialConsumption.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-dark-700/30">
                  <td className="table-cell font-medium">{m.name}</td>
                  <td className="table-cell text-red-500 font-semibold">{m.consumed.toFixed(2)} {m.unit}</td>
                  <td className="table-cell text-emerald-600 font-semibold">{m.received.toFixed(2)} {m.unit}</td>
                  <td className="table-cell font-bold">{m.current.toFixed(2)} {m.unit}</td>
                </tr>
              ))}
              {materialConsumption.length === 0 && <tr><td colSpan={4} className="table-cell text-center py-6 text-slate-400">Xomashyo yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debt ledger */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-dark-700 flex items-center justify-between">
          <div><h2 className="font-bold text-dark-900 dark:text-white">Nasiya daftari</h2><p className="text-xs text-slate-500 mt-0.5">Jami: {formatCurrency(totalDebt)}</p></div>
          <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold px-3 py-1.5 rounded-xl">{debtClients.length} ta</span>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-dark-700/50">
            <tr><th className="table-header">#</th><th className="table-header">Mijoz</th><th className="table-header">Telefon</th><th className="table-header">Nasiya</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
            {debtClients.map((c, i) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-dark-700/30">
                <td className="table-cell text-slate-400">{i + 1}</td>
                <td className="table-cell font-semibold">{c.name}</td>
                <td className="table-cell text-slate-500">{c.phone}</td>
                <td className="table-cell font-bold text-red-500">{formatCurrency(c.totalDebt)}</td>
              </tr>
            ))}
            {debtClients.length === 0 && <tr><td colSpan={4} className="table-cell text-center py-8 text-emerald-500">✓ Barcha mijozlar toza!</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
