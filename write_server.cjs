const fs = require('fs');

const content = `import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ========== AUTH & USERS ==========
app.post('/api/auth/login', async (req, res) => {
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
});

app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users.map(({ password: _, ...u }) => u));
});

app.post('/api/users', async (req, res) => {
  const user = await prisma.user.create({ data: req.body });
  const { password: _, ...u } = user;
  res.json(u);
});

app.put('/api/users/:id', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body
  });
  const { password: _, ...u } = user;
  res.json(u);
});

app.delete('/api/users/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ========== CLIENTS ==========
app.get('/api/clients', async (req, res) => {
  const data = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
app.post('/api/clients', async (req, res) => {
  const data = await prisma.client.create({ data: req.body });
  res.json(data);
});
app.put('/api/clients/:id', async (req, res) => {
  const data = await prisma.client.update({ where: { id: req.params.id }, data: req.body });
  res.json(data);
});
app.delete('/api/clients/:id', async (req, res) => {
  await prisma.client.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ========== CLIENT PAYMENTS ==========
app.get('/api/client-payments', async (req, res) => {
  const data = await prisma.clientPayment.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
app.post('/api/client-payments', async (req, res) => {
  const { clientId, amount, note, date, clientName } = req.body;
  const payment = await prisma.clientPayment.create({ data: { clientId, amount, note, date, clientName } });
  await prisma.client.update({
    where: { id: clientId },
    data: { totalDebt: { decrement: amount } },
  });
  res.json(payment);
});
app.delete('/api/client-payments/:id', async (req, res) => {
  const payment = await prisma.clientPayment.findUnique({ where: { id: req.params.id } });
  if (payment) {
    await prisma.client.update({
      where: { id: payment.clientId },
      data: { totalDebt: { increment: payment.amount } },
    });
    await prisma.clientPayment.delete({ where: { id: req.params.id } });
  }
  res.json({ ok: true });
});

// ========== DRIVERS ==========
app.get('/api/drivers', async (req, res) => {
  const data = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
app.post('/api/drivers', async (req, res) => {
  const data = await prisma.driver.create({ data: req.body });
  res.json(data);
});
app.put('/api/drivers/:id', async (req, res) => {
  const data = await prisma.driver.update({ where: { id: req.params.id }, data: req.body });
  res.json(data);
});
app.delete('/api/drivers/:id', async (req, res) => {
  await prisma.driver.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ========== SALES ==========
app.get('/api/sales', async (req, res) => {
  const data = await prisma.sale.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
app.post('/api/sales', async (req, res) => {
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
});
app.delete('/api/sales/:id', async (req, res) => {
  const sale = await prisma.sale.findUnique({ where: { id: req.params.id } });
  if (sale && sale.paymentType === 'nasiya') {
    await prisma.client.update({
      where: { id: sale.clientId },
      data: { totalDebt: { decrement: sale.totalAmount } },
    });
  }
  await prisma.sale.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ========== RAW MATERIALS ==========
app.get('/api/raw-materials', async (req, res) => {
  const data = await prisma.rawMaterial.findMany();
  res.json(data);
});
app.post('/api/raw-materials', async (req, res) => {
  const data = await prisma.rawMaterial.create({ data: req.body });
  res.json(data);
});
app.put('/api/raw-materials/:id', async (req, res) => {
  const data = await prisma.rawMaterial.update({ where: { id: req.params.id }, data: req.body });
  res.json(data);
});
app.delete('/api/raw-materials/:id', async (req, res) => {
  await prisma.rawMaterial.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ========== RAW TRANSACTIONS ==========
app.get('/api/raw-transactions', async (req, res) => {
  const data = await prisma.rawMaterialTransaction.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
app.post('/api/raw-transactions', async (req, res) => {
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
});

// ========== SUPPLIERS ==========
app.get('/api/suppliers', async (req, res) => {
  const data = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
app.post('/api/suppliers', async (req, res) => {
  const data = await prisma.supplier.create({ data: req.body });
  res.json(data);
});

// ========== EXPENSES ==========
app.get('/api/expenses', async (req, res) => {
  const data = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
app.post('/api/expenses', async (req, res) => {
  const data = await prisma.expense.create({ data: req.body });
  res.json(data);
});
app.delete('/api/expenses/:id', async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ========== EXPENSE CATEGORIES ==========
app.get('/api/expense-categories', async (req, res) => {
  const data = await prisma.expenseCategoryDef.findMany();
  res.json(data);
});
app.post('/api/expense-categories', async (req, res) => {
  const data = await prisma.expenseCategoryDef.create({ data: req.body });
  res.json(data);
});
app.delete('/api/expense-categories/:id', async (req, res) => {
  await prisma.expenseCategoryDef.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ========== WORKERS ==========
app.get('/api/workers', async (req, res) => {
  const data = await prisma.worker.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
app.post('/api/workers', async (req, res) => {
  const data = await prisma.worker.create({ data: req.body });
  res.json(data);
});
app.put('/api/workers/:id', async (req, res) => {
  const data = await prisma.worker.update({ where: { id: req.params.id }, data: req.body });
  res.json(data);
});
app.delete('/api/workers/:id', async (req, res) => {
  await prisma.worker.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ========== WORKER PAYMENTS ==========
app.get('/api/worker-payments', async (req, res) => {
  const data = await prisma.workerPayment.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(data);
});
app.post('/api/worker-payments', async (req, res) => {
  const data = await prisma.workerPayment.create({ data: req.body });
  res.json(data);
});
app.delete('/api/worker-payments/:id', async (req, res) => {
  await prisma.workerPayment.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ========== SETTINGS ==========
app.get('/api/settings', async (req, res) => {
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
});
app.put('/api/settings', async (req, res) => {
  const data = await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: req.body,
    create: { id: 'default', ...req.body },
  });
  res.json(data);
});

// ========== START & SEED ==========
const PORT = 3000;
app.listen(PORT, async () => {
  console.log(\`✅ Backend server ishga tushdi: http://localhost:\${PORT}\`);
  
  // Create admin if not exists
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
});
`;

fs.writeFileSync('C:\\AsfaltProject\\server\\index.ts', content, 'utf8');
console.log('Done');
