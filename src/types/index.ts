export type UserRole = 'admin' | 'operator' | 'kassir' | 'omborchi';

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  company?: string;
  createdAt: string;
  totalDebt: number;
}

export interface ClientPayment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  note?: string;
  createdAt: string;
  date: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  carNumber: string;
  carModel?: string;
  createdAt: string;
}

export type PaymentType = 'naqd' | 'nasiya' | 'karta';

export interface Sale {
  id: string;
  clientId: string;
  clientName: string;
  driverId: string;
  driverName: string;
  driverCarNumber: string;
  tons: number;
  pricePerTon: number;
  totalAmount: number;
  paymentType: PaymentType;
  note?: string;
  createdAt: string;
  date: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  createdAt: string;
}

export interface RawMaterialTransaction {
  id: string;
  materialId: string;
  materialName: string;
  type: 'kirim' | 'chiqim';
  quantity: number;
  supplierId?: string;
  supplierName?: string;
  driverId?: string;
  driverName?: string;
  price?: number;
  totalPrice?: number;
  docNumber?: string;
  note?: string;
  createdAt: string;
  date: string;
}

export type ExpenseCategory = string;

export interface ExpenseCategoryDef {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  recipient?: string;
  createdAt: string;
  date: string;
}

export interface Worker {
  id: string;
  name: string;
  position: string;
  phone: string;
  startDate: string;
  monthlySalary: number;
  createdAt: string;
}

export interface WorkerPayment {
  id: string;
  workerId: string;
  workerName: string;
  month: string;
  daysWorked: number;
  advance: number;
  totalEarned: number;
  totalPaid: number;
  remaining: number;
  note?: string;
  createdAt: string;
}

export interface AppSettings {
  factoryName: string;
  address: string;
  phone: string;
  defaultPricePerTon: number;
  currency: string;
  theme: 'dark' | 'light';
}

export interface ChartDataPoint {
  date: string;
  sotuv: number;
  xarajat: number;
  tonna: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  totalAmount: number;
  totalTons: number;
  salesCount: number;
}
