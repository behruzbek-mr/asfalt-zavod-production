import { PaymentType, ExpenseCategory } from '../types';

export const formatCurrency = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} mlrd so'm`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)} mln so'm`;
  }
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('uz-UZ').format(num);
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTons = (tons: number): string => {
  return `${tons.toFixed(2)} t`;
};

export const getPaymentBadgeClass = (type: PaymentType): string => {
  switch (type) {
    case 'naqd': return 'badge-naqd';
    case 'nasiya': return 'badge-nasiya';
    case 'karta': return 'badge-karta';
  }
};

export const getPaymentLabel = (type: PaymentType): string => {
  switch (type) {
    case 'naqd': return 'Naqd';
    case 'nasiya': return 'Nasiya';
    case 'karta': return 'Karta';
  }
};

export const getExpenseCategoryLabel = (cat: ExpenseCategory): string => {
  const labels: Record<ExpenseCategory, string> = {
    maosh: 'Maosh',
    yoqilgi: 'Yonilg\'i',
    tamirlash: 'Ta\'mirlash',
    kommunal: 'Kommunal',
    xomashyo: 'Xomashyo',
    boshqa: 'Boshqa',
  };
  return labels[cat];
};

export const getExpenseCategoryColor = (cat: ExpenseCategory): string => {
  const colors: Record<ExpenseCategory, string> = {
    maosh: 'bg-blue-500',
    yoqilgi: 'bg-orange-500',
    tamirlash: 'bg-purple-500',
    kommunal: 'bg-cyan-500',
    xomashyo: 'bg-amber-500',
    boshqa: 'bg-slate-500',
  };
  return colors[cat];
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getDateNDaysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export const exportToCSV = (data: Record<string, unknown>[], filename: string): void => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    )
  ];
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
