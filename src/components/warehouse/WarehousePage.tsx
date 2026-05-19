import { useState, useMemo } from 'react';
import { Plus, Minus, AlertTriangle, Package, TrendingUp, TrendingDown, FileText, Trash2, Truck, ChevronDown, ChevronUp, Search, Calendar, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store';
import { RawMaterial, RawMaterialTransaction } from '../../types';
import { formatCurrency, formatDate, generateId, getTodayDate, getDateNDaysAgo } from '../../utils';
import Modal from '../ui/Modal';

function NewMaterialForm({ onClose }: { onClose: () => void }) {
  const { addRawMaterial } = useStore();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('t');
  const [minQty, setMinQty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addRawMaterial({ id: generateId(), name: name.trim(), unit, quantity: 0, minQuantity: parseFloat(minQty) || 10 });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Xomashyo nomi *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Masalan: Granit, Ohaktosh..." autoFocus /></div>
      <div><label className="label">O'lchov birligi</label>
        <select value={unit} onChange={e => setUnit(e.target.value)} className="input">
          <option value="t">t (tonna)</option><option value="m³">m³ (kub metr)</option><option value="l">l (litr)</option><option value="kg">kg (kilogramm)</option><option value="dona">dona</option>
        </select>
      </div>
      <div><label className="label">Minimal chegara (ogohlantirish)</label><input type="number" value={minQty} onChange={e => setMinQty(e.target.value)} className="input" placeholder="10" /></div>
      <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button><button type="submit" className="btn-primary flex-1">Qo'shish</button></div>
    </form>
  );
}

import { TransactionForm } from './TransactionForm';

export default function WarehousePage() {
  const { rawMaterials, rawTransactions, deleteRawMaterial, drivers } = useStore();
  const [modal, setModal] = useState<{ material: RawMaterial; type: 'kirim' | 'chiqim' } | null>(null);
  const [showNewMat, setShowNewMat] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMat, setSelectedMat] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'qoldiq' | 'tashuvchilar'>('qoldiq');
  const [transporterSearch, setTransporterSearch] = useState('');
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);

  const lowStock = rawMaterials.filter(m => m.quantity <= m.minQuantity);

  const filteredTx = useMemo(() => {
    let tx = rawTransactions;
    if (selectedMat) tx = tx.filter(t => t.materialId === selectedMat);
    return tx.slice(0, 30);
  }, [rawTransactions, selectedMat]);

  // Consumption chart (last 14 days)
  const consumptionData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = getDateNDaysAgo(13 - i);
      const dayTx = rawTransactions.filter(t => t.date === date);
      return {
        date: date.slice(5),
        kirim: dayTx.filter(t => t.type === 'kirim').reduce((s, t) => s + t.quantity, 0),
        chiqim: dayTx.filter(t => t.type === 'chiqim').reduce((s, t) => s + t.quantity, 0),
      };
    });
  }, [rawTransactions]);

  // Dynamic transporter stats
  const transporterStats = useMemo(() => {
    const statsMap: Record<string, {
      driverId: string;
      driverName: string;
      driverPhone: string;
      carNumber: string;
      carModel: string;
      trips: number;
      totalQty: number;
      materials: Record<string, { qty: number; unit: string }>;
      history: { date: string; materialName: string; quantity: number; unit: string; docNumber?: string; note?: string }[];
    }> = {};

    rawTransactions.forEach(t => {
      if (t.type !== 'kirim' || !t.driverId) return;

      const dId = t.driverId;
      const dObj = drivers.find(d => d.id === dId);

      if (!statsMap[dId]) {
        statsMap[dId] = {
          driverId: dId,
          driverName: t.driverName || dObj?.name || 'Noma\'lum',
          driverPhone: dObj?.phone || 'Kiritilmagan',
          carNumber: dObj?.carNumber || '—',
          carModel: dObj?.carModel || '—',
          trips: 0,
          totalQty: 0,
          materials: {},
          history: []
        };
      }

      const driverStat = statsMap[dId];
      driverStat.trips++;
      driverStat.totalQty += t.quantity;

      const matObj = rawMaterials.find(m => m.id === t.materialId);
      const unit = matObj?.unit || 't';

      if (!driverStat.materials[t.materialName]) {
        driverStat.materials[t.materialName] = { qty: 0, trips: 0, unit };
      }
      driverStat.materials[t.materialName].qty += t.quantity;
      driverStat.materials[t.materialName].trips++;

      driverStat.history.push({
        date: t.date,
        materialName: t.materialName,
        quantity: t.quantity,
        unit,
        docNumber: t.docNumber || undefined,
        note: t.note || undefined
      });
    });

    return Object.values(statsMap).filter(ds =>
      ds.driverName.toLowerCase().includes(transporterSearch.toLowerCase()) ||
      ds.carNumber.toLowerCase().includes(transporterSearch.toLowerCase())
    );
  }, [rawTransactions, drivers, rawMaterials, transporterSearch]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Xomashyo / Ombor</h1>
          <p className="text-sm text-slate-500">{rawMaterials.length} ta material mavjud</p>
        </div>
        <button onClick={() => setShowNewMat(true)} className="btn-primary"><Plus className="w-4 h-4" /> Yangi tur</button>
      </div>

      {lowStock.length > 0 && activeTab === 'qoldiq' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Xomashyo kam qoldi!</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">{lowStock.map(m => `${m.name}: ${m.quantity} ${m.unit}`).join(' • ')}</p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-dark-700">
        <button
          onClick={() => setActiveTab('qoldiq')}
          className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'qoldiq'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-dark-400 dark:hover:text-dark-200'
          }`}
        >
          Ombor qoldig'i
        </button>
        <button
          onClick={() => setActiveTab('tashuvchilar')}
          className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'tashuvchilar'
              ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-dark-400 dark:hover:text-dark-200'
          }`}
        >
          Xomashyo tashuvchilar
        </button>
      </div>

      {activeTab === 'qoldiq' ? (
        <>
          {/* Material cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rawMaterials.map(material => {
              const isLow = material.quantity <= material.minQuantity;
              const pct = Math.min((material.quantity / Math.max(material.minQuantity * 3, 1)) * 100, 100);
              const lastKirim = rawTransactions.filter(t => t.materialId === material.id && t.type === 'kirim')[0];
              return (
                <div key={material.id} className={`card-hover p-5 space-y-4 ${isLow ? 'ring-2 ring-red-400 dark:ring-red-600' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLow ? 'bg-red-100 dark:bg-red-900/20' : 'bg-emerald-100 dark:bg-emerald-900/20'}`}>
                        <Package className={`w-5 h-5 ${isLow ? 'text-red-500' : 'text-emerald-500'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-dark-900 dark:text-white">{material.name}</p>
                        <p className="text-xs text-slate-500">Min: {material.minQuantity} {material.unit}</p>
                      </div>
                    </div>
                    {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className={`text-3xl font-black ${isLow ? 'text-red-500' : 'text-dark-900 dark:text-white'}`}>{material.quantity}</span>
                      <span className="text-sm font-bold text-slate-500">{material.unit}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-dark-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${isLow ? 'bg-red-500' : pct > 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {lastKirim && <p className="text-xs text-slate-400">Oxirgi kirim: {formatDate(lastKirim.date)} — {lastKirim.supplierName || '—'}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setModal({ material, type: 'kirim' })} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl text-sm font-semibold transition-colors"><Plus className="w-4 h-4" /> Kirim</button>
                    <button onClick={() => setModal({ material, type: 'chiqim' })} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl text-sm font-semibold transition-colors"><Minus className="w-4 h-4" /> Chiqim</button>
                    <button onClick={() => deleteRawMaterial(material.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="card p-5">
            <h2 className="font-bold text-dark-900 dark:text-white mb-4">Kirim/Chiqim (14 kun)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="kirim" name="Kirim" fill="#10b981" radius={[3,3,0,0]} />
                <Bar dataKey="chiqim" name="Chiqim" fill="#f87171" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Transaction history */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-dark-700 flex items-center gap-3">
              <h2 className="font-bold text-dark-900 dark:text-white flex-1">Operatsiyalar tarixi</h2>
              <select value={selectedMat || ''} onChange={e => setSelectedMat(e.target.value || null)} className="input w-auto text-sm py-1.5">
                <option value="">Barcha materiallar</option>
                {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-dark-700/50">
                  <tr>
                    <th className="table-header">Sana</th>
                    <th className="table-header">Material</th>
                    <th className="table-header">Tur</th>
                    <th className="table-header">Miqdor</th>
                    <th className="table-header">Yetkazuvchi</th>
                    <th className="table-header">Narx</th>
                    <th className="table-header">Hujjat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-700">
                  {filteredTx.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-dark-700/30">
                      <td className="table-cell text-xs text-slate-500">{formatDate(t.date)}</td>
                      <td className="table-cell font-medium">{t.materialName}</td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${t.type === 'kirim' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {t.type === 'kirim' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{t.type === 'kirim' ? 'Kirim' : 'Chiqim'}
                        </span>
                      </td>
                      <td className="table-cell font-bold">{t.quantity}</td>
                      <td className="table-cell text-sm text-slate-500">{t.supplierName || '—'}</td>
                      <td className="table-cell text-sm">{t.totalPrice ? formatCurrency(t.totalPrice) : '—'}</td>
                      <td className="table-cell text-xs text-slate-400 flex items-center gap-1">{t.docNumber ? <><FileText className="w-3 h-3" />{t.docNumber}</> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Xomashyo tashuvchi haydovchilar tab */
        <div className="space-y-4">
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={transporterSearch}
                onChange={e => setTransporterSearch(e.target.value)}
                placeholder="Haydovchi ismi yoki mashina raqami orqali qidirish..."
                className="input pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {transporterStats.map(ds => {
              const isExpanded = expandedDriverId === ds.driverId;
              return (
                <div key={ds.driverId} className="card overflow-hidden transition-all border border-slate-100 dark:border-dark-700">
                  <div 
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-700/20"
                    onClick={() => setExpandedDriverId(isExpanded ? null : ds.driverId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-dark-900 dark:text-white leading-tight">{ds.driverName}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Moshina: {ds.carModel} ({ds.carNumber})</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                      <div className="text-center md:text-left">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Jami reyslar</p>
                        <p className="text-lg font-black text-dark-900 dark:text-white mt-0.5">{ds.trips} marta</p>
                      </div>
                      <div className="text-center md:text-left">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Tashilgan xomashyo</p>
                        <p className="text-lg font-black text-emerald-600 mt-0.5">
                          {ds.totalQty.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          <span className="text-xs font-bold text-slate-400 ml-1">birlik</span>
                        </p>
                      </div>
                      <button 
                        className="p-2 rounded-xl bg-slate-100 dark:bg-dark-700 text-slate-500 hover:text-dark-900 transition-colors ml-auto"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Material summary inside card */}
                  <div className="px-5 pb-5 border-t border-slate-100/50 dark:border-dark-700/50 pt-4 bg-slate-50/50 dark:bg-dark-800/30">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Xomashyo turi bo'yicha hisob:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(ds.materials).map(([name, stat]: [string, any]) => (
                        <div key={name} className="flex items-center gap-2 bg-white dark:bg-dark-800 border border-slate-200/50 dark:border-dark-700/50 rounded-xl px-3 py-1.5 text-xs shadow-sm">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-600 dark:text-dark-300">{name}:</span>
                          <span className="font-bold text-dark-900 dark:text-white">{stat.qty.toLocaleString(undefined, { maximumFractionDigits: 1 })} {stat.unit}</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-dark-700 text-slate-500 dark:text-dark-400 px-1.5 py-0.5 rounded-md font-semibold">{stat.trips} reys</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Detailed trips list (History Accordion) */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 dark:border-dark-700 overflow-x-auto bg-white dark:bg-dark-800">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-dark-700/60 text-xs">
                          <tr>
                            <th className="px-5 py-3 font-bold text-slate-500">Sana</th>
                            <th className="px-5 py-3 font-bold text-slate-500">Material</th>
                            <th className="px-5 py-3 font-bold text-slate-500">Miqdor</th>
                            <th className="px-5 py-3 font-bold text-slate-500">Hujjat</th>
                            <th className="px-5 py-3 font-bold text-slate-500">Izoh</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-dark-700 text-sm">
                          {ds.history.map((h, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-dark-700/10">
                              <td className="px-5 py-3 text-xs text-slate-500 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {formatDate(h.date)}
                              </td>
                              <td className="px-5 py-3 font-semibold text-dark-800 dark:text-dark-100">{h.materialName}</td>
                              <td className="px-5 py-3 font-bold text-emerald-600">{h.quantity} {h.unit}</td>
                              <td className="px-5 py-3 text-xs text-slate-400">{h.docNumber || '—'}</td>
                              <td className="px-5 py-3 text-xs text-slate-500 italic max-w-xs truncate">{h.note || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {transporterStats.length === 0 && (
              <div className="card p-10 text-center">
                <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">Hech qanday xomashyo tashuvchi haydovchi topilmadi</p>
              </div>
            )}
          </div>
        </div>
      )}

      {modal && (
        <Modal isOpen={true} onClose={() => setModal(null)} title={`${modal.type === 'kirim' ? 'Kirim' : 'Chiqim'} qilish`} size="md">
          <TransactionForm material={modal.material} type={modal.type} onClose={() => setModal(null)} />
        </Modal>
      )}
      <Modal isOpen={showNewMat} onClose={() => setShowNewMat(false)} title="Yangi xomashyo turi" size="sm">
        <NewMaterialForm onClose={() => setShowNewMat(false)} />
      </Modal>
    </div>
  );
}
