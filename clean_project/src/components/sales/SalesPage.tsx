import { useState, useMemo } from 'react';
import { Plus, Search, Filter, Trash2, Calendar } from 'lucide-react';
import { useStore } from '../../store';
import { PaymentType } from '../../types';
import {
  formatCurrency, formatDate, formatTons, getPaymentBadgeClass,
  getPaymentLabel, getTodayDate, getDateNDaysAgo
} from '../../utils';
import Modal from '../ui/Modal';
import { SaleForm } from './SaleForm';

type PeriodFilter = 'today' | 'week' | 'month' | 'all' | 'custom';

export default function SalesPage() {
  const { sales, deleteSale } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<PaymentType | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [customFrom, setCustomFrom] = useState(getDateNDaysAgo(30));
  const [customTo, setCustomTo] = useState(getTodayDate());
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const periodCutoff = useMemo(() => {
    if (periodFilter === 'today') return getTodayDate();
    if (periodFilter === 'week') return getDateNDaysAgo(7);
    if (periodFilter === 'month') return getDateNDaysAgo(30);
    return null;
  }, [periodFilter]);

  const filtered = useMemo(() => {
    return sales.filter(s => {
      const matchSearch = s.clientName.toLowerCase().includes(search.toLowerCase()) ||
        s.driverName.toLowerCase().includes(search.toLowerCase());
      const matchPayment = filterPayment === 'all' || s.paymentType === filterPayment;
      let matchPeriod = true;
      if (periodFilter === 'custom') {
        matchPeriod = s.date >= customFrom && s.date <= customTo;
      } else if (periodCutoff) {
        matchPeriod = s.date >= periodCutoff;
      }
      return matchSearch && matchPayment && matchPeriod;
    });
  }, [sales, search, filterPayment, periodFilter, periodCutoff, customFrom, customTo]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totals = useMemo(() => ({
    total: filtered.reduce((sum, s) => sum + s.totalAmount, 0),
    tons: filtered.reduce((sum, s) => sum + s.tons, 0),
    naqd: filtered.filter(s => s.paymentType === 'naqd').reduce((sum, s) => sum + s.totalAmount, 0),
    nasiya: filtered.filter(s => s.paymentType === 'nasiya').reduce((sum, s) => sum + s.totalAmount, 0),
    karta: filtered.filter(s => s.paymentType === 'karta').reduce((sum, s) => sum + s.totalAmount, 0),
  }), [filtered]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Sotuv</h1>
          <p className="text-sm text-slate-500 dark:text-dark-400">{filtered.length} ta yozuv</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Yangi sotuv
        </button>
      </div>

      {/* Period filter */}
      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <Calendar className="w-4 h-4 text-slate-400" />
        <div className="flex bg-slate-100 dark:bg-dark-700 rounded-xl p-1 gap-1">
          {([['today','Bugun'],['week','Hafta'],['month','Oy'],['all','Barchasi'],['custom','Tanlash']] as [PeriodFilter, string][]).map(([p, label]) => (
            <button key={p} onClick={() => { setPeriodFilter(p); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${periodFilter === p ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500'}`}>{label}</button>
          ))}
        </div>
        {periodFilter === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setPage(1); }} className="input py-1.5 text-sm w-auto" />
            <span className="text-slate-400 text-xs">—</span>
            <input type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setPage(1); }} className="input py-1.5 text-sm w-auto" />
          </div>
        )}
      </div>

      {/* Search + payment filter */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Mijoz yoki haydovchi qidirish..." className="input pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'naqd', 'nasiya', 'karta'] as const).map(type => (
            <button key={type} onClick={() => { setFilterPayment(type); setPage(1); }} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filterPayment === type ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300'}`}>
              {type === 'all' ? 'Barchasi' : getPaymentLabel(type)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center"><Filter className="w-5 h-5 text-primary-500" /></div>
          <div><p className="text-xs text-slate-500">Jami summa</p><p className="text-lg font-bold text-dark-900 dark:text-white">{formatCurrency(totals.total)}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center"><Filter className="w-5 h-5 text-blue-500" /></div>
          <div><p className="text-xs text-slate-500">Jami tonna</p><p className="text-lg font-bold text-dark-900 dark:text-white">{formatTons(totals.tons)}</p></div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Naqd</p><p className="text-base font-bold text-emerald-600">{formatCurrency(totals.naqd)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500">Nasiya</p><p className="text-base font-bold text-red-500">{formatCurrency(totals.nasiya)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-dark-700/50 border-b border-slate-200 dark:border-dark-700">
              <tr>
                <th className="table-header">Sana</th>
                <th className="table-header">Mijoz</th>
                <th className="table-header">Haydovchi</th>
                <th className="table-header">Tonna</th>
                <th className="table-header">Narx/t</th>
                <th className="table-header">Jami</th>
                <th className="table-header">To'lov</th>
                <th className="table-header">Izoh</th>
                <th className="table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
              {paginated.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="table-cell text-xs text-slate-500">{formatDate(sale.date)}</td>
                  <td className="table-cell font-medium">{sale.clientName}</td>
                  <td className="table-cell">
                    <div>
                      <p className="text-sm font-medium">{sale.driverName}</p>
                      <p className="text-xs text-slate-500">{sale.driverCarNumber}</p>
                    </div>
                  </td>
                  <td className="table-cell font-semibold">{formatTons(sale.tons)}</td>
                  <td className="table-cell text-xs">{formatCurrency(sale.pricePerTon)}</td>
                  <td className="table-cell font-bold text-primary-600 dark:text-primary-400">{formatCurrency(sale.totalAmount)}</td>
                  <td className="table-cell"><span className={getPaymentBadgeClass(sale.paymentType)}>{getPaymentLabel(sale.paymentType)}</span></td>
                  <td className="table-cell text-xs text-slate-500 max-w-32 truncate">{sale.note || '—'}</td>
                  <td className="table-cell">
                    <button onClick={() => deleteSale(sale.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={9} className="table-cell text-center py-12 text-slate-400">Hech qanday sotuv topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-dark-700">
            <p className="text-sm text-slate-500">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} / {filtered.length}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-1 px-2 disabled:opacity-40">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return <button key={p} onClick={() => setPage(p)} className={`py-1 px-3 rounded-lg text-sm transition-all ${page === p ? 'bg-primary-500 text-white' : 'btn-ghost'}`}>{p}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost py-1 px-2 disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Yangi sotuv qo'shish" size="lg">
        <SaleForm onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}
