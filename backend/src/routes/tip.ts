import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isValidAddress, isTxHashUsed, markTxHashUsed, verifyUSDCTransfer } from '../lib/verify';
import { emitNewTip } from '../lib/socket';
import { paymentLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * POST /tip
 * Human tipping endpoint
 * Body: { wallet: string, amount: number, txHash?: string, demo?: boolean }
 */
router.post('/', paymentLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet, amount, txHash, demo } = req.body;
    const allowFakeTips = process.env.TIP_ALLOW_FAKE_TIPS === 'true';
    const isDemo = demo === true;
    const resolvedTxHash = (txHash || `demo_${Date.now()}`).toLowerCase();

    // Validate required fields
    if (!wallet || !amount || (!txHash && !isDemo)) {
      res.status(400).json({ error: 'Missing required fields: wallet, amount, txHash' });
      return;
    }

    if (isDemo && !allowFakeTips) {
      res.status(403).json({ error: 'Demo tips are disabled' });
      return;
    }

    // Validate wallet address
    if (!isValidAddress(wallet)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }

    let verification = { valid: false, amount: 0, from: '', to: '' };

    if (isDemo) {
      verification = {
        valid: true,
        amount,
        from: (req.body.senderWallet || '0xdemo').toLowerCase(),
        to: wallet,
      };
    } else {
      // Replay protection
      if (await isTxHashUsed(txHash)) {
        res.status(409).json({ error: 'Transaction already processed' });
        return;
      }

      // Mark as used immediately to prevent race conditions
      markTxHashUsed(txHash);

      // Verify the transaction on-chain before crediting the creator
      verification = await verifyUSDCTransfer(txHash, wallet, amount);
    }
    
    if (!verification.valid) {
      // Record as failed transaction
      await prisma.transaction.create({
        data: {
          creatorWallet: wallet.toLowerCase(),
          amount,
          currency: 'USDC',
          type: 'human',
          txHash: resolvedTxHash,
          senderWallet: req.body.senderWallet?.toLowerCase() || null,
          status: 'failed',
        },
      });
      res.status(400).json({ error: 'Transaction verification failed on Base. Please contact support.' });
      return;
    }

    // Ensure creator exists
    await prisma.creator.upsert({
      where: { wallet: wallet.toLowerCase() },
      update: {},
      create: { wallet: wallet.toLowerCase() },
    });

    // Record verified transaction
    const transaction = await prisma.transaction.create({
      data: {
        creatorWallet: wallet.toLowerCase(),
        amount,
        currency: 'USDC',
        type: 'human',
        txHash: resolvedTxHash,
        senderWallet: verification.from.toLowerCase() || req.body.senderWallet?.toLowerCase() || null,
        status: 'confirmed', 
      },
    });

    // Update analytics
    await prisma.analytics.upsert({
      where: { wallet: wallet.toLowerCase() },
      update: {
        humanTips: { increment: 1 },
        totalEarnings: { increment: amount },
      },
      create: {
        wallet: wallet.toLowerCase(),
        humanTips: 1,
        totalEarnings: amount,
      },
    });

    // Emit realtime event
    emitNewTip(wallet, {
      id: transaction.id,
      amount,
      type: 'human',
      txHash: resolvedTxHash,
      createdAt: transaction.createdAt,
    });

    res.status(200).json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        txHash: transaction.txHash,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error('[Tip] Error processing tip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
