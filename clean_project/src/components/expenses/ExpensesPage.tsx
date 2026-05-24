import { useState, useMemo } from 'react';
import { Plus, Trash2, Users, Truck, Package, Zap, Wrench, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '../../store';
import { Expense, ExpenseCategoryDef } from '../../types';
import { formatCurrency, formatDate, generateId, getTodayDate, getDateNDaysAgo } from '../../utils';
import Modal from '../ui/Modal';

const ICON_MAP: Record<string, React.ElementType> = { Users, Truck, Package, Zap, Wrench, MoreHorizontal };

type Period = 'today' | 'week' | 'month';

function CategoryForm({ onClose }: { onClose: () => void }) {
  const { addExpenseCategory } = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addExpenseCategory({ id: generateId(), name: name.trim(), color, icon: 'MoreHorizontal' });
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Kategoriya nomi *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input" autoFocus /></div>
      <div><label className="label">Rang</label>
        <div className="flex items-center gap-3"><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded-xl border border-slate-200 dark:border-dark-600 cursor-pointer" /><span className="text-sm text-slate-600 dark:text-dark-300">{color}</span></div>
      </div>
      <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor</button><button type="submit" className="btn-primary flex-1">Qo'shish</button></div>
    </form>
  );
}

function ExpenseForm({ onClose }: { onClose: () => void }) {
  const { addExpense, expenseCategories, workers, drivers, clients } = useStore();
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientType, setRecipientType] = useState<'custom' | 'client' | 'driver' | 'worker'>('custom');
  const [date, setDate] = useState(getTodayDate());
  const [recipientOpen, setRecipientOpen] = useState(false);

  const selectedCat = expenseCategories.find(c => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount || parseFloat(amount) <= 0) return;
    addExpense({
      id: generateId(), categoryId, categoryName: selectedCat?.name || '',
      amount: parseFloat(amount), description: description.trim() || selectedCat?.name || '',
      recipient: recipient.trim() || undefined,
      createdAt: new Date().toISOString(), date,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Kategoriya *</label>
        <div className="grid grid-cols-2 gap-2">
          {expenseCategories.map(cat => {
            const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
            return (
              <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition-all border ${categoryId === cat.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'border-slate-200 dark:border-dark-600 text-slate-600 dark:text-dark-300'}`}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div><label className="label">Summa (so'm) *</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input" placeholder="0" step="1000" autoFocus /></div>

      <div>
        <label className="label">Kimga berildi (Turi)</label>
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-dark-700/50 rounded-xl mb-3">
          {(['custom', 'client', 'driver', 'worker'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setRecipientType(type);
                setRecipient('');
              }}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                recipientType === type
                  ? 'bg-white dark:bg-dark-600 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-dark-300'
              }`}
            >
              {type === 'custom' && 'Boshqa'}
              {type === 'client' && 'Mijoz'}
              {type === 'driver' && 'Haydovchi'}
              {type === 'worker' && 'Ishchi'}
            </button>
          ))}
        </div>

        {recipientType === 'custom' && (
          <div>
            <label className="label">Ism / Tashkilot nomi</label>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="input"
              placeholder="Masalan: G'isht zavod"
            />
          </div>
        )}

        {recipientType === 'client' && (
          <div>
            <label className="label">Mijozni tanlang</label>
            <select
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="input select"
            >
              <option value="">Tanlang...</option>
              {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}

        {recipientType === 'driver' && (
          <div>
            <label className="label">Haydovchini tanlang</label>
            <select
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="input select"
            >
              <option value="">Tanlang...</option>
              {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
        )}

        {recipientType === 'worker' && (
          <div>
            <label className="label">Ishchini tanlang</label>
            <select
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="input select"
            >
              <option value="">Tanlang...</option>
              {workers.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div><label className="label">Tavsif</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input" placeholder="Qo'shimcha ma'lumot..." /></div>
      <div><label className="label">Sana</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" /></div>
      <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor</button><button type="submit" className="btn-primary flex-1">Saqlash</button></div>
    </form>
  );
}

export default function ExpensesPage() {
  const { expenses, expenseCategories, deleteExpense, deleteExpenseCategory } = useStore();
  const [showExpModal, setShowExpModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [period, setPeriod] = useState<Period>('month');

  const getDateCutoff = (p: Period) => {
    if (p === 'today') return getTodayDate();
    if (p === 'week') return getDateNDaysAgo(7);
    return getDateNDaysAgo(30);
  };

  const periodExpenses = useMemo(() => {
    const cutoff = getDateCutoff(period);
    return expenses.filter(e => e.date >= cutoff);
  }, [expenses, period]);

  const filtered = useMemo(() =>
    filterCat === 'all' ? periodExpenses : periodExpenses.filter(e => e.categoryId === filterCat),
    [periodExpenses, filterCat]
  );

  const totalExpenses = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const pieData = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {};
    periodExpenses.forEach(e => {
      const cat = expenseCategories.find(c => c.id === e.categoryId);
      if (!map[e.categoryId]) map[e.categoryId] = { name: cat?.name || e.categoryName, value: 0, color: cat?.color || '#64748b' };
      map[e.categoryId].value += e.amount;
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [periodExpenses, expenseCategories]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-dark-900 dark:text-white">Xarajatlar</h1><p className="text-sm text-slate-500">{filtered.length} ta yozuv</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowCatModal(true)} className="btn-secondary"><Plus className="w-4 h-4" /> Kategoriya</button>
          <button onClick={() => setShowExpModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Yangi xarajat</button>
        </div>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-3">
        <div className="flex bg-slate-100 dark:bg-dark-700 rounded-xl p-1 gap-1">
          {([['today','Bugun'], ['week','Hafta'], ['month','Oy']] as [Period, string][]).map(([p, label]) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p ? 'bg-white dark:bg-dark-600 text-dark-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>{label}</button>
          ))}
        </div>
        <p className="text-sm text-slate-500">Jami: <span className="font-bold text-red-500">{formatCurrency(totalExpenses)}</span></p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-3">Kategoriya bo'yicha</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={2}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.slice(0, 5).map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-slate-600 dark:text-dark-300 flex-1 truncate">{d.name}</span>
                  <span className="text-xs font-bold text-dark-900 dark:text-white">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category ranking */}
        <div className="card p-5">
          <h2 className="font-bold text-dark-900 dark:text-white mb-3">Top kategoriyalar</h2>
          <div className="space-y-3">
            {pieData.slice(0, 5).map((d, i) => {
              const pct = totalExpenses > 0 ? (d.value / totalExpenses) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{i + 1}</span>
                      <span className="text-sm font-medium text-dark-800 dark:text-dark-100">{d.name}</span>
                    </div>
                    <span className="text-xs font-bold text-dark-900 dark:text-white">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: d.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category filter + table */}
      <div className="card p-4 flex flex-wrap gap-2 items-center">
        <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filterCat === 'all' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300'}`}>Barchasi</button>
        {expenseCategories.map(cat => (
          <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${filterCat === cat.id ? 'text-white' : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300'}`} style={filterCat === cat.id ? { background: cat.color } : {}}>
            <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />{cat.name}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-dark-700/50 border-b border-slate-200 dark:border-dark-700">
            <tr>
              <th className="table-header">Sana</th>
              <th className="table-header">Kategoriya</th>
              <th className="table-header">Kim uchun</th>
              <th className="table-header">Tavsif</th>
              <th className="table-header">Summa</th>
              <th className="table-header"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
            {filtered.map(e => {
              const cat = expenseCategories.find(c => c.id === e.categoryId);
              return (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-dark-700/30">
                  <td className="table-cell text-xs text-slate-500">{formatDate(e.date)}</td>
                  <td className="table-cell">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: cat?.color || '#64748b' }}>
                      {e.categoryName}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-slate-500">{e.recipient || '—'}</td>
                  <td className="table-cell">{e.description}</td>
                  <td className="table-cell font-bold text-red-500">{formatCurrency(e.amount)}</td>
                  <td className="table-cell">
                    <button onClick={() => deleteExpense(e.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="table-cell text-center py-10 text-slate-400">Xarajatlar topilmadi</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showExpModal} onClose={() => setShowExpModal(false)} title="Yangi xarajat qo'shish" size="md">
        <ExpenseForm onClose={() => setShowExpModal(false)} />
      </Modal>
      <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Yangi kategoriya" size="sm">
        <CategoryForm onClose={() => setShowCatModal(false)} />
      </Modal>
    </div>
  );
}
