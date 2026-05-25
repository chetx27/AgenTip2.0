import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isValidAddress, isTxHashUsed, markTxHashUsed, verifyUSDCTransfer } from '../lib/verify';
import { emitNewAgentPayment } from '../lib/socket';
import { appendAgentIntelligence, createCreatorIntelligenceDoc } from '../lib/fileverse';
import { paymentLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * POST /verify-payment
 * Verifies x402 agent payment proof and grants access
 * Body: { wallet: string, txHash: string, amount?: number }
 */
router.post('/', paymentLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { wallet, txHash, amount } = req.body;

    // Validate required fields
    if (!wallet || !txHash) {
      res.status(400).json({ error: 'Missing required fields: wallet, txHash' });
      return;
    }

    // Validate wallet
    if (!isValidAddress(wallet)) {
      res.status(400).json({ error: 'Invalid wallet address' });
      return;
    }

    // Replay protection
    if (await isTxHashUsed(txHash)) {
      res.status(409).json({ error: 'Transaction already processed' });
      return;
    }

    // Mark as used
    markTxHashUsed(txHash);

    const paymentAmount = amount || parseFloat(process.env.X402_PAYMENT_AMOUNT || '0.001');

    // Extract agent intelligence context from custom headers
    const agentContext = (req.headers['x-agent-context'] as string) || 'General research';
    const agentQuery = (req.headers['x-agent-query'] as string) || 'No query specified';
    const contentTitle = (req.headers['x-content-title'] as string) || req.path;
    const agentAddress = (req.headers['x-agent-address'] as string) || 'unknown';

    // In demo / dev mode we can skip on-chain verification to make agent payments work without a live Base TX
    const allowFakePayments = process.env.X402_ALLOW_FAKE_PAYMENTS === 'true';

    let verification = { valid: false, amount: 0, from: '', to: '' };

    if (allowFakePayments) {
      verification = {
        valid: true,
        amount: paymentAmount,
        from: agentAddress || '0xagent',
        to: wallet,
      };
    } else {
      // Verify on-chain. In production this would check the Escrow contract instead of direct transfer
      verification = await verifyUSDCTransfer(txHash, process.env.ESCROW_ADDRESS || wallet, paymentAmount);
    }

    if (!verification.valid) {
      // Record as failed
      await prisma.transaction.create({
        data: {
          creatorWallet: wallet.toLowerCase(),
          amount: paymentAmount,
          currency: 'USDC',
          type: 'agent',
          txHash: txHash.toLowerCase(),
          status: 'failed',
          agentContext,
          agentQuery,
        },
      });
      res.status(400).json({ error: 'Transaction verification failed' });
      return;
    }

    // Ensure creator exists
    let creator = await prisma.creator.upsert({
      where: { wallet: wallet.toLowerCase() },
      update: {},
      create: { wallet: wallet.toLowerCase() },
    });

    // Record verified agent payment transaction
    const transaction = await prisma.transaction.create({
      data: {
        creatorWallet: wallet.toLowerCase(),
        amount: paymentAmount,
        currency: 'USDC',
        type: 'agent',
        txHash: txHash.toLowerCase(),
        senderWallet: verification.from.toLowerCase(),
        status: 'confirmed',
        agentContext,
        agentQuery,
      },
    });

    // Update analytics
    await prisma.analytics.upsert({
      where: { wallet: wallet.toLowerCase() },
      update: {
        agentRequests: { increment: 1 },
        totalEarnings: { increment: paymentAmount },
      },
      create: {
        wallet: wallet.toLowerCase(),
        agentRequests: 1,
        totalEarnings: paymentAmount,
      },
    });

    // Emit realtime event
    emitNewAgentPayment(wallet, {
      id: transaction.id,
      amount: paymentAmount,
      type: 'agent',
      txHash,
      createdAt: transaction.createdAt,
    });

    // ── Fileverse Intelligence: Fire and forget ──
    // Don't block the payment response — write to the creator's dDoc asynchronously
    (async () => {
      try {
        // Lazily create the intelligence doc on first agent visit
        if (!creator.fileversDocId) {
          try {
            const { docId, ipfsHash } = await createCreatorIntelligenceDoc(wallet.toLowerCase());
            creator = await prisma.creator.update({
              where: { wallet: wallet.toLowerCase() },
              data: { fileversDocId: docId, fileversDocHash: ipfsHash },
            });
            console.log(`[Fileverse] Created intelligence doc for ${wallet.slice(0, 10)}...`);
          } catch (err) {
            console.error('[Fileverse] Failed to create doc:', err);
            return;
          }
        }

        // Append agent intelligence entry
        if (creator.fileversDocId) {
          await appendAgentIntelligence(creator.fileversDocId, {
            agentAddress,
            context: agentContext,
            query: agentQuery,
            contentTitle,
            amount: paymentAmount,
            timestamp: new Date(),
          });

          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { writtenToDoc: true },
          });

          console.log(`[Fileverse] Intelligence written for tx ${transaction.id}`);
        }
      } catch (err) {
        console.error('[Fileverse] Intelligence write failed:', err);
      }
    })();

    // Return payment response immediately
    res.status(200).json({
      success: true,
      access: 'granted',
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        txHash: transaction.txHash,
      },
    });
  } catch (error) {
    console.error('[Verify] Error verifying payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
