import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../../store';
import { RawMaterial } from '../../types';
import { generateId, getTodayDate } from '../../utils';

export function TransactionForm({ material, type, onClose }: { material: RawMaterial; type: 'kirim' | 'chiqim'; onClose: () => void }) {
  const { addRawTransaction, suppliers, addSupplier, drivers } = useStore();
  const [quantity, setQuantity] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [price, setPrice] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [showSupp, setShowSupp] = useState(false);
  const [driverId, setDriverId] = useState('');

  const totalPrice = useMemo(() => (parseFloat(quantity) || 0) * (parseFloat(price) || 0), [quantity, price]);
  const supplierNames = suppliers.map(s => s.name);
  const filteredSupp = supplierNames.filter(s => s.toLowerCase().includes(supplierName.toLowerCase()) && s !== supplierName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) return;

    let suppId = suppliers.find(s => s.name === supplierName)?.id;
    if (type === 'kirim' && supplierName && !suppId) {
      suppId = generateId();
      addSupplier({ id: suppId, name: supplierName, createdAt: new Date().toISOString() });
    }

    const selectedDriver = drivers.find(d => d.id === driverId);

    addRawTransaction({
      id: generateId(), materialId: material.id, materialName: material.name, type,
      quantity: parseFloat(quantity),
      supplierId: suppId, supplierName: supplierName || undefined,
      driverId: driverId || undefined,
      driverName: selectedDriver?.name || undefined,
      price: price ? parseFloat(price) : undefined,
      totalPrice: totalPrice || undefined,
      docNumber: docNumber.trim() || undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(), date,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className={`rounded-xl px-4 py-3 ${type === 'kirim' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
        <p className={`text-sm font-bold ${type === 'kirim' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
          {type === 'kirim' ? '📦 Kirim' : '📤 Chiqim'}: {material.name} ({material.unit})
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Hozirgi qoldiq: {material.quantity} {material.unit}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Miqdor ({material.unit}) *</label><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="input" placeholder="0" step="0.01" autoFocus /></div>
        {type === 'kirim' && (
          <>
            <div className="col-span-2 relative">
              <label className="label">Yetkazib beruvchi</label>
              <input type="text" value={supplierName} onChange={e => { setSupplierName(e.target.value); setShowSupp(true); }} onFocus={() => setShowSupp(true)} className="input" placeholder="Kompaniya nomi..." />
              {showSupp && filteredSupp.length > 0 && (
                <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 rounded-xl shadow-xl max-h-40 overflow-y-auto" onMouseLeave={() => setShowSupp(false)}>
                  {filteredSupp.map((s, i) => <li key={i} className="px-4 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-700" onMouseDown={() => { setSupplierName(s); setShowSupp(false); }}>{s}</li>)}
                </ul>
              )}
            </div>
            <div><label className="label">Birlik narxi (so'm)</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input" placeholder="0" /></div>
            <div><label className="label">Jami</label><div className="input bg-slate-100 dark:bg-dark-600 font-semibold text-primary-600 dark:text-primary-400">{totalPrice > 0 ? `${(totalPrice/1_000_000).toFixed(2)} mln` : '—'}</div></div>
            <div><label className="label">Hujjat raqami</label><input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} className="input" placeholder="FAK-2024-001" /></div>
            <div>
              <label className="label">Haydovchi (ixtiyoriy)</label>
              <select value={driverId} onChange={e => setDriverId(e.target.value)} className="input">
                <option value="">— Haydovchi tanlash —</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.carNumber})</option>)}
              </select>
            </div>
          </>
        )}
        <div className={type === 'kirim' ? '' : 'col-span-2'}>
          <label className="label">Sana</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
        </div>
        <div className="col-span-2"><label className="label">Izoh</label><input type="text" value={note} onChange={e => setNote(e.target.value)} className="input" placeholder="Qo'shimcha ma'lumot..." /></div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor</button>
        <button type="submit" className={`flex-1 font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-white ${type === 'kirim' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
          {type === 'kirim' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {type === 'kirim' ? 'Kirim' : 'Chiqim'}
        </button>
      </div>
    </form>
  );
}
