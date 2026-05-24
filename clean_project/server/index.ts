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
                // ========== DRIVERS ==========
                app.get('/api/drivers', async (req, res) => {
                  const data = await prisma.driver.findMany({ orderBy: { createdAt: 'desc' } });
                    res.json(data);
                    });
                    app.post('/api/drivers', async (req, res) => {
                      const data = await prisma.driver.create({ data: req.body });
                        res.json(data);
                        });
                        // ========== SALES ==========
                        app.get('/api/sales', async (req, res) => {
                          const data = await prisma.sale.findMany({ orderBy: { createdAt: 'desc' } });
                            res.json(data);
                            });
                            app.post('/api/sales', async (req, res) => {
                              const { clientId, totalAmount, paymentType } = req.body;
                                const sale = await prisma.sale.create({ data: req.body });
                                  if (paymentType === 'nasiya') {
                                      await prisma.client.update({ where: { id: clientId }, data: { totalDebt: { increment: totalAmount } } });
                                        }
                                          res.json(sale);
                                          });
                                          // ========== SETTINGS ==========
                                          app.get('/api/settings', async (req, res) => {
                                            let settings = await prisma.appSettings.findUnique({ where: { id: 'default' } });
                                              if (!settings) {
                                                  settings = await prisma.appSettings.create({ data: { id: 'default', factoryName: "Asfalt Zavod", address: "Farg'ona", phone: '+998', defaultPricePerTon: 950000, currency: 'UZS', theme: 'light' } });
                                                    }
                                                      res.json(settings);
                                                      });
                                                      // ========== SPA FALLBACK ==========
                                                      app.get('*', (req, res) => {
                                                        res.sendFile(path.join(__dirname, '../dist/index.html'));
                                                        });
                                                        const PORT = process.env.PORT || 3000;
                                                        app.listen(PORT, () => {
                                                          console.log(`Server is running on port ${PORT}`);
                                                          });
                                                          
