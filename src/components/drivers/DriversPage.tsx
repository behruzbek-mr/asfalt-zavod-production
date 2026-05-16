import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Phone, Package, TrendingUp, BarChart3, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store';
import { Driver } from '../../types';
import { formatDate, formatCurrency, formatTons, generateId, getDateNDaysAgo, getTodayDate } from '../../utils';
import Modal from '../ui/Modal';

function DriverForm({ driver, onClose }: { driver?: Driver; onClose: () => void }) {
  const { addDriver, updateDriver } = useStore();
  const [name, setName] = useState(driver?.name || '');
  const [phone, setPhone] = useState(driver?.phone || '');
  const [carNumber, setCarNumber] = useState(driver?.carNumber || '');
  const [carModel, setCarModel] = useState(driver?.carModel || '');
  const [monthlySalary, setMonthlySalary] = useState((driver as any)?.monthlySalary?.toString() || '');
  const [isWorker, setIsWorker] = useState((driver as any)?.isWorker || false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Haydovchi ismi kiritilmagan'); return; }
    if (!carNumber.trim()) { setError('Avto raqam kiritilmagan'); return; }
    const extra = { isWorker, monthlySalary: isWorker && monthlySalary ? parseFloat(monthlySalary) : 0 };
    if (driver) {
      updateDriver(driver.id, { name: name.trim(), phone: phone.trim(), carNumber: carNumber.trim(), carModel: carModel.trim(), ...extra });
    } else {
      addDriver({ id: generateId(), name: name.trim(), phone: phone.trim(), carNumber: carNumber.trim(), carModel: carModel.trim() || undefined, createdAt: new Date().toISOString(), ...extra } as any);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">{error}</div>}
      <div><label className="label">To'liq ismi *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Familiya Ismi" autoFocus /></div>
      <div><label className="label">Telefon raqam</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+998 90 123 45 67" /></div>
      <div><label className="label">Avto raqam *</label><input type="text" value={carNumber} onChange={e => setCarNumber(e.target.value)} className="input" placeholder="40 A 1234 FA" /></div>
      <div><label className="label">Mashina modeli</label><input type="text" value={carModel} onChange={e => setCarModel(e.target.value)} className="input" placeholder="KAMAZ 55111, MAZ 6516..." /></div>
      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-dark-700/50 rounded-xl">
        <input type="checkbox" id="isWorker" checked={isWorker} onChange={e => setIsWorker(e.target.checked)} className="w-4 h-4" />
        <label htmlFor="isWorker" className="text-sm font-medium text-slate-700 dark:text-dark-200 cursor-pointer">Bu haydovchi bizning ishchi ham (oylik nazorat)</label>
      </div>
      {isWorker && (
        <div><label className="label">Oylik maosh (so'm)</label><input type="number" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} className="input" placeholder="0" /></div>
      )}
      <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button><button type="submit" className="btn-primary flex-1">{driver ? 'Saqlash' : "Qo'shish"}</button></div>
    </form>
  );
}

type PeriodFilter = 'all' | '7' | '30' | '90' | 'custom';

export default function DriversPage() {
  const { drivers, sales, rawTransactions, deleteDriver, expenses, addExpense, expenseCategories, addExpenseCategory } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sotuv' | 'xomashyo'>('sotuv');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('30');
  const [customFrom, setCustomFrom] = useState(getDateNDaysAgo(30));
  const [customTo, setCustomTo] = useState(getTodayDate());
  const [showSalaryModal, setShowSalaryModal] = useState<Driver | null>(null);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryDate, setSalaryDate] = useState(getTodayDate());
  const [salaryNote, setSalaryNote] = useState('');

  const cutoff = useMemo(() => {
    if (periodFilter === 'all') return '';
    if (periodFilter === 'custom') return customFrom;
    return getDateNDaysAgo(parseInt(periodFilter));
  }, [periodFilter, customFrom]);

  const endDate = periodFilter === 'custom' ? customTo : getTodayDate();

  const filtered = useMemo(() =>
    drivers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.carNumber.toLowerCase().includes(search.toLowerCase())),
    [drivers, search]
  );

  const salesStats = useMemo(() => {
    const map: Record<string, { trips: number; tons: number; revenue: number; lastDate: string }> = {};
    sales.filter(s => !cutoff || (s.date >= cutoff && s.date <= endDate)).forEach(s => {
      if (!map[s.driverId]) map[s.driverId] = { trips: 0, tons: 0, revenue: 0, lastDate: '' };
      map[s.driverId].trips++;
      map[s.driverId].tons += s.tons;
      map[s.driverId].revenue += s.totalAmount;
      if (s.date > map[s.driverId].lastDate) map[s.driverId].lastDate = s.date;
    });
    return map;
  }, [sales, cutoff, endDate]);

  const rawStats = useMemo(() => {
    const map: Record<string, { trips: number; totalQty: number; materials: Record<string, { name: string; qty: number }> }> = {};
    rawTransactions.filter(t => t.driverId && (!cutoff || (t.date >= cutoff && t.date <= endDate))).forEach(t => {
      const dId = t.driverId!;
      if (!map[dId]) map[dId] = { trips: 0, totalQty: 0, materials: {} };
      map[dId].trips++;
      map[dId].totalQty += t.quantity;
      if (!map[dId].materials[t.materialId]) map[dId].materials[t.materialId] = { name: t.materialName, qty: 0 };
      map[dId].materials[t.materialId].qty += t.quantity;
    });
    return map;
  }, [rawTransactions, cutoff, endDate]);

  const driverChartData = useMemo(() => {
    if (!selectedDriver) return [];
    return Array.from({ length: 14 }, (_, i) => {
      const date = getDateNDaysAgo(13 - i);
      const daySales = sales.filter(s => s.driverId === selectedDriver && s.date === date);
      const dayRaw = rawTransactions.filter(t => t.driverId === selectedDriver && t.date === date);
      return {
        date: date.slice(5),
        asfalt: daySales.reduce((s, x) => s + x.tons, 0),
        xomashyo: dayRaw.reduce((s, t) => s + t.quantity, 0),
      };
    });
  }, [selectedDriver, sales, rawTransactions]);

  const driver = selectedDriver ? drivers.find(d => d.id === selectedDriver) : null;

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSalaryModal || !salaryAmount) return;
    const d = showSalaryModal as any;
    let cat = expenseCategories.find(c => c.name.toLowerCase().includes('maosh') || c.name.toLowerCase().includes('haydovchi'));
    if (!cat) {
      const id = generateId();
      await addExpenseCategory({ id, name: 'Haydovchi maoshi', color: '#f59e0b', icon: 'Truck' });
      cat = { id, name: 'Haydovchi maoshi', color: '#f59e0b', icon: 'Truck' };
    }
    await addExpense({
      id: generateId(),
      categoryId: cat.id,
      categoryName: cat.name,
      amount: parseFloat(salaryAmount),
      description: `${showSalaryModal.name} — haydovchi maoshi${salaryNote ? ': ' + salaryNote : ''}`,
      recipient: showSalaryModal.name,
      createdAt: new Date().toISOString(),
      date: salaryDate,
    });
    setShowSalaryModal(null);
    setSalaryAmount('');
    setSalaryNote('');
    setSalaryDate(getTodayDate());
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-dark-900 dark:text-white">Haydovchilar</h1><p className="text-sm text-slate-500">{drivers.length} ta haydovchi</p></div>
        <button onClick={() => { setEditDriver(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Yangi haydovchi</button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center"><p className="text-xs text-slate-500">Jami haydovchilar</p><p className="text-2xl font-black text-dark-900 dark:text-white">{drivers.length}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-slate-500">Jami asfalt reyslar</p><p className="text-2xl font-black text-dark-900 dark:text-white">{Object.values(salesStats).reduce((s, v) => s + v.trips, 0)}</p></div>
        <div className="card p-4 text-center"><p className="text-xs text-slate-500">Xomashyo reyslar</p><p className="text-2xl font-black text-dark-900 dark:text-white">{Object.values(rawStats).reduce((s, v) => s + v.trips, 0)}</p></div>
      </div>

      {/* Date period filter */}
      <div className="card p-3 flex flex-wrap gap-2 items-center">
        <Calendar className="w-4 h-4 text-slate-400" />
        <div className="flex bg-slate-100 dark:bg-dark-700 rounded-xl p-1 gap-1">
          {([['7','Hafta'],['30','Oy'],['90','3 oy'],['all','Barchasi'],['custom','Tanlash']] as [PeriodFilter, string][]).map(([p, label]) => (
            <button key={p} onClick={() => setPeriodFilter(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${periodFilter === p ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500'}`}>{label}</button>
          ))}
        </div>
        {periodFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="input py-1.5 text-sm w-auto" />
            <span className="text-slate-400 text-xs">—</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="input py-1.5 text-sm w-auto" />
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism yoki avto raqam..." className="input pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(d => {
          const ss = salesStats[d.id] || { trips: 0, tons: 0, revenue: 0, lastDate: '' };
          const rs = rawStats[d.id] || { trips: 0, totalQty: 0, materials: {} };
          const isSelected = selectedDriver === d.id;
          const dAny = d as any;
          const paidSalary = expenses.filter(e => e.recipient === d.name).reduce((s, e) => s + e.amount, 0);

          return (
            <div key={d.id} className={`card-hover p-5 space-y-3 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary-500' : ''}`} onClick={() => setSelectedDriver(isSelected ? null : d.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/25">
                    {d.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-dark-900 dark:text-white">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.carNumber} {d.carModel ? `• ${d.carModel}` : ''}</p>
                    {dAny.isWorker && <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">Ishchi</span>}
                  </div>
                </div>
                {isSelected && <div className="w-2 h-2 bg-primary-500 rounded-full" />}
              </div>

              {d.phone && <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-300"><Phone className="w-3.5 h-3.5 text-slate-400" />{d.phone}</div>}

              {/* Asfalt sotuv */}
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /><p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Asfalt tashish</p></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center"><p className="text-xs text-slate-500">Reyslar</p><p className="font-bold text-dark-900 dark:text-white">{ss.trips}</p></div>
                  <div className="text-center"><p className="text-xs text-slate-500">Tonna</p><p className="font-bold text-dark-900 dark:text-white">{ss.tons.toFixed(1)}</p></div>
                  <div className="text-center"><p className="text-xs text-slate-500">Daromad</p><p className="font-bold text-dark-900 dark:text-white text-xs">{ss.revenue > 0 ? `${(ss.revenue/1_000_000).toFixed(1)}M` : '—'}</p></div>
                </div>
              </div>

              {/* Xomashyo tashish */}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2"><Package className="w-3.5 h-3.5 text-emerald-600" /><p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Xomashyo tashish</p></div>
                {rs.trips > 0 ? (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-500">{rs.trips} reys</span>
                      <span className="text-xs font-bold text-emerald-600">{rs.totalQty.toFixed(1)} (jami)</span>
                    </div>
                    <div className="space-y-1">
                      {Object.values(rs.materials).slice(0, 3).map((m: any, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-slate-500">{m.name}</span>
                          <span className="font-semibold text-dark-800 dark:text-dark-100">{m.qty.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <p className="text-xs text-slate-400">Hali xomashyo tashimagan</p>}
              </div>

              {/* Salary section for worker-drivers */}
              {dAny.isWorker && dAny.monthlySalary > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Oylik maosh</span>
                    <span className="text-xs font-bold text-indigo-600">{formatCurrency(dAny.monthlySalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500">Berilgan:</span>
                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(paidSalary)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {dAny.isWorker && (
                  <button onClick={e => { e.stopPropagation(); setShowSalaryModal(d); }} className="btn-success flex-1 justify-center py-1.5 text-xs">
                    <DollarSign className="w-3.5 h-3.5" /> Maosh
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); setEditDriver(d); setShowModal(true); }} className="btn-secondary flex-1 justify-center py-1.5 text-xs"><Pencil className="w-3.5 h-3.5" /> Tahrirlash</button>
                <button onClick={e => { e.stopPropagation(); deleteDriver(d.id); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected driver chart */}
      {driver && (
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            <h2 className="font-bold text-dark-900 dark:text-white">{driver.name} — 14 kunlik faollik</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveTab('sotuv')} className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'sotuv' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300'}`}>Asfalt (tonna)</button>
            <button onClick={() => setActiveTab('xomashyo')} className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'xomashyo' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300'}`}>Xomashyo</button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={driverChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey={activeTab === 'sotuv' ? 'asfalt' : 'xomashyo'} name={activeTab === 'sotuv' ? 'Asfalt (t)' : 'Xomashyo'} fill={activeTab === 'sotuv' ? '#2563eb' : '#10b981'} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editDriver ? 'Haydovchini tahrirlash' : "Yangi haydovchi qo'shish"}>
        <DriverForm driver={editDriver || undefined} onClose={() => setShowModal(false)} />
      </Modal>

      {showSalaryModal && (
        <Modal isOpen={true} onClose={() => setShowSalaryModal(null)} title={`${showSalaryModal.name} — maosh berish`}>
          <form onSubmit={handlePaySalary} className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-400">⚡ Maosh <strong>Xarajatlar</strong> bo'limiga avtomatik yoziladi</p>
            </div>
            <div><label className="label">Summa (so'm) *</label><input type="number" value={salaryAmount} onChange={e => setSalaryAmount(e.target.value)} className="input" placeholder="0" autoFocus /></div>
            <div><label className="label">Sana</label><input type="date" value={salaryDate} onChange={e => setSalaryDate(e.target.value)} className="input" /></div>
            <div><label className="label">Izoh</label><input type="text" value={salaryNote} onChange={e => setSalaryNote(e.target.value)} className="input" placeholder="Masalan: iyun oyi maoshi" /></div>
            <div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowSalaryModal(null)} className="btn-secondary flex-1">Bekor</button><button type="submit" className="btn-success flex-1">Berish</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
