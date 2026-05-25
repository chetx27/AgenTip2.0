import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import tipRouter from '../src/routes/tip';
import verifyRouter from '../src/routes/verify';
import { paymentLimiter } from '../src/middleware/rateLimit';
import * as verifyParams from '../src/lib/verify';

// Mock Prisma
vi.mock('../src/lib/prisma', () => ({
  default: {
    transaction: {
      findUnique: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'test-tx-id', amount: 1, createdAt: new Date() }),
      update: vi.fn()
    },
    creator: {
      upsert: vi.fn().mockResolvedValue({ wallet: '0xcreator' })
    },
    analytics: {
      upsert: vi.fn()
    }
  }
}));

// Mock Socket
vi.mock('../src/lib/socket', () => ({
  emitNewTip: vi.fn(),
  emitNewAgentPayment: vi.fn()
}));

// Mock Fileverse
vi.mock('../src/lib/fileverse', () => ({
  appendAgentIntelligence: vi.fn(),
  createCreatorIntelligenceDoc: vi.fn().mockResolvedValue({ docId: 'doc123', ipfsHash: 'hash123' })
}));

// Mock fetch globally
global.fetch = vi.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true
  })
) as any;

// Create a mock Express app for testing routes in isolation
const app = express();
app.use(express.json());
// Disable rate limiting for tests
vi.mock('../src/middleware/rateLimit', () => ({
  paymentLimiter: (req: any, res: any, next: any) => next()
}));

app.use('/tip', tipRouter);
app.use('/verify-payment', verifyRouter);

describe('Payment Verification Tests', () => {
  beforeAll(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('POST /tip', () => {
    it('should validate inputs', async () => {
      const res = await request(app).post('/tip').send({
        wallet: 'invalid-wallet',
        amount: -10,
        txHash: '0xhash'
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid wallet address');
    });

    it('should confirm human tips that pass on-chain verify', async () => {
      // Mock the on-chain verification wrapper to return valid
      const verifyMock = vi.spyOn(verifyParams, 'verifyUSDCTransfer').mockResolvedValue({
        valid: true,
        amount: 5,
        from: '0xsender',
        to: '0xcreator'
      });

      const res = await request(app).post('/tip').send({
        wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Valid address
        amount: 5,
        txHash: '0xvalidhash'
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.transaction.status).not.toBe('failed');
      
      verifyMock.mockRestore();
    });

    it('should reject human tips that fail on-chain verify', async () => {
      // Mock the on-chain verification wrapper to return false
      const verifyMock = vi.spyOn(verifyParams, 'verifyUSDCTransfer').mockResolvedValue({
        valid: false,
        amount: 0,
        from: '',
        to: ''
      });

      const res = await request(app).post('/tip').send({
        wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: 5,
        txHash: '0xinvalidhash'
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('failed on Base');
      
      verifyMock.mockRestore();
    });
  });

  describe('POST /verify-payment', () => {
    it('should reject invalid x402 payments missing fields', async () => {
      const res = await request(app).post('/verify-payment').send({
        wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        // Missing txHash
      });
      expect(res.status).toBe(400);
    });

    it('should confirm agent payment requests that pass verify', async () => {
      const verifyMock = vi.spyOn(verifyParams, 'verifyUSDCTransfer').mockResolvedValue({
        valid: true,
        amount: 0.001,
        from: '0xagent',
        to: '0xcreator'
      });

      const res = await request(app)
        .post('/verify-payment')
        .set('x-agent-context', 'Research query about NextJS')
        .set('x-agent-address', '0xagent')
        .send({
          wallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          txHash: '0xvalidHash123',
          amount: 0.001
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.access).toBe('granted');
      
      verifyMock.mockRestore();
    });
  });
});
