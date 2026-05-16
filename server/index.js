import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const distPath = path.join(__dirname, '../dist');

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', distExists: fs.existsSync(distPath) });
});

// AUTH
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findFirst({ where: { username, password, isActive: true } });
    if (user) {
      const { password: _, ...u } = user;
      res.json(u);
    } else {
      res.status(401).json({ error: "Login yoki parol noto'g'ri" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// USERS
app.get('/api/users', async (req, res) => {
  try { res.json((await prisma.user.findMany()).map(({ password: _, ...u }) => u)); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/users', async (req, res) => {
  try { const u = await prisma.user.create({ data: req.body }); const { password: _, ...r } = u; res.json(r); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/users/:id', async (req, res) => {
  try { const u = await prisma.user.update({ where: { id: req.params.id }, data: req.body }); const { password: _, ...r } = u; res.json(r); } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/users/:id', async (req, res) => {
  try { await prisma.user.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

// CLIENTS
app.get('/api/clients', async (req, res) => { try { res.json(await prisma.client.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/clients', async (req, res) => { try { res.json(await prisma.client.create({ data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.put('/api/clients/:id', async (req, res) => { try { res.json(await prisma.client.update({ where: { id: req.params.id }, data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete('/api/clients/:id', async (req, res) => { try { await prisma.client.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// CLIENT PAYMENTS
app.get('/api/client-payments', async (req, res) => { try { res.json(await prisma.clientPayment.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/client-payments', async (req, res) => {
  try {
    const { clientId, amount, note, date, clientName } = req.body;
    const p = await prisma.clientPayment.create({ data: { clientId, amount, note, date, clientName } });
    await prisma.client.update({ where: { id: clientId }, data: { totalDebt: { decrement: amount } } });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/client-payments/:id', async (req, res) => {
  try {
    const p = await prisma.clientPayment.findUnique({ where: { id: req.params.id } });
    if (p) { await prisma.client.update({ where: { id: p.clientId }, data: { totalDebt: { increment: p.amount } } }); await prisma.clientPayment.delete({ where: { id: req.params.id } }); }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DRIVERS
app.get('/api/drivers', async (req, res) => { try { res.json(await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/drivers', async (req, res) => { try { res.json(await prisma.driver.create({ data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.put('/api/drivers/:id', async (req, res) => { try { res.json(await prisma.driver.update({ where: { id: req.params.id }, data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete('/api/drivers/:id', async (req, res) => { try { await prisma.driver.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// SALES
app.get('/api/sales', async (req, res) => { try { res.json(await prisma.sale.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/sales', async (req, res) => {
  try {
    const { clientId, clientName, driverId, driverName, driverCarNumber, tons, pricePerTon, totalAmount, paymentType, note, date } = req.body;
    const sale = await prisma.sale.create({ data: { clientId, clientName, driverId, driverName, driverCarNumber, tons, pricePerTon, totalAmount, paymentType, note, date } });
    if (paymentType === 'nasiya') await prisma.client.update({ where: { id: clientId }, data: { totalDebt: { increment: totalAmount } } });
    res.json(sale);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/sales/:id', async (req, res) => {
  try {
    const s = await prisma.sale.findUnique({ where: { id: req.params.id } });
    if (s && s.paymentType === 'nasiya') await prisma.client.update({ where: { id: s.clientId }, data: { totalDebt: { decrement: s.totalAmount } } });
    await prisma.sale.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// RAW MATERIALS
app.get('/api/raw-materials', async (req, res) => { try { res.json(await prisma.rawMaterial.findMany()); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/raw-materials', async (req, res) => { try { res.json(await prisma.rawMaterial.create({ data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.put('/api/raw-materials/:id', async (req, res) => { try { res.json(await prisma.rawMaterial.update({ where: { id: req.params.id }, data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete('/api/raw-materials/:id', async (req, res) => { try { await prisma.rawMaterial.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// RAW TRANSACTIONS
app.get('/api/raw-transactions', async (req, res) => { try { res.json(await prisma.rawMaterialTransaction.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/raw-transactions', async (req, res) => {
  try {
    const { materialId, materialName, type, quantity, price, totalPrice, docNumber, note, date, supplierId, supplierName, driverId, driverName } = req.body;
    const tx = await prisma.rawMaterialTransaction.create({ data: { materialId, materialName, type, quantity, price, totalPrice, docNumber, note, date, supplierId, supplierName, driverId, driverName } });
    await prisma.rawMaterial.update({ where: { id: materialId }, data: { quantity: { increment: type === 'kirim' ? quantity : -quantity } } });
    res.json(tx);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// SUPPLIERS
app.get('/api/suppliers', async (req, res) => { try { res.json(await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/suppliers', async (req, res) => { try { res.json(await prisma.supplier.create({ data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });

// EXPENSES
app.get('/api/expenses', async (req, res) => { try { res.json(await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/expenses', async (req, res) => { try { res.json(await prisma.expense.create({ data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete('/api/expenses/:id', async (req, res) => { try { await prisma.expense.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// EXPENSE CATEGORIES
app.get('/api/expense-categories', async (req, res) => { try { res.json(await prisma.expenseCategoryDef.findMany()); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/expense-categories', async (req, res) => { try { res.json(await prisma.expenseCategoryDef.create({ data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete('/api/expense-categories/:id', async (req, res) => { try { await prisma.expenseCategoryDef.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// WORKERS
app.get('/api/workers', async (req, res) => { try { res.json(await prisma.worker.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/workers', async (req, res) => { try { res.json(await prisma.worker.create({ data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.put('/api/workers/:id', async (req, res) => { try { res.json(await prisma.worker.update({ where: { id: req.params.id }, data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete('/api/workers/:id', async (req, res) => { try { await prisma.worker.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// WORKER PAYMENTS
app.get('/api/worker-payments', async (req, res) => { try { res.json(await prisma.workerPayment.findMany({ orderBy: { createdAt: 'desc' } })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/worker-payments', async (req, res) => { try { res.json(await prisma.workerPayment.create({ data: req.body })); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete('/api/worker-payments/:id', async (req, res) => { try { await prisma.workerPayment.delete({ where: { id: req.params.id } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); } });

// SETTINGS
app.get('/api/settings', async (req, res) => {
  try {
    let s = await prisma.appSettings.findUnique({ where: { id: 'default' } });
    if (!s) s = await prisma.appSettings.create({ data: { id: 'default', factoryName: "Farg'ona Rustam Asfalt", address: "Farg'ona viloyati", phone: '+998 90 000 00 00', defaultPricePerTon: 950000, currency: 'UZS' } });
    res.json(s);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/settings', async (req, res) => {
  try { res.json(await prisma.appSettings.upsert({ where: { id: 'default' }, update: req.body, create: { id: 'default', ...req.body } })); } catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA FALLBACK
app.use(express.static(distPath));
app.get('*', (req, res) => {
  const idx = path.join(distPath, 'index.html');
  if (fs.existsSync(idx)) res.sendFile(idx);
  else res.status(404).send('dist/index.html not found');
});

// START
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`✅ Server: http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    const existing = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (!existing) {
      await prisma.user.create({ data: { username: 'admin', password: 'admin', fullName: 'Administrator', role: 'admin', isActive: true } });
      console.log('✅ Admin yaratildi: admin / admin');
    } else {
      console.log(`✅ Admin mavjud. Parol: ${existing.password}`);
    }
  } catch (e) {
    console.error('❌ DB xatosi:', e.message);
  }
});
