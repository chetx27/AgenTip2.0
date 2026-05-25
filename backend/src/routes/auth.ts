import { Router, Request, Response } from 'express';
import { generateNonce, SiweMessage } from 'siwe';
import prisma from '../lib/prisma';
import { generateToken } from '../middleware/auth';
import { generalLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * GET /auth/nonce
 * Generates a unique nonce for SIWE login
 */
router.get('/nonce', generalLimiter, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(generateNonce());
});

/**
 * POST /auth/verify
 * Verifies the SIWE signature and returns a JWT
 */
router.post('/verify', generalLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      res.status(400).json({ error: 'Expected message and signature' });
      return;
    }

    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });

    if (!result.success) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const wallet = result.data.address.toLowerCase();

    // Ensure user exists in our DB
    await prisma.creator.upsert({
      where: { wallet },
      update: {},
      create: { wallet },
    });

    const token = generateToken(wallet);

    res.json({ success: true, token, wallet });
  } catch (e: any) {
    console.error('SIWE Verification error:', e);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
});

export default router;
