import { Client, Driver, Sale, RawMaterial, RawMaterialTransaction, Expense, Worker, WorkerPayment, Supplier, ExpenseCategoryDef, AppSettings } from '../types';

const today = new Date();
const fmt = (d: Date) => d.toISOString().split('T')[0];
const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

export const DEFAULT_SETTINGS: AppSettings = {
  factoryName: "Farg'ona Rustam Asfalt",
  address: "Farg'ona viloyati, Farg'ona shahri",
  phone: "+998 73 123 45 67",
  defaultPricePerTon: 900000,
  currency: "so'm",
  theme: 'dark',
};

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategoryDef[] = [
  { id: 'ec1', name: 'Ishchilar oyligi', color: '#3b82f6', icon: 'Users' },
  { id: 'ec2', name: 'Haydovchilar', color: '#f97316', icon: 'Truck' },
  { id: 'ec3', name: 'Xomashyo', color: '#f59e0b', icon: 'Package' },
  { id: 'ec4', name: 'Kommunal', color: '#06b6d4', icon: 'Zap' },
  { id: 'ec5', name: 'Texnik xizmat', color: '#a855f7', icon: 'Wrench' },
  { id: 'ec6', name: 'Boshqa', color: '#64748b', icon: 'MoreHorizontal' },
];

export const DEMO_SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: 'Toshkent Bitum Zavodi', phone: '+998712345678', createdAt: daysAgo(60) },
  { id: 'sup2', name: 'Farg\'ona Tog\' Materiallari', phone: '+998736789012', createdAt: daysAgo(50) },
  { id: 'sup3', name: 'Andijon Qum Koni', phone: '+998742345678', createdAt: daysAgo(40) },
];

export const DEMO_CLIENTS: Client[] = [
  { id: 'c1', name: 'Abdullayev Jasur', phone: '+998901234567', address: 'Farg\'ona, Asaka ko\'chasi 12', company: 'Jasur Qurilish MChJ', createdAt: daysAgo(30), totalDebt: 5400000 },
  { id: 'c2', name: 'Toshmatov Bobur', phone: '+998907654321', address: 'Farg\'ona, Mustaqillik 45', createdAt: daysAgo(25), totalDebt: 0 },
  { id: 'c3', name: 'Xoliqov Anvar', phone: '+998909876543', address: 'Marg\'ilon, Markaziy 8', company: 'Anvar Yo\'l Qurilish', createdAt: daysAgo(20), totalDebt: 12000000 },
  { id: 'c4', name: 'Rahimov Sherzod', phone: '+998911234567', address: 'Qo\'qon, Navoi 23', createdAt: daysAgo(15), totalDebt: 0 },
  { id: 'c5', name: 'Yusupov Timur', phone: '+998917654321', address: 'Farg\'ona, Bog\'ishamol 17', company: 'Timur Trans', createdAt: daysAgo(10), totalDebt: 3200000 },
  { id: 'c6', name: 'Mirzayev Otabek', phone: '+998939876543', address: 'Farg\'ona, Kamolot 5', createdAt: daysAgo(8), totalDebt: 0 },
  { id: 'c7', name: 'Hasanov Laziz', phone: '+998941234567', address: 'Marg\'ilon, Ipak yo\'li 33', company: 'Laziz Asfalt', createdAt: daysAgo(5), totalDebt: 8700000 },
  { id: 'c8', name: 'Normatov Behruz', phone: '+998947654321', address: 'Farg\'ona, Tinchlik 19', createdAt: daysAgo(3), totalDebt: 0 },
];

export const DEMO_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Qodirov Dilshod', phone: '+998901112233', carNumber: '40 A 7821 FA', carModel: 'MAZ 6516', createdAt: daysAgo(60) },
  { id: 'd2', name: 'Tursunov Mansur', phone: '+998902223344', carNumber: '40 B 5432 FA', carModel: 'KAMAZ 55111', createdAt: daysAgo(55) },
  { id: 'd3', name: 'Ergashev Sanjar', phone: '+998903334455', carNumber: '40 C 9876 FA', carModel: 'VOLVO FH', createdAt: daysAgo(50) },
  { id: 'd4', name: 'Nazarov Akbar', phone: '+998904445566', carNumber: '40 D 3210 FA', carModel: 'KAMAZ 65115', createdAt: daysAgo(40) },
  { id: 'd5', name: 'Sodiqov Javlon', phone: '+998905556677', carNumber: '40 E 6543 FA', carModel: 'MAZ 5516', createdAt: daysAgo(35) },
];

const generateSales = (): Sale[] => {
  const sales: Sale[] = [];
  const payments: Array<'naqd' | 'nasiya' | 'karta'> = ['naqd', 'nasiya', 'karta'];
  let counter = 1;
  for (let i = 90; i >= 0; i--) {
    const numSales = Math.floor(Math.random() * 6) + 2;
    const date = daysAgo(i);
    for (let j = 0; j < numSales; j++) {
      const client = DEMO_CLIENTS[Math.floor(Math.random() * DEMO_CLIENTS.length)];
      const driver = DEMO_DRIVERS[Math.floor(Math.random() * DEMO_DRIVERS.length)];
      const tons = Math.round((Math.random() * 15 + 5) * 100) / 100;
      const pricePerTon = 850000 + Math.floor(Math.random() * 150000);
      const paymentType = payments[Math.floor(Math.random() * 3)];
      sales.push({
        id: `s${counter++}`, clientId: client.id, clientName: client.name,
        driverId: driver.id, driverName: driver.name, driverCarNumber: driver.carNumber,
        tons, pricePerTon, totalAmount: Math.round(tons * pricePerTon),
        paymentType, note: j % 4 === 0 ? 'Ertangi yetkazib berish' : undefined,
        createdAt: new Date(date + 'T08:00:00').toISOString(), date,
      });
    }
  }
  return sales;
};

export const DEMO_SALES: Sale[] = generateSales();

export const DEMO_RAW_MATERIALS: RawMaterial[] = [
  { id: 'm1', name: 'Bitum', unit: 't', quantity: 45.5, minQuantity: 20 },
  { id: 'm2', name: 'Met pesok', unit: 'm³', quantity: 320, minQuantity: 100 },
  { id: 'm3', name: 'Sheben', unit: 'm³', quantity: 180, minQuantity: 80 },
  { id: 'm4', name: 'Mineral un', unit: 't', quantity: 12, minQuantity: 5 },
  { id: 'm5', name: 'Yonilg\'i (dizel)', unit: 'l', quantity: 2800, minQuantity: 500 },
];

export const DEMO_RAW_TRANSACTIONS: RawMaterialTransaction[] = [
  { id: 'rt1', materialId: 'm1', materialName: 'Bitum', type: 'kirim', quantity: 30, supplierId: 'sup1', supplierName: 'Toshkent Bitum Zavodi', price: 4500000, totalPrice: 135000000, docNumber: 'FAK-2024-001', note: 'Toshkentdan yetkazildi', createdAt: daysAgo(10), date: daysAgo(10) },
  { id: 'rt2', materialId: 'm2', materialName: 'Met pesok', type: 'kirim', quantity: 200, supplierId: 'sup2', supplierName: "Farg'ona Tog' Materiallari", price: 85000, totalPrice: 17000000, docNumber: 'FAK-2024-002', createdAt: daysAgo(8), date: daysAgo(8) },
  { id: 'rt3', materialId: 'm1', materialName: 'Bitum', type: 'chiqim', quantity: 15, note: 'Ishlab chiqarishga', createdAt: daysAgo(5), date: daysAgo(5) },
  { id: 'rt4', materialId: 'm3', materialName: 'Sheben', type: 'kirim', quantity: 100, supplierId: 'sup2', supplierName: "Farg'ona Tog' Materiallari", price: 60000, totalPrice: 6000000, docNumber: 'FAK-2024-003', createdAt: daysAgo(3), date: daysAgo(3) },
  { id: 'rt5', materialId: 'm2', materialName: 'Met pesok', type: 'chiqim', quantity: 50, note: 'Ishlab chiqarishga', createdAt: daysAgo(1), date: daysAgo(1) },
];

export const DEMO_WORKERS: Worker[] = [
  { id: 'w1', name: 'Karimov Sanjar', position: 'Ustaxona boshlig\'i', phone: '+998901111111', startDate: daysAgo(365), monthlySalary: 3500000, createdAt: daysAgo(365) },
  { id: 'w2', name: 'Tursunov Doniyor', position: 'Operator', phone: '+998902222222', startDate: daysAgo(300), monthlySalary: 2800000, createdAt: daysAgo(300) },
  { id: 'w3', name: 'Nazarov Ulmas', position: 'Laborant', phone: '+998903333333', startDate: daysAgo(200), monthlySalary: 2500000, createdAt: daysAgo(200) },
  { id: 'w4', name: 'Xolmatov Baxtiyor', position: 'Qorovul', phone: '+998904444444', startDate: daysAgo(150), monthlySalary: 1800000, createdAt: daysAgo(150) },
  { id: 'w5', name: 'Razzaqov Mirzo', position: 'Elektrik', phone: '+998905555555', startDate: daysAgo(100), monthlySalary: 3000000, createdAt: daysAgo(100) },
];

const generateExpenses = (): Expense[] => {
  const expenses: Expense[] = [];
  const cats = DEFAULT_EXPENSE_CATEGORIES;
  let counter = 1;
  for (let i = 90; i >= 0; i--) {
    if (Math.random() > 0.3) {
      const date = daysAgo(i);
      const numExpenses = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numExpenses; j++) {
        const cat = cats[Math.floor(Math.random() * cats.length)];
        const minAmt = cat.id === 'ec1' ? 2000000 : cat.id === 'ec3' ? 5000000 : 300000;
        const maxAmt = cat.id === 'ec1' ? 8000000 : cat.id === 'ec3' ? 25000000 : 2000000;
        const amount = Math.floor(Math.random() * (maxAmt - minAmt) + minAmt);
        expenses.push({
          id: `e${counter++}`, categoryId: cat.id, categoryName: cat.name,
          amount, description: cat.name,
          recipient: cat.id === 'ec1' ? DEMO_WORKERS[Math.floor(Math.random() * DEMO_WORKERS.length)].name : undefined,
          createdAt: new Date(date + 'T09:00:00').toISOString(), date,
        });
      }
    }
  }
  return expenses;
};

export const DEMO_EXPENSES: Expense[] = generateExpenses();

export const DEMO_WORKER_PAYMENTS: WorkerPayment[] = [
  { id: 'wp1', workerId: 'w1', workerName: 'Karimov Sanjar', month: '2026-03', daysWorked: 26, advance: 1000000, totalEarned: 3500000, totalPaid: 3500000, remaining: 0, createdAt: daysAgo(25) },
  { id: 'wp2', workerId: 'w2', workerName: 'Tursunov Doniyor', month: '2026-03', daysWorked: 25, advance: 500000, totalEarned: 2800000, totalPaid: 2800000, remaining: 0, createdAt: daysAgo(25) },
  { id: 'wp3', workerId: 'w1', workerName: 'Karimov Sanjar', month: '2026-04', daysWorked: 18, advance: 1500000, totalEarned: 3500000, totalPaid: 1500000, remaining: 2000000, createdAt: daysAgo(5) },
];
