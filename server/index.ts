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

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    __dirname,
    distPath,
    distExists: fs.existsSync(distPath),
    distFiles: fs.existsSync(distPath) ? fs.readdirSync(distPath) : []
  });
});

// ========== STATIC FILES ==========
app.use(express.static(distPath));

// ========== AUTH ==========
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Login va parol kiritilishi shart" });
    }
    const user = await prisma.user.findFirst({
      where: { username, password, isActive: true }
    });
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Login yoki parol noto'g'ri" });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Server xatosi: " + error.message });
  }
});

// ========== USERS ==========
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users.map(({ password: _, ...u }) => u));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await prisma.user.create({ data: req.body });
    const { password: _, ...u } = user;
    res.json(u);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
    const { password: _, ...u } = user;
    res.json(u);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CLIENTS ==========
app.get('/api/clients', async (req, res) => {
  try {
    const data = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/clients', async (req, res) => {
  try {
    const data = await prisma.client.create({ data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.put('/api/clients/:id', async (req, res) => {
  try {
    const data = await prisma.client.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/clients/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== CLIENT PAYMENTS ==========
app.get('/api/client-payments', async (req, res) => {
  try {
    const data = await prisma.clientPayment.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/client-payments', async (req, res) => {
  try {
    const { clientId, amount, note, date, clientName } = req.body;
    const payment = await prisma.clientPayment.create({ data: { clientId, amount, note, date, clientName } });
    await prisma.client.update({ where: { id: clientId }, data: { totalDebt: { decrement: amount } } });
    res.json(payment);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/client-payments/:id', async (req, res) => {
  try {
    const payment = await prisma.clientPayment.findUnique({ where: { id: req.params.id } });
    if (payment) {
      await prisma.client.update({ where: { id: payment.clientId }, data: { totalDebt: { increment: payment.amount } } });
      await prisma.clientPayment.delete({ where: { id: req.params.id } });
    }
    res.json({ ok: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== DRIVERS ==========
app.get('/api/drivers', async (req, res) => {
  try {
    const data = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/drivers', async (req, res) => {
  try {
    const data = await prisma.driver.create({ data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.put('/api/drivers/:id', async (req, res) => {
  try {
    const data = await prisma.driver.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/drivers/:id', async (req, res) => {
  try {
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== SALES ==========
app.get('/api/sales', async (req, res) => {
  try {
    const data = await prisma.sale.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/sales', async (req, res) => {
  try {
    const { clientId, clientName, driverId, driverName, driverCarNumber, tons, pricePerTon, totalAmount, paymentType, note, date } = req.body;
    const sale = await prisma.sale.create({
      data: { clientId, clientName, driverId, driverName, driverCarNumber, tons, pricePerTon, totalAmount, paymentType, note, date },
    });
    if (paymentType === 'nasiya') {
      await prisma.client.update({ where: { id: clientId }, data: { totalDebt: { increment: totalAmount } } });
    }
    res.json(sale);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/sales/:id', async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({ where: { id: req.params.id } });
    if (sale && sale.paymentType === 'nasiya') {
      await prisma.client.update({ where: { id: sale.clientId }, data: { totalDebt: { decrement: sale.totalAmount } } });
    }
    await prisma.sale.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== RAW MATERIALS ==========
app.get('/api/raw-materials', async (req, res) => {
  try {
    const data = await prisma.rawMaterial.findMany();
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/raw-materials', async (req, res) => {
  try {
    const data = await prisma.rawMaterial.create({ data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.put('/api/raw-materials/:id', async (req, res) => {
  try {
    const data = await prisma.rawMaterial.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/raw-materials/:id', async (req, res) => {
  try {
    await prisma.rawMaterial.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== RAW TRANSACTIONS ==========
app.get('/api/raw-transactions', async (req, res) => {
  try {
    const data = await prisma.rawMaterialTransaction.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/raw-transactions', async (req, res) => {
  try {
    const { materialId, materialName, type, quantity, price, totalPrice, docNumber, note, date, supplierId, supplierName, driverId, driverName } = req.body;
    const tx = await prisma.rawMaterialTransaction.create({
      data: { materialId, materialName, type, quantity, price, totalPrice, docNumber, note, date, supplierId, supplierName, driverId, driverName },
    });
    const delta = type === 'kirim' ? quantity : -quantity;
    await prisma.rawMaterial.update({ where: { id: materialId }, data: { quantity: { increment: delta } } });
    res.json(tx);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== SUPPLIERS ==========
app.get('/api/suppliers', async (req, res) => {
  try {
    const data = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/suppliers', async (req, res) => {
  try {
    const data = await prisma.supplier.create({ data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== EXPENSES ==========
app.get('/api/expenses', async (req, res) => {
  try {
    const data = await prisma.expense.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/expenses', async (req, res) => {
  try {
    const data = await prisma.expense.create({ data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== EXPENSE CATEGORIES ==========
app.get('/api/expense-categories', async (req, res) => {
  try {
    const data = await prisma.expenseCategoryDef.findMany();
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/expense-categories', async (req, res) => {
  try {
    const data = await prisma.expenseCategoryDef.create({ data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/expense-categories/:id', async (req, res) => {
  try {
    await prisma.expenseCategoryDef.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== WORKERS ==========
app.get('/api/workers', async (req, res) => {
  try {
    const data = await prisma.worker.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/workers', async (req, res) => {
  try {
    const data = await prisma.worker.create({ data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.put('/api/workers/:id', async (req, res) => {
  try {
    const data = await prisma.worker.update({ where: { id: req.params.id }, data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/workers/:id', async (req, res) => {
  try {
    await prisma.worker.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== WORKER PAYMENTS ==========
app.get('/api/worker-payments', async (req, res) => {
  try {
    const data = await prisma.workerPayment.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.post('/api/worker-payments', async (req, res) => {
  try {
    const data = await prisma.workerPayment.create({ data: req.body });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/worker-payments/:id', async (req, res) => {
  try {
    await prisma.workerPayment.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== SETTINGS ==========
app.get('/api/settings', async (req, res) => {
  try {
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
        },
      });
    }
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.put('/api/settings', async (req, res) => {
  try {
    const data = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: req.body,
      create: { id: 'default', ...req.body },
    });
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// ========== SPA FALLBACK ==========
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build topilmadi. Iltimos, npm run build qaytadan ishlatib ko\'ring.');
  }
});

// ========== START ==========
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`✅ Server ishga tushdi: http://localhost:${PORT}`);
  console.log(`📁 dist papkasi: ${distPath}`);
  console.log(`📁 dist mavjud: ${fs.existsSync(distPath)}`);

  try {
    await prisma.$connect();
    console.log('✅ DB ulanish muvaffaqiyatli');

    // Ensure default admin exists with password 'admin'
    const existing = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (!existing) {
      await prisma.user.create({
        data: {
          username: 'admin',
          password: 'admin',
          fullName: 'Administrator',
          role: 'admin',
          isActive: true
        }
      });
      console.log('✅ Admin yaratildi: admin / admin');
    } else {
      // Update password to 'admin' if different
      if (existing.password !== 'admin') {
        await prisma.user.update({
          where: { id: existing.id },
          data: { password: 'admin' }
        });
        console.log('✅ Admin paroli "admin" ga yangilandi');
      } else {
        console.log('✅ Admin mavjud: admin / admin');
      }
    }
  } catch (err: any) {
    console.error('❌ DB xatosi:', err.message);
  }
});
