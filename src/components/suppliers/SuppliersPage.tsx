import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Phone, Package, TrendingUp, Building2, Calendar, Globe } from 'lucide-react';
import { useStore } from '../../store';
import { Supplier } from '../../types';
import { generateId, getTodayDate, formatCurrency } from '../../utils';
import Modal from '../ui/Modal';

function SupplierForm({ supplier, onClose }: { supplier?: Supplier; onClose: () => void }) {
  const { addSupplier } = useStore();
  const [name, setName] = useState(supplier?.name || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Firma nomi kiritilmagan'); return; }
    
    await addSupplier({
      id: supplier?.id || generateId(),
      name: name.trim(),
      phone: phone.trim(),
      createdAt: supplier?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}
      <div>
        <label className="label">Firma nomi *</label>
        <input 
          type="text" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="input" 
          placeholder="Masalan: G'isht zavod MCHJ" 
          autoFocus 
        />
      </div>
      <div>
        <label className="label">Telefon raqam</label>
        <input 
          type="text" 
          value={phone} 
          onChange={e => setPhone(e.target.value)} 
          className="input" 
          placeholder="+998 90 123 45 67" 
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
        <button type="submit" className="btn-primary flex-1">{supplier ? 'Saqlash' : "Qo'shish"}</button>
      </div>
    </form>
  );
}

export default function SuppliersPage() {
  const { suppliers, rawTransactions, expenses } = useStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const filtered = useMemo(() =>
    suppliers.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      (s.phone && s.phone.includes(search))
    ),
    [suppliers, search]
  );

  const stats = useMemo(() => {
    const map: Record<string, { 
      trips: number; 
      qty: number; 
      suppliedValue: number; 
      paidValue: number; 
      lastDate: string;
      materials: Record<string, { qty: number; value: number }>
    }> = {};
    
    // Calculate supplies
    rawTransactions.forEach(t => {
      if (!t.supplierId) return;
      if (!map[t.supplierId]) {
        map[t.supplierId] = { trips: 0, qty: 0, suppliedValue: 0, paidValue: 0, lastDate: '', materials: {} };
      }
      const s = map[t.supplierId];
      s.trips++;
      s.qty += t.quantity;
      s.suppliedValue += t.totalPrice || 0;
      if (t.date > s.lastDate) s.lastDate = t.date;

      // Material breakdown
      if (!s.materials[t.materialName]) s.materials[t.materialName] = { qty: 0, value: 0 };
      s.materials[t.materialName].qty += t.quantity;
      s.materials[t.materialName].value += t.totalPrice || 0;
    });

    // Calculate payments from expenses
    const supplierMapByName: Record<string, string> = {};
    suppliers.forEach(s => { supplierMapByName[s.name] = s.id; });

    expenses.forEach(e => {
      if (!e.recipient) return;
      const sId = supplierMapByName[e.recipient];
      if (sId && map[sId]) {
        map[sId].paidValue += e.amount;
      }
    });

    return map;
  }, [rawTransactions, suppliers, expenses]);

  const totalQty = Object.values(stats).reduce((acc, curr) => acc + curr.qty, 0);
  const totalDebt = Object.values(stats).reduce((acc, curr) => acc + (curr.suppliedValue - curr.paidValue), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Firmalar (Ta'minotchilar)</h1>
          <p className="text-sm text-slate-500">{suppliers.length} ta hamkor firma</p>
        </div>
        <button onClick={() => { setEditSupplier(null); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Yangi firma
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider mb-1">Jami keltirilgan yuk</p>
              <h3 className="text-3xl font-black">{totalQty.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-xl"><Package className="w-6 h-6" /></div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-indigo-100">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Barcha xomashyo turlari bo'yicha</span>
          </div>
        </div>

        <div className="card p-5 bg-white dark:bg-dark-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Jami qarzimiz</p>
              <h3 className={`text-2xl font-black ${totalDebt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {formatCurrency(totalDebt)}
              </h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><Building2 className="w-6 h-6" /></div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Barcha firmalar bo'yicha qoldiq</p>
        </div>

        <div className="card p-5 bg-white dark:bg-dark-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Jami reyslar</p>
              <h3 className="text-3xl font-black text-dark-900 dark:text-white">
                {Object.values(stats).reduce((a, b) => a + b.trips, 0)}
              </h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><Calendar className="w-6 h-6" /></div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Umumiy yuk tashishlar soni</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Firma nomi yoki telefon orqali qidirish..." 
            className="input pl-10" 
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const sStat = stats[s.id] || { trips: 0, qty: 0, lastDate: '' };
          return (
            <div key={s.id} className="card-hover p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-slate-600 dark:text-dark-300 font-bold text-xl">
                    {s.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-dark-900 dark:text-white leading-tight">{s.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500">{s.phone || 'Tel kiritilmagan'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-dark-700/50 p-3 rounded-xl border border-slate-100 dark:border-dark-700/50">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Keltirilgan yuk</p>
                  <p className="text-sm font-bold text-dark-800 dark:text-dark-100">{formatCurrency(sStat.suppliedValue || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{(sStat.qty || 0).toFixed(1)} unit / {sStat.trips || 0} reys</p>
                </div>
                <div className="bg-slate-50 dark:bg-dark-700/50 p-3 rounded-xl border border-slate-100 dark:border-dark-700/50">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Berilgan pul</p>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(sStat.paidValue || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Jami to'lovlar</p>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                ((sStat.suppliedValue || 0) - (sStat.paidValue || 0)) > 0 
                  ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
                  : 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30'
              }`}>
                <span className="text-xs font-medium text-slate-500">Qarz qoldig'i:</span>
                <span className={`font-black ${
                  ((sStat.suppliedValue || 0) - (sStat.paidValue || 0)) > 0 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {formatCurrency((sStat.suppliedValue || 0) - (sStat.paidValue || 0))}
                </span>
              </div>

              {/* Material Breakdown */}
              {Object.keys(sStat.materials || {}).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-dark-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Xomashyo turi bo'yicha:</p>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(sStat.materials).map(([mName, mStat]) => (
                      <div key={mName} className="flex items-center justify-between text-[11px] bg-slate-100/50 dark:bg-dark-700/30 px-2 py-1 rounded-lg">
                        <span className="text-slate-600 dark:text-dark-300 font-medium">{mName}</span>
                        <div className="text-right">
                          <span className="font-bold text-dark-900 dark:text-white">{mStat.qty.toFixed(1)}</span>
                          <span className="text-slate-400 ml-1">({formatCurrency(mStat.value)})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-dark-700">
                <div className="text-[10px] text-slate-400">
                  Oxirgi marta: <span className="font-medium text-slate-600 dark:text-dark-300">{sStat.lastDate || '—'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditSupplier(s); setShowModal(true); }} className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center">
          <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">Hech qanday firma topilmadi</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editSupplier ? 'Firmani tahrirlash' : "Yangi firma qo'shish"}>
        <SupplierForm supplier={editSupplier || undefined} onClose={() => setShowModal(false)} />
      </Modal>
    </div>
  );
}
