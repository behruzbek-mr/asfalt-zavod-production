import { create } from 'zustand';
import { Client, Driver, Sale, RawMaterial, RawMaterialTransaction, Expense, Worker, WorkerPayment, Supplier, ExpenseCategoryDef, AppSettings, ClientPayment } from '../types';

const API_URL = '/api';

const apiFetch = async (endpoint: string, method = 'GET', body?: any) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('API Error');
  return res.json();
};

interface AppState {
  isLoaded: boolean;
  clients: Client[];
  drivers: Driver[];
  sales: Sale[];
  rawMaterials: RawMaterial[];
  rawTransactions: RawMaterialTransaction[];
  expenses: Expense[];
  expenseCategories: ExpenseCategoryDef[];
  workers: Worker[];
  workerPayments: WorkerPayment[];
  suppliers: Supplier[];
  clientPayments: ClientPayment[];
  settings: AppSettings | null;

  fetchInitialData: () => Promise<void>;

  addClient: (c: Client) => Promise<void>;
  updateClient: (id: string, u: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addDriver: (d: Driver) => Promise<void>;
  updateDriver: (id: string, u: Partial<Driver>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;

  addSale: (s: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;

  addRawMaterial: (m: RawMaterial) => Promise<void>;
  updateRawMaterial: (id: string, u: Partial<RawMaterial>) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
  addRawTransaction: (t: RawMaterialTransaction) => Promise<void>;

  addExpense: (e: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addExpenseCategory: (c: ExpenseCategoryDef) => Promise<void>;
  deleteExpenseCategory: (id: string) => Promise<void>;

  addWorker: (w: Worker) => Promise<void>;
  updateWorker: (id: string, u: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  addWorkerPayment: (p: WorkerPayment) => Promise<void>;
  deleteWorkerPayment: (id: string) => Promise<void>;

  addSupplier: (s: Supplier) => Promise<void>;

  addClientPayment: (p: ClientPayment) => Promise<void>;
  deleteClientPayment: (id: string) => Promise<void>;

  updateSettings: (s: Partial<AppSettings>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  isLoaded: false,
  clients: [],
  drivers: [],
  sales: [],
  rawMaterials: [],
  rawTransactions: [],
  expenses: [],
  expenseCategories: [],
  workers: [],
  workerPayments: [],
  suppliers: [],
  clientPayments: [],
  settings: null,

  fetchInitialData: async () => {
    try {
      const [clients, drivers, sales, rawMaterials, rawTransactions, expenses, expenseCategories, workers, workerPayments, suppliers, clientPayments, settings] = await Promise.all([
        apiFetch('/clients'), apiFetch('/drivers'), apiFetch('/sales'),
        apiFetch('/raw-materials'), apiFetch('/raw-transactions'),
        apiFetch('/expenses'), apiFetch('/expense-categories'),
        apiFetch('/workers'), apiFetch('/worker-payments'),
        apiFetch('/suppliers'), apiFetch('/client-payments'),
        apiFetch('/settings')
      ]);
      set({ clients, drivers, sales, rawMaterials, rawTransactions, expenses, expenseCategories, workers, workerPayments, suppliers, clientPayments, settings, isLoaded: true });
    } catch (e) {
      console.error("Failed to fetch initial data", e);
    }
  },

  addClient: async (c) => { const res = await apiFetch('/clients', 'POST', c); set(s => ({ clients: [...s.clients, res] })); },
  updateClient: async (id, u) => { const res = await apiFetch(`/clients/${id}`, 'PUT', u); set(s => ({ clients: s.clients.map(x => x.id === id ? res : x) })); },
  deleteClient: async (id) => { await apiFetch(`/clients/${id}`, 'DELETE'); set(s => ({ clients: s.clients.filter(x => x.id !== id) })); },

  addDriver: async (d) => { const res = await apiFetch('/drivers', 'POST', d); set(s => ({ drivers: [...s.drivers, res] })); },
  updateDriver: async (id, u) => { const res = await apiFetch(`/drivers/${id}`, 'PUT', u); set(s => ({ drivers: s.drivers.map(x => x.id === id ? res : x) })); },
  deleteDriver: async (id) => { await apiFetch(`/drivers/${id}`, 'DELETE'); set(s => ({ drivers: s.drivers.filter(x => x.id !== id) })); },

  addSale: async (sale) => {
    const res = await apiFetch('/sales', 'POST', sale);
    set(s => {
      const sales = [res, ...s.sales];
      let clients = s.clients;
      if (sale.paymentType === 'nasiya') {
        clients = s.clients.map(c => c.id === sale.clientId ? { ...c, totalDebt: c.totalDebt + sale.totalAmount } : c);
      }
      return { sales, clients };
    });
  },
  deleteSale: async (id) => { await apiFetch(`/sales/${id}`, 'DELETE'); set(s => ({ sales: s.sales.filter(x => x.id !== id) })); },

  addRawMaterial: async (m) => { const res = await apiFetch('/raw-materials', 'POST', m); set(s => ({ rawMaterials: [...s.rawMaterials, res] })); },
  updateRawMaterial: async (id, u) => { const res = await apiFetch(`/raw-materials/${id}`, 'PUT', u); set(s => ({ rawMaterials: s.rawMaterials.map(x => x.id === id ? res : x) })); },
  deleteRawMaterial: async (id) => { await apiFetch(`/raw-materials/${id}`, 'DELETE'); set(s => ({ rawMaterials: s.rawMaterials.filter(x => x.id !== id) })); },
  
  addRawTransaction: async (t) => {
    const res = await apiFetch('/raw-transactions', 'POST', t);
    set(s => {
      const rawTransactions = [res, ...s.rawTransactions];
      const rawMaterials = s.rawMaterials.map(m => {
        if (m.id !== t.materialId) return m;
        const qty = t.type === 'kirim' ? m.quantity + t.quantity : Math.max(0, m.quantity - t.quantity);
        return { ...m, quantity: qty };
      });
      return { rawTransactions, rawMaterials };
    });
  },

  addExpense: async (e) => { const res = await apiFetch('/expenses', 'POST', e); set(s => ({ expenses: [res, ...s.expenses] })); },
  deleteExpense: async (id) => { await apiFetch(`/expenses/${id}`, 'DELETE'); set(s => ({ expenses: s.expenses.filter(x => x.id !== id) })); },
  addExpenseCategory: async (c) => { const res = await apiFetch('/expense-categories', 'POST', c); set(s => ({ expenseCategories: [...s.expenseCategories, res] })); },
  deleteExpenseCategory: async (id) => { await apiFetch(`/expense-categories/${id}`, 'DELETE'); set(s => ({ expenseCategories: s.expenseCategories.filter(x => x.id !== id) })); },

  addWorker: async (w) => { const res = await apiFetch('/workers', 'POST', w); set(s => ({ workers: [...s.workers, res] })); },
  updateWorker: async (id, u) => { const res = await apiFetch(`/workers/${id}`, 'PUT', u); set(s => ({ workers: s.workers.map(x => x.id === id ? res : x) })); },
  deleteWorker: async (id) => { await apiFetch(`/workers/${id}`, 'DELETE'); set(s => ({ workers: s.workers.filter(x => x.id !== id) })); },
  
  addWorkerPayment: async (p) => { const res = await apiFetch('/worker-payments', 'POST', p); set(s => ({ workerPayments: [res, ...s.workerPayments] })); },
  deleteWorkerPayment: async (id) => { await apiFetch(`/worker-payments/${id}`, 'DELETE'); set(s => ({ workerPayments: s.workerPayments.filter(x => x.id !== id) })); },

  addSupplier: async (sup) => { const res = await apiFetch('/suppliers', 'POST', sup); set(s => ({ suppliers: [...s.suppliers, res] })); },

  addClientPayment: async (p) => {
    const res = await apiFetch('/client-payments', 'POST', p);
    set(s => {
      const clientPayments = [res, ...s.clientPayments];
      const clients = s.clients.map(c => c.id === p.clientId ? { ...c, totalDebt: Math.max(0, c.totalDebt - p.amount) } : c);
      return { clientPayments, clients };
    });
  },
  deleteClientPayment: async (id) => { await apiFetch(`/client-payments/${id}`, 'DELETE'); set(s => ({ clientPayments: s.clientPayments.filter(x => x.id !== id) })); },

  updateSettings: async (u) => { const res = await apiFetch('/settings', 'PUT', u); set({ settings: res }); },
}));
