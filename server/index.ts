import express from 'express';
import cors from 'cors';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error("❌ Xatolik yuz berdi:", err);
    res.status(500).json({ error: err.message || "Tizim xatoligi yuz berdi" });
  });
};

// ========== AUTH & USERS ==========
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findFirst({
    where: { username, password, isActive: true }
  });
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } else {
    res.status(401).json({ error: "Login yoki parol noto'g'ri" });
  }
}));

app.get('/api/users', asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users.map(({ password: _, ...u }) => u));
}));

app.post('/api/users', asyncHandler(async (req, res) => {
  const user = await prisma.user.create({ data: req.body });
  const { password: _, ...u } = user;
  res.json(u);
}));

app.put('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body
  });
  const { password: _, ...u } = user;
  res.json(u);
}));

app.delete('/api/users/:id', asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

// ========== CLIENTS ==========
app.get('/api/clients', asyncHandler(async (req, res) => {
  const data = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
}));
app.post('/api/clients', asyncHandler(async (req, res) => {
  const { name, phone, address, company, totalDebt } = req.body;
  const data = await prisma.client.create({
    data: { name, phone, address: address || null, company: company || null, totalDebt: totalDebt || 0 }
  });
  res.json(data);
}));
app.put('/api/clients/:id', asyncHandler(async (req, res) => {
  const { name, phone, address, company, totalDebt } = req.body;
  const data = await prisma.client.update({
    where: { id: req.params.id },
    data: { name, phone, address: address || null, company: company || null, totalDebt: totalDebt || 0 }
  });
  res.json(data);
}));
app.delete('/api/clients/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  // Cascade: avval bog'liq sotuvlarni o'chiramiz (nasiya qarzlarini ham hisobga olamiz)
  await prisma.clientPayment.deleteMany({ where: { clientId: id } });
  await prisma.sale.deleteMany({ where: { clientId: id } });
  await prisma.client.delete({ where: { id } });
  res.json({ ok: true });
}));

// ========== CLIENT PAYMENTS ==========
app.get('/api/client-payments', asyncHandler(async (req, res) => {
  const data = await prisma.clientPayment.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
}));
app.post('/api/client-payments', asyncHandler(async (req, res) => {
  const { clientId, amount, note, date, clientName } = req.body;
  const payment = await prisma.clientPayment.create({ data: { clientId, amount, note, date, clientName } });
  await prisma.client.update({
    where: { id: clientId },
    data: { totalDebt: { decrement: amount } },
  });
  res.json(payment);
}));
app.delete('/api/client-payments/:id', asyncHandler(async (req, res) => {
  const payment = await prisma.clientPayment.findUnique({ where: { id: req.params.id } });
  if (payment) {
    await prisma.client.update({
      where: { id: payment.clientId },
      data: { totalDebt: { increment: payment.amount } },
    });
    await prisma.clientPayment.delete({ where: { id: req.params.id } });
  }
  res.json({ ok: true });
}));

// ========== DRIVERS ==========
app.get('/api/drivers', asyncHandler(async (req, res) => {
  const data = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
}));
app.post('/api/drivers', asyncHandler(async (req, res) => {
  const { name, phone, carNumber, carModel } = req.body;
  const data = await prisma.driver.create({
    data: { name, phone: phone || '', carNumber, carModel: carModel || null }
  });
  res.json(data);
}));
app.put('/api/drivers/:id', asyncHandler(async (req, res) => {
  const { name, phone, carNumber, carModel } = req.body;
  const data = await prisma.driver.update({
    where: { id: req.params.id },
    data: { name, phone: phone || '', carNumber, carModel: carModel || null }
  });
  res.json(data);
}));
app.delete('/api/drivers/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  // Cascade: bog'liq xomashyo tranzaksiyalaridan driver referansini olib tashlaymiz (nullable field)
  await prisma.rawMaterialTransaction.updateMany({ where: { driverId: id }, data: { driverId: null, driverName: null } });
  // Bog'liq sotuvlarni o'chiramiz (driverId required field)
  await prisma.sale.deleteMany({ where: { driverId: id } });
  await prisma.driver.delete({ where: { id } });
  res.json({ ok: true });
}));

// ========== SALES ==========
app.get('/api/sales', asyncHandler(async (req, res) => {
  const data = await prisma.sale.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
}));
app.post('/api/sales', asyncHandler(async (req, res) => {
  const { clientId, clientName, driverId, driverName, driverCarNumber, tons, pricePerTon, totalAmount, paymentType, note, date } = req.body;
  const sale = await prisma.sale.create({
    data: { clientId, clientName, driverId, driverName, driverCarNumber, tons, pricePerTon, totalAmount, paymentType, note, date },
  });
  if (paymentType === 'nasiya') {
    await prisma.client.update({
      where: { id: clientId },
      data: { totalDebt: { increment: totalAmount } },
    });
  }
  res.json(sale);
}));
app.delete('/api/sales/:id', asyncHandler(async (req, res) => {
  const sale = await prisma.sale.findUnique({ where: { id: req.params.id } });
  if (sale && sale.paymentType === 'nasiya') {
    await prisma.client.update({
      where: { id: sale.clientId },
      data: { totalDebt: { decrement: sale.totalAmount } },
    });
  }
  await prisma.sale.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

// ========== RAW MATERIALS ==========
app.get('/api/raw-materials', asyncHandler(async (req, res) => {
  const data = await prisma.rawMaterial.findMany();
  res.json(data);
}));
app.post('/api/raw-materials', asyncHandler(async (req, res) => {
  const data = await prisma.rawMaterial.create({ data: req.body });
  res.json(data);
}));
app.put('/api/raw-materials/:id', asyncHandler(async (req, res) => {
  const data = await prisma.rawMaterial.update({ where: { id: req.params.id }, data: req.body });
  res.json(data);
}));
app.delete('/api/raw-materials/:id', asyncHandler(async (req, res) => {
  await prisma.rawMaterial.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

// ========== RAW TRANSACTIONS ==========
app.get('/api/raw-transactions', asyncHandler(async (req, res) => {
  const data = await prisma.rawMaterialTransaction.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
}));
app.post('/api/raw-transactions', asyncHandler(async (req, res) => {
  const { materialId, materialName, type, quantity, price, totalPrice, docNumber, note, date, supplierId, supplierName, driverId, driverName } = req.body;
  const tx = await prisma.rawMaterialTransaction.create({
    data: { materialId, materialName, type, quantity, price, totalPrice, docNumber, note, date, supplierId, supplierName, driverId, driverName },
  });
  const delta = type === 'kirim' ? quantity : -quantity;
  await prisma.rawMaterial.update({
    where: { id: materialId },
    data: { quantity: { increment: delta } },
  });
  res.json(tx);
}));

// ========== SUPPLIERS ==========
app.get('/api/suppliers', asyncHandler(async (req, res) => {
  const data = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
}));
app.post('/api/suppliers', asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const data = await prisma.supplier.create({ data: { name, phone: phone || null } });
  res.json(data);
}));
app.delete('/api/suppliers/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  // Cascade: tranzaksiyalardan supplier referansini olib tashlaymiz
  await prisma.rawMaterialTransaction.updateMany({ where: { supplierId: id }, data: { supplierId: null, supplierName: null } });
  await prisma.supplier.delete({ where: { id } });
  res.json({ ok: true });
}));

// ========== EXPENSES ==========
app.get('/api/expenses', asyncHandler(async (req, res) => {
  const data = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
}));
app.post('/api/expenses', asyncHandler(async (req, res) => {
  const { categoryId, categoryName, amount, description, recipient, date } = req.body;
  const data = await prisma.expense.create({
    data: { categoryId, categoryName, amount, description: description || '', recipient: recipient || null, date: date || new Date().toISOString().slice(0, 10) }
  });
  res.json(data);
}));
app.delete('/api/expenses/:id', asyncHandler(async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

// ========== EXPENSE CATEGORIES ==========
app.get('/api/expense-categories', asyncHandler(async (req, res) => {
  const data = await prisma.expenseCategoryDef.findMany();
  res.json(data);
}));
app.post('/api/expense-categories', asyncHandler(async (req, res) => {
  const { name, color, icon } = req.body;
  const data = await prisma.expenseCategoryDef.create({ data: { name, color: color || '#6366f1', icon: icon || 'Tag' } });
  res.json(data);
}));
app.delete('/api/expense-categories/:id', asyncHandler(async (req, res) => {
  await prisma.expenseCategoryDef.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

// ========== WORKERS ==========
app.get('/api/workers', asyncHandler(async (req, res) => {
  const data = await prisma.worker.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
}));
app.post('/api/workers', asyncHandler(async (req, res) => {
  const { name, position, phone, startDate, monthlySalary } = req.body;
  const data = await prisma.worker.create({
    data: { name, position: position || '', phone: phone || '', startDate: startDate || new Date().toISOString().slice(0, 10), monthlySalary: monthlySalary || 0 }
  });
  res.json(data);
}));
app.put('/api/workers/:id', asyncHandler(async (req, res) => {
  const { name, position, phone, startDate, monthlySalary } = req.body;
  const data = await prisma.worker.update({
    where: { id: req.params.id },
    data: { name, position: position || '', phone: phone || '', startDate, monthlySalary: monthlySalary || 0 }
  });
  res.json(data);
}));
app.delete('/api/workers/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  // Cascade: avval ishchi to'lovlarini o'chiramiz
  await prisma.workerPayment.deleteMany({ where: { workerId: id } });
  await prisma.worker.delete({ where: { id } });
  res.json({ ok: true });
}));

// ========== WORKER PAYMENTS ==========
app.get('/api/worker-payments', asyncHandler(async (req, res) => {
  const data = await prisma.workerPayment.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
}));
app.post('/api/worker-payments', asyncHandler(async (req, res) => {
  const { workerId, workerName, month, daysWorked, advance, totalEarned, totalPaid, remaining, note } = req.body;
  const data = await prisma.workerPayment.create({
    data: { workerId, workerName, month, daysWorked: daysWorked || 0, advance: advance || 0, totalEarned: totalEarned || 0, totalPaid: totalPaid || 0, remaining: remaining || 0, note: note || null }
  });
  res.json(data);
}));
app.delete('/api/worker-payments/:id', asyncHandler(async (req, res) => {
  await prisma.workerPayment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
}));

// ========== SETTINGS ==========
app.get('/api/settings', asyncHandler(async (req, res) => {
  let settings = await prisma.appSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        id: 'default',
        factoryName: "Farg'ona Rustam Asfalt",
        address: "Farg'ona viloyati",
        phone: '+998 90 000 00 00',
        defaultPricePerTon: 950000,
        currency: 'UZS',
        theme: 'light',
      },
    });
  }
  res.json(settings);
}));
app.put('/api/settings', asyncHandler(async (req, res) => {
  const data = await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: req.body,
    create: { id: 'default', ...req.body },
  });
  res.json(data);
}));

// ========== SPA FALLBACK & STATIC SERVING ==========
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ========== START & SEED ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`✅ Backend server ishga tushdi: http://localhost:${PORT}`);
  
  // Create admin if not exists
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      await prisma.user.create({
        data: {
          username: 'admin',
          password: 'admin',
          fullName: 'Admin',
          role: 'admin'
        }
      });
      console.log('✅ Admin user yaratildi: admin / admin');
    }
  } catch (err) {
    console.error('Failed to seed admin user:', err);
  }
});
