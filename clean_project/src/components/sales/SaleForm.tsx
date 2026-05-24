import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { Sale, PaymentType } from '../../types';
import {
  formatCurrency, generateId, getTodayDate, getPaymentLabel
} from '../../utils';

function AutocompleteInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  onSelect,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  onSelect?: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes(value.toLowerCase()) && s !== value
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="label">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="input"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((s, i) => (
            <li
              key={i}
              className="px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-dark-700 text-dark-800 dark:text-dark-100 first:rounded-t-xl last:rounded-b-xl transition-colors"
              onMouseDown={() => {
                onChange(s);
                if (onSelect) onSelect(s);
                setOpen(false);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const PAYMENT_TYPES: PaymentType[] = ['naqd', 'nasiya', 'karta'];

export function SaleForm({ onClose }: { onClose: () => void }) {
  const { clients, drivers, addSale } = useStore();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverCar, setDriverCar] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [tons, setTons] = useState('');
  const [pricePerTon, setPricePerTon] = useState('900000');
  const [paymentType, setPaymentType] = useState<PaymentType>('naqd');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const clientNames = clients.map(c => c.name);
  const driverNames = drivers.map(d => d.name);

  const totalAmount = useMemo(() => {
    const t = parseFloat(tons) || 0;
    const p = parseFloat(pricePerTon) || 0;
    return t * p;
  }, [tons, pricePerTon]);

  const handleClientSelect = (name: string) => {
    const client = clients.find(c => c.name === name);
    if (client) setClientPhone(client.phone);
  };

  const handleDriverSelect = (name: string) => {
    const driver = drivers.find(d => d.name === name);
    if (driver) {
      setDriverCar(driver.carNumber);
      setDriverPhone(driver.phone);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) { setError('Mijoz ismi kiritilmagan'); return; }
    if (!driverName.trim()) { setError('Haydovchi ismi kiritilmagan'); return; }
    if (!tons || parseFloat(tons) <= 0) { setError('Tonna noto\'g\'ri'); return; }
    if (!pricePerTon || parseFloat(pricePerTon) <= 0) { setError('Narx noto\'g\'ri'); return; }

    let clientId = clients.find(c => c.name === clientName)?.id || generateId();

    const sale: Sale = {
      id: generateId(),
      clientId,
      clientName,
      driverId: drivers.find(d => d.name === driverName)?.id || generateId(),
      driverName,
      driverCarNumber: driverCar,
      tons: parseFloat(tons),
      pricePerTon: parseFloat(pricePerTon),
      totalAmount,
      paymentType,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
      date: getTodayDate(),
    };

    addSale(sale);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <AutocompleteInput
            label="Mijoz ismi *"
            value={clientName}
            onChange={setClientName}
            suggestions={clientNames}
            placeholder="Mijoz ismi yoki yangi..."
            onSelect={handleClientSelect}
          />
        </div>

        <div>
          <label className="label">Mijoz telefon</label>
          <input
            type="text"
            value={clientPhone}
            onChange={e => setClientPhone(e.target.value)}
            className="input"
            placeholder="+998 90 123 45 67"
          />
        </div>

        <div className="col-span-2">
          <AutocompleteInput
            label="Haydovchi ismi *"
            value={driverName}
            onChange={setDriverName}
            suggestions={driverNames}
            placeholder="Haydovchi ismi yoki yangi..."
            onSelect={handleDriverSelect}
          />
        </div>

        <div>
          <label className="label">Avto raqam</label>
          <input
            type="text"
            value={driverCar}
            onChange={e => setDriverCar(e.target.value)}
            className="input"
            placeholder="40 A 1234 FA"
          />
        </div>

        <div>
          <label className="label">Haydovchi tel</label>
          <input
            type="text"
            value={driverPhone}
            onChange={e => setDriverPhone(e.target.value)}
            className="input"
            placeholder="+998 90 000 00 00"
          />
        </div>

        <div>
          <label className="label">Tonna *</label>
          <input
            type="number"
            value={tons}
            onChange={e => setTons(e.target.value)}
            className="input"
            placeholder="0.00"
            step="0.01"
            min="0"
          />
        </div>

        <div>
          <label className="label">1 tonna narxi (so'm) *</label>
          <input
            type="number"
            value={pricePerTon}
            onChange={e => setPricePerTon(e.target.value)}
            className="input"
            placeholder="900000"
            step="1000"
          />
        </div>
      </div>

      {totalAmount > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700/50 rounded-xl px-4 py-3">
          <p className="text-xs text-primary-600 dark:text-primary-400">Jami summa</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(totalAmount)}</p>
        </div>
      )}

      <div>
        <label className="label">To'lov turi *</label>
        <div className="flex gap-2">
          {PAYMENT_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setPaymentType(type)}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                paymentType === type
                  ? type === 'naqd' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : type === 'nasiya' ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                  : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-100 dark:bg-dark-700 text-slate-600 dark:text-dark-300'
              }`}
            >
              {getPaymentLabel(type)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Izoh</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          className="input min-h-[70px] resize-none"
          placeholder="Qo'shimcha ma'lumot..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
        <button type="submit" className="btn-primary flex-1">Saqlash</button>
      </div>
    </form>
  );
}
