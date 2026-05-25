import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { initSocket } from './lib/socket';
import { generalLimiter } from './middleware/rateLimit';
import tipRouter from './routes/tip';
import verifyRouter from './routes/verify';
import creatorRouter from './routes/creator';
import transactionsRouter from './routes/transactions';
import notifyRouter from './routes/notify';
import willRouter from './routes/will';
import authRouter from './routes/auth';
import { startDailySummaryCron } from './jobs/dailySummary';
import { startWillExecutorCron } from './jobs/willExecutor';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Payment-Proof', 'X-Payment-TxHash', 'X-Agent-Type', 'X-Agent-Context', 'X-Agent-Query', 'X-Content-Title', 'X-Agent-Address'],
}));
app.use(express.json());
app.use(generalLimiter);

// Serve widget static files
app.use('/widget', express.static('../widget/dist'));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'agenttip-backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/auth', authRouter);
app.use('/tip', tipRouter);
app.use('/verify-payment', verifyRouter);
app.use('/creator', creatorRouter);
app.use('/transactions', transactionsRouter);
app.use('/notify', notifyRouter);
app.use('/api/will', willRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║     🚀 AgentTip Backend Running       ║
  ║     Port: ${String(PORT).padEnd(27)}║
  ║     Environment: ${(process.env.NODE_ENV || 'development').padEnd(20)}║
  ╚════════════════════════════════════════╝
  `);

  // Start cron jobs
  startDailySummaryCron();
  startWillExecutorCron();
});

export default app;
