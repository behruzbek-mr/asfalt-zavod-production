import { useState } from 'react';
import Modal from '../ui/Modal';
import { SaleForm } from '../sales/SaleForm';
import { TransactionForm } from '../warehouse/TransactionForm';
import { useStore } from '../../store';
import { ShoppingCart, Package, ArrowLeft } from 'lucide-react';

export default function GlobalAddModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState<'menu' | 'sale' | 'income_select' | 'income_form'>('menu');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const { rawMaterials } = useStore();

  const handleClose = () => {
    setStep('menu');
    setSelectedMaterialId(null);
    onClose();
  };

  const selectedMaterial = rawMaterials.find(m => m.id === selectedMaterialId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 'menu' ? 'Qo\'shish' : 'Orqaga'} size="md">
      <div className="space-y-4">
        {step !== 'menu' && (
          <button onClick={() => setStep(step === 'income_form' ? 'income_select' : 'menu')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-dark-900 dark:hover:text-white pb-3 mb-3 border-b border-slate-100 dark:border-dark-700 w-full transition-colors">
            <ArrowLeft className="w-4 h-4" /> Orqaga qaytish
          </button>
        )}

        {step === 'menu' && (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setStep('sale')} className="flex flex-col items-center justify-center gap-4 p-6 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-3xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all transform hover:scale-105 shadow-sm">
              <ShoppingCart className="w-12 h-12" />
              <span className="font-bold text-sm md:text-base">Sotuv qo'shish</span>
            </button>
            <button onClick={() => setStep('income_select')} className="flex flex-col items-center justify-center gap-4 p-6 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-3xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all transform hover:scale-105 shadow-sm">
              <Package className="w-12 h-12" />
              <span className="font-bold text-sm md:text-base">Xomashyo kirim</span>
            </button>
          </div>
        )}

        {step === 'sale' && (
          <SaleForm onClose={handleClose} />
        )}

        {step === 'income_select' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 dark:text-dark-300 mb-2">Qaysi xomashyodan kirim qilyapsiz?</p>
            {rawMaterials.map(m => (
              <button 
                key={m.id} 
                onClick={() => { setSelectedMaterialId(m.id); setStep('income_form'); }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-dark-700/50 hover:bg-slate-100 dark:hover:bg-dark-600 rounded-2xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-dark-500"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center rounded-xl">
                    <Package className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="font-bold text-dark-900 dark:text-white text-left">{m.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Qoldiq</span>
                  <span className="text-sm font-bold text-dark-900 dark:text-white">{m.quantity} {m.unit}</span>
                </div>
              </button>
            ))}
            {rawMaterials.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Xomashyo turlari mavjud emas</p>
              </div>
            )}
          </div>
        )}

        {step === 'income_form' && selectedMaterial && (
          <TransactionForm material={selectedMaterial} type="kirim" onClose={handleClose} />
        )}
      </div>
    </Modal>
  );
}
