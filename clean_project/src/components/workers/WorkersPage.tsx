import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Phone, Calendar, DollarSign, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../store';
import { Worker, WorkerPayment } from '../../types';
import { formatCurrency, formatDate, generateId, getTodayDate } from '../../utils';
import Modal from '../ui/Modal';

function WorkerForm({ worker, onClose }: { worker?: Worker; onClose: () => void }) {
  const { addWorker, updateWorker, addDriver } = useStore();
  const [name, setName] = useState(worker?.name || '');
  const [position, setPosition] = useState(worker?.position || '');
  const [phone, setPhone] = useState(worker?.phone || '');
  const [startDate, setStartDate] = useState(worker?.startDate || '');
  const [salary, setSalary] = useState(worker?.monthlySalary?.toString() || '');
  const [isOurDriver, setIsOurDriver] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Ism kiritilmagan'); return; }
    if (!salary || parseFloat(salary) <= 0) { setError('Oylik maosh kiritilmagan'); return; }
    if (worker) {
      updateWorker(worker.id, { name: name.trim(), position: position.trim(), phone: phone.trim(), startDate, monthlySalary: parseFloat(salary) });
    } else {
      addWorker({ id: generateId(), name: name.trim(), position: position.trim(), phone: phone.trim(), startDate, monthlySalary: parseFloat(salary), createdAt: new Date().toISOString() });
      if (isOurDriver) {
        addDriver({
          id: generateId(),
          name: name.trim(),
          phone: phone.trim(),
          carModel: 'O\'zimizning yuk mashina',
          carNumber: 'Bizniki',
          createdAt: new Date().toISOString(),
        });
      }
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">To'liq ismi *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input" autoFocus /></div>
        <div><label className="label">Lavozim</label><input type="text" value={position} onChange={e => setPosition(e.target.value)} className="input" placeholder="Masalan: Haydovchi, Operator..." /></div>
        <div><label className="label">Telefon</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+998 90..." /></div>
        <div><label className="label">Ish boshlagan sana</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" /></div>
        <div className="col-span-2"><label className="label">Oylik maosh (so'm) *</label><input type="number" value={salary} onChange={e => setSalary(e.target.value)} className="input" placeholder="0" /></div>
        {!worker && (
          <div className="col-span-2 flex items-center gap-2 p-1">
            <input type="checkbox" id="isOurDriver" checked={isOurDriver} onChange={e => setIsOurDriver(e.target.checked)} className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded" />
            <label htmlFor="isOurDriver" className="text-sm font-medium text-slate-700 dark:text-dark-200 cursor-pointer">Bizning haydovchilar safiga ham qo'shish</label>
          </div>
        )}
      </div>
      <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor</button><button type="submit" className="btn-primary flex-1">{worker ? 'Saqlash' : 'Qo\'shish'}</button></div>
    </form>
  );
}

function PaymentForm({ worker, onClose }: { worker: Worker; onClose: () => void }) {
  const { addWorkerPayment, addExpense, expenseCategories, addExpenseCategory } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [daysWorked, setDaysWorked] = useState('26');
  const [advance, setAdvance] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDate());

  const totalEarned = useMemo(() => {
    const perDay = worker.monthlySalary / 26;
    return Math.round(perDay * (parseFloat(daysWorked) || 0));
  }, [daysWorked, worker.monthlySalary]);

  const totalPaid = parseFloat(advance) || 0;
  const remaining = totalEarned - totalPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1) Create worker payment record
    await addWorkerPayment({
      id: generateId(), workerId: worker.id, workerName: worker.name, month,
      daysWorked: parseFloat(daysWorked) || 0,
      advance: totalPaid, totalEarned, totalPaid, remaining,
      note: note.trim() || undefined, createdAt: new Date().toISOString(),
    });

    // 2) Auto-create expense entry for salary paid
    if (totalEarned > 0) {
      // Find or use "Ishchi maoshi" category
      let salaryCat = expenseCategories.find(c => c.name.toLowerCase().includes('maosh') || c.name.toLowerCase().includes('ish'));
      if (!salaryCat) {
        const newCatId = generateId();
        const newCat = { id: newCatId, name: 'Ishchi maoshi', color: '#6366f1', icon: 'Users' };
        await addExpenseCategory(newCat);
        salaryCat = newCat;
      }
      await addExpense({
        id: generateId(),
        categoryId: salaryCat.id,
        categoryName: salaryCat.name,
        amount: totalEarned,
        description: `${worker.name} — ${month} oylik maoshi (${daysWorked} kun)`,
        recipient: worker.name,
        createdAt: new Date().toISOString(),
        date,
      });
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3">
        <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{worker.name}</p>
        <p className="text-xs text-slate-500">Oylik: {formatCurrency(worker.monthlySalary)}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Oy</label><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input" /></div>
        <div><label className="label">Ishlagan kunlar</label><input type="number" value={daysWorked} onChange={e => setDaysWorked(e.target.value)} className="input" min="0" max="31" /></div>
        <div><label className="label">Hisoblangan maosh</label><div className="input bg-slate-100 dark:bg-dark-600 font-bold text-primary-600 dark:text-primary-400">{formatCurrency(totalEarned)}</div></div>
        <div><label className="label">To'langan (avans)</label><input type="number" value={advance} onChange={e => setAdvance(e.target.value)} className="input" placeholder="0" /></div>
        <div><label className="label">Qolgan to'lov</label><div className={`input font-bold ${remaining > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>{formatCurrency(remaining)}</div></div>
      </div>
      <div><label className="label">To'lov sanasi</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" /></div>
      <div><label className="label">Izoh</label><input type="text" value={note} onChange={e => setNote(e.target.value)} className="input" /></div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-3 py-2">
        <p className="text-xs text-amber-700 dark:text-amber-400">⚡ Bu to'lov avtomatik ravishda <strong>Xarajatlar</strong> bo'limiga ham yoziladi</p>
      </div>
      <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor</button><button type="submit" className="btn-success flex-1">Hisoblash</button></div>
    </form>
  );
}

type PeriodFilter = 'all' | 'month' | 'custom';

export default function WorkersPage() {
  const { workers, workerPayments, expenses, deleteWorker, deleteWorkerPayment } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState<Worker | null>(null);
  const [paymentWorker, setPaymentWorker] = useState<Worker | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const totalMonthlyCost = useMemo(() => workers.reduce((s, w) => s + w.monthlySalary, 0), [workers]);
  const totalUnpaid = useMemo(() => workerPayments.reduce((s, p) => s + p.remaining, 0), [workerPayments]);

  const filteredPayments = useMemo(() => {
    if (periodFilter === 'month') return workerPayments.filter(p => p.month === currentMonth);
    if (periodFilter === 'custom' && customFrom && customTo) {
      return workerPayments.filter(p => p.month >= customFrom.slice(0, 7) && p.month <= customTo.slice(0, 7));
    }
    return workerPayments;
  }, [workerPayments, periodFilter, currentMonth, customFrom, customTo]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-dark-900 dark:text-white">Ishchilar</h1><p className="text-sm text-slate-500">{workers.length} ta ishchi</p></div>
        <button onClick={() => { setEditWorker(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Yangi ishchi</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-xs text-slate-500">Jami ishchilar</p><p className="text-2xl font-black text-dark-900 dark:text-white">{workers.length}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">Oylik maosh fondi</p><p className="text-lg font-bold text-primary-600 dark:text-primary-400">{formatCurrency(totalMonthlyCost)}</p></div>
        <div className="card p-4"><p className="text-xs text-slate-500">To'lanmagan qoliq</p><p className="text-lg font-bold text-red-500">{formatCurrency(totalUnpaid)}</p></div>
      </div>

      {/* Workers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map(worker => {
          const payments = workerPayments.filter(p => p.workerId === worker.id).sort((a, b) => b.month.localeCompare(a.month));
          const lastPayment = payments[0];

          const workerPaidViaExpenses = expenses
            .filter(e => e.recipient === worker.name)
            .reduce((sum, e) => sum + e.amount, 0);

          const lastPaymentPaid = lastPayment ? lastPayment.totalPaid : 0;
          const totalPaidToWorker = workerPaidViaExpenses + lastPaymentPaid;
          const remainingSalary = Math.max(0, worker.monthlySalary - totalPaidToWorker);

          return (
            <div key={worker.id} className="card-hover p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/25">
                    {worker.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-dark-900 dark:text-white">{worker.name}</p>
                    <p className="text-xs text-slate-500 bg-slate-100 dark:bg-dark-700 px-2 py-0.5 rounded-full inline-block">{worker.position}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {worker.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3.5 h-3.5" />{worker.phone}</div>}
                {worker.startDate && <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="w-3.5 h-3.5" />Boshlagani: {formatDate(worker.startDate)}</div>}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-dark-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Oylik maosh</span>
                  <span className="font-bold text-dark-900 dark:text-white">{formatCurrency(worker.monthlySalary)}</span>
                </div>

                <div className="bg-slate-50 dark:bg-dark-700/50 rounded-xl px-3 py-2 space-y-1 mb-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Xarajatlar orqali:</span>
                    <span className="text-xs font-semibold text-emerald-600">{formatCurrency(workerPaidViaExpenses)}</span>
                  </div>
                  {lastPayment && (
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Hisoblangan to'lov:</span>
                      <span className="text-xs font-semibold text-emerald-600">{formatCurrency(lastPaymentPaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 dark:border-dark-600 pt-1 mt-1 font-bold">
                    <span className="text-xs text-dark-800 dark:text-dark-200">Berildi:</span>
                    <span className="text-xs text-emerald-600">{formatCurrency(totalPaidToWorker)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-dark-800 dark:text-dark-200">Qoldi:</span>
                    <span className={`text-xs font-bold ${remainingSalary > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {remainingSalary > 0 ? formatCurrency(remainingSalary) : '✓ To\'liq'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setPaymentWorker(worker)} className="btn-success flex-1 justify-center py-2 text-sm"><DollarSign className="w-4 h-4" /> Hisob</button>
                <button onClick={() => { setEditWorker(worker); setShowModal(true); }} className="btn-secondary py-2 px-3"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => deleteWorker(worker.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment history with date filter */}
      {workerPayments.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-dark-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-dark-900 dark:text-white flex items-center gap-2"><UserCheck className="w-5 h-5 text-indigo-500" /> To'lov tarixi</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex bg-slate-100 dark:bg-dark-700 rounded-xl p-1 gap-1">
                  {([['all', 'Barchasi'], ['month', 'Bu oy'], ['custom', 'Tanlash']] as [PeriodFilter, string][]).map(([p, label]) => (
                    <button key={p} onClick={() => setPeriodFilter(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${periodFilter === p ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500'}`}>{label}</button>
                  ))}
                </div>
                {periodFilter === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input type="month" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="input py-1 text-xs" />
                    <span className="text-slate-400 text-xs">—</span>
                    <input type="month" value={customTo} onChange={e => setCustomTo(e.target.value)} className="input py-1 text-xs" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-dark-700/50">
                <tr>
                  <th className="table-header">Oy</th>
                  <th className="table-header">Ishchi</th>
                  <th className="table-header">Kunlar</th>
                  <th className="table-header">Hisoblangan</th>
                  <th className="table-header">To'langan</th>
                  <th className="table-header">Qoliq</th>
                  <th className="table-header"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                {filteredPayments.slice(0, 30).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-dark-700/30">
                    <td className="table-cell font-medium">{p.month}</td>
                    <td className="table-cell">{p.workerName}</td>
                    <td className="table-cell">{p.daysWorked} kun</td>
                    <td className="table-cell font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(p.totalEarned)}</td>
                    <td className="table-cell text-emerald-600 font-semibold">{formatCurrency(p.totalPaid)}</td>
                    <td className="table-cell"><span className={`font-bold ${p.remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{p.remaining > 0 ? formatCurrency(p.remaining) : '✓'}</span></td>
                    <td className="table-cell"><button onClick={() => deleteWorkerPayment(p.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && <tr><td colSpan={7} className="table-cell text-center py-8 text-slate-400">Hech qanday to'lov topilmadi</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editWorker ? 'Ishchini tahrirlash' : "Yangi ishchi qo'shish"} size="md">
        <WorkerForm worker={editWorker || undefined} onClose={() => setShowModal(false)} />
      </Modal>
      {paymentWorker && (
        <Modal isOpen={true} onClose={() => setPaymentWorker(null)} title="Oylik hisob-kitob" size="md">
          <PaymentForm worker={paymentWorker} onClose={() => setPaymentWorker(null)} />
        </Modal>
      )}
    </div>
  );
}
