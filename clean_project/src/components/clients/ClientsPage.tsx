import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Pencil, Trash2, Phone, MapPin, AlertCircle, Building2, ArrowUpRight, Users, Wallet, CheckCircle } from 'lucide-react';
import { useStore } from '../../store';
import { Client, ClientPayment } from '../../types';
import { formatCurrency, formatDate, generateId, getTodayDate } from '../../utils';
import Modal from '../ui/Modal';

function ClientForm({ client, onClose }: { client?: Client; onClose: () => void }) {
  const { addClient, updateClient } = useStore();
  const [name, setName] = useState(client?.name || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [address, setAddress] = useState(client?.address || '');
  const [company, setCompany] = useState(client?.company || '');
  const [debt, setDebt] = useState(client?.totalDebt?.toString() || '0');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Mijoz ismi kiritilmagan'); return; }
    if (!phone.trim()) { setError('Telefon raqam kiritilmagan'); return; }
    if (client) {
      updateClient(client.id, { name: name.trim(), phone: phone.trim(), address: address.trim() || undefined, company: company.trim() || undefined, totalDebt: parseFloat(debt) || 0 });
    } else {
      addClient({ id: generateId(), name: name.trim(), phone: phone.trim(), address: address.trim() || undefined, company: company.trim() || undefined, totalDebt: parseFloat(debt) || 0, createdAt: new Date().toISOString() });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Mijoz ismi *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input" placeholder="To'liq ismi sharifi" autoFocus /></div>
        <div><label className="label">Telefon raqam *</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+998 90 123 45 67" /></div>
        <div><label className="label">Kompaniya</label><input type="text" value={company} onChange={e => setCompany(e.target.value)} className="input" placeholder="MChJ, XK..." /></div>
        <div className="col-span-2"><label className="label">Manzil</label><input type="text" value={address} onChange={e => setAddress(e.target.value)} className="input" placeholder="Shahar, ko'cha, uy" /></div>
        <div className="col-span-2"><label className="label">Nasiya qarzi (so'm)</label><input type="number" value={debt} onChange={e => setDebt(e.target.value)} className="input" placeholder="0" min="0" /></div>
      </div>
      <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button><button type="submit" className="btn-primary flex-1">{client ? 'Saqlash' : "Qo'shish"}</button></div>
    </form>
  );
}

function DebtPaymentForm({ client, onClose }: { client: Client; onClose: () => void }) {
  const { addClientPayment } = useStore();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addClientPayment({
      id: generateId(),
      clientId: client.id,
      clientName: client.name,
      amount: Math.min(amt, client.totalDebt),
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
      date,
    });
    setDone(true);
    setTimeout(() => onClose(), 1500);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <p className="font-bold text-lg text-dark-900 dark:text-white">To'lov qabul qilindi!</p>
        <p className="text-sm text-slate-500">Qolgan qarz: {formatCurrency(Math.max(0, client.totalDebt - parseFloat(amount || '0')))}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-4">
        <p className="font-bold text-dark-900 dark:text-white">{client.name}</p>
        <p className="text-sm text-slate-500 mt-0.5">Joriy nasiya qarzi:</p>
        <p className="text-2xl font-black text-red-500">{formatCurrency(client.totalDebt)}</p>
      </div>
      <div>
        <label className="label">To'lov summasi (so'm) *</label>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input" placeholder="0" max={client.totalDebt} autoFocus />
        {amount && parseFloat(amount) > 0 && (
          <p className="text-xs text-emerald-600 mt-1">
            To'lovdan keyin qoladi: {formatCurrency(Math.max(0, client.totalDebt - parseFloat(amount)))}
          </p>
        )}
      </div>
      <div><label className="label">Izoh</label><input type="text" value={note} onChange={e => setNote(e.target.value)} className="input" placeholder="Naqd / Bank orqali..." /></div>
      <div><label className="label">Sana</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" /></div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor</button>
        <button type="submit" className="flex-1 btn-success justify-center">
          <Wallet className="w-4 h-4" /> To'lovni qabul qilish
        </button>
      </div>
    </form>
  );
}

export default function ClientsPage() {
  const { clients, sales, deleteClient } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'card' | 'list'>('card');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [payClient, setPayClient] = useState<Client | null>(null);
  const [filterDebt, setFilterDebt] = useState<'all' | 'debt' | 'nodept'>('all');

  const clientStats = useMemo(() => {
    const map: Record<string, { total: number; count: number; lastDate: string; tons: number }> = {};
    sales.forEach(s => {
      if (!map[s.clientId]) map[s.clientId] = { total: 0, count: 0, lastDate: '', tons: 0 };
      map[s.clientId].total += s.totalAmount;
      map[s.clientId].count += 1;
      map[s.clientId].tons += s.tons;
      if (s.date > map[s.clientId].lastDate) map[s.clientId].lastDate = s.date;
    });
    return map;
  }, [sales]);

  const filtered = useMemo(() => clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || (c.company || '').toLowerCase().includes(search.toLowerCase());
    const matchDebt = filterDebt === 'all' || (filterDebt === 'debt' ? c.totalDebt > 0 : c.totalDebt === 0);
    return matchSearch && matchDebt;
  }), [clients, search, filterDebt]);

  const totalDebt = useMemo(() => clients.reduce((s, c) => s + c.totalDebt, 0), [clients]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-dark-900 dark:text-white">Mijozlar</h1><p className="text-sm text-slate-500 dark:text-dark-400">{filtered.length} ta mijoz</p></div>
        <button onClick={() => { setEditClient(null); setShowModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Yangi mijoz</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center"><span className="text-xl font-black text-primary-600 dark:text-primary-400">{clients.length}</span></div>
          <div><p className="text-xs text-slate-500">Jami mijozlar</p><p className="font-semibold text-dark-900 dark:text-white">Ro'yxatda</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center"><span className="text-xl font-black text-red-600 dark:text-red-400">{clients.filter(c => c.totalDebt > 0).length}</span></div>
          <div><p className="text-xs text-slate-500">Qarzdor</p><p className="font-semibold text-dark-900 dark:text-white">Mijozlar</p></div>
        </div>
        <div className="card p-4"><p className="text-xs text-slate-500">Umumiy nasiya qarzi</p><p className="text-lg font-bold text-red-500 mt-0.5">{formatCurrency(totalDebt)}</p></div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism, telefon yoki kompaniya..." className="input pl-9" />
        </div>
        <div className="flex gap-2">
          {(['all', 'debt', 'nodept'] as const).map(f => (
            <button key={f} onClick={() => setFilterDebt(f)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${filterDebt === f ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300'}`}>
              {f === 'all' ? 'Barchasi' : f === 'debt' ? '🔴 Qarzdor' : '✅ Tozalar'}
            </button>
          ))}
        </div>
        <div className="flex bg-slate-100 dark:bg-dark-700 rounded-xl p-1 gap-1">
          <button onClick={() => setView('card')} className={`p-2 rounded-lg transition-all ${view === 'card' ? 'bg-white dark:bg-dark-600 shadow-sm' : ''}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-dark-600 shadow-sm' : ''}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {view === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => {
            const stats = clientStats[client.id] || { total: 0, count: 0, lastDate: '', tons: 0 };
            return (
              <div key={client.id} className="card-hover p-5 space-y-3 cursor-pointer" onClick={() => navigate(`/mijozlar/${client.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-600/20">{client.name[0].toUpperCase()}</div>
                    <div>
                      <p className="font-bold text-dark-900 dark:text-white">{client.name}</p>
                      {client.company && <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{client.company}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {client.totalDebt > 0 && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3 h-3" />{client.phone}</div>
                  {client.address && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="w-3 h-3" /><span className="truncate">{client.address}</span></div>}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-dark-700">
                  <div><p className="text-xs text-slate-400">Jami xarid</p><p className="text-sm font-bold text-dark-900 dark:text-white">{formatCurrency(stats.total)}</p></div>
                  <div><p className="text-xs text-slate-400">Xaridlar</p><p className="text-sm font-bold text-dark-900 dark:text-white">{stats.count} ta</p></div>
                </div>

                {client.totalDebt > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2 flex items-center justify-between">
                    <div><p className="text-xs text-red-600 dark:text-red-400">Nasiya qarzi</p><p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(client.totalDebt)}</p></div>
                  </div>
                )}

                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {client.totalDebt > 0 && (
                    <button onClick={() => setPayClient(client)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors">
                      <Wallet className="w-3.5 h-3.5" /> To'lov
                    </button>
                  )}
                  <button onClick={() => { setEditClient(client); setShowModal(true); }} className="btn-secondary flex-1 justify-center py-1.5 text-xs"><Pencil className="w-3.5 h-3.5" /> Tahrirlash</button>
                  <button onClick={() => deleteClient(client.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-dark-700/50 border-b border-slate-200 dark:border-dark-700">
              <tr>
                <th className="table-header">Mijoz</th><th className="table-header">Telefon</th><th className="table-header">Kompaniya</th><th className="table-header">Jami xarid</th><th className="table-header">Nasiya</th><th className="table-header">Oxirgi xarid</th><th className="table-header"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
              {filtered.map(client => {
                const stats = clientStats[client.id] || { total: 0, count: 0, lastDate: '', tons: 0 };
                return (
                  <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-dark-700/30 cursor-pointer" onClick={() => navigate(`/mijozlar/${client.id}`)}>
                    <td className="table-cell"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 font-bold text-sm">{client.name[0]}</div><span className="font-medium">{client.name}</span></div></td>
                    <td className="table-cell text-sm text-slate-500">{client.phone}</td>
                    <td className="table-cell text-sm text-slate-500">{client.company || '—'}</td>
                    <td className="table-cell font-semibold text-primary-600 dark:text-primary-400">{formatCurrency(stats.total)}</td>
                    <td className="table-cell">{client.totalDebt > 0 ? <span className="badge-nasiya">{formatCurrency(client.totalDebt)}</span> : <span className="text-emerald-500 text-xs font-semibold">✓ Toza</span>}</td>
                    <td className="table-cell text-xs text-slate-500">{stats.lastDate ? formatDate(stats.lastDate) : '—'}</td>
                    <td className="table-cell" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {client.totalDebt > 0 && <button onClick={() => setPayClient(client)} className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg" title="To'lov"><Wallet className="w-3.5 h-3.5" /></button>}
                        <button onClick={() => { setEditClient(client); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteClient(client.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="card p-12 flex flex-col items-center gap-3 text-slate-400"><Users className="w-12 h-12" /><p className="font-medium">Mijozlar topilmadi</p></div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editClient ? 'Mijozni tahrirlash' : "Yangi mijoz qo'shish"} size="md">
        <ClientForm client={editClient || undefined} onClose={() => setShowModal(false)} />
      </Modal>

      {payClient && (
        <Modal isOpen={true} onClose={() => setPayClient(null)} title="Nasiya to'lovini qabul qilish" size="sm">
          <DebtPaymentForm client={payClient} onClose={() => setPayClient(null)} />
        </Modal>
      )}
    </div>
  );
}
