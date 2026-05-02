import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { testConnection } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import panRoutes from './routes/panRoutes.js';
import form16Routes from './routes/form16Routes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import taskRoutes from './routes/taskRoutes.js';

dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const app = express();
const PORT = Number(process.env.BACKEND_PORT || 5000);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  return res.json({ status: 'ok', message: 'Tax Compliance API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/pan', panRoutes);
app.use('/api/form16', form16Routes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/tasks', taskRoutes);

app.use((err, _req, res, _next) => {
  return res.status(500).json({ message: 'Unexpected server error.', error: err.message });
});

const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

startServer();
