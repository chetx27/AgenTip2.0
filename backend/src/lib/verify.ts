import { ethers } from 'ethers';
import prisma from './prisma';

// USDC has 6 decimals
const USDC_DECIMALS = 6;

// ERC-20 Transfer event signature
const TRANSFER_EVENT_TOPIC = ethers.id('Transfer(address,address,uint256)');

// Track used transaction hashes for replay protection
const usedTxHashes = new Set<string>();

/**
 * Validates an Ethereum wallet address
 */
export function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address.toLowerCase()); // Lowercase string to bypass strict checksum during parse
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a transaction hash has already been used (replay protection)
 */
export async function isTxHashUsed(txHash: string): Promise<boolean> {
  // Check in-memory set first
  if (usedTxHashes.has(txHash.toLowerCase())) return true;

  // Check database
  const existing = await prisma.transaction.findUnique({
    where: { txHash: txHash.toLowerCase() },
  });

  if (existing) {
    usedTxHashes.add(txHash.toLowerCase());
    return true;
  }

  return false;
}

/**
 * Mark a transaction hash as used
 */
export function markTxHashUsed(txHash: string): void {
  usedTxHashes.add(txHash.toLowerCase());
}

/**
 * Verify a USDC transfer on Base chain
 * Returns { valid, amount, from, to } or throws
 */
export async function verifyUSDCTransfer(
  txHash: string,
  expectedRecipient: string,
  expectedAmount?: number
): Promise<{
  valid: boolean;
  amount: number;
  from: string;
  to: string;
}> {
  const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  const usdcContract = process.env.USDC_CONTRACT || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  try {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return { valid: false, amount: 0, from: '', to: '' };
    }

    if (receipt.status !== 1) {
      return { valid: false, amount: 0, from: '', to: '' };
    }

    // Find the USDC Transfer event
    for (const log of receipt.logs) {
      if (
        log.address.toLowerCase() === usdcContract.toLowerCase() &&
        log.topics[0] === TRANSFER_EVENT_TOPIC
      ) {
        const from = ethers.getAddress('0x' + log.topics[1].slice(26));
        const to = ethers.getAddress('0x' + log.topics[2].slice(26));
        const amount = Number(ethers.formatUnits(log.data, USDC_DECIMALS));

        // Verify recipient matches
        if (to.toLowerCase() !== expectedRecipient.toLowerCase()) {
          continue;
        }

        // Verify amount if specified
        if (expectedAmount !== undefined && Math.abs(amount - expectedAmount) > 0.0001) {
          continue;
        }

        return { valid: true, amount, from, to };
      }
    }

    return { valid: false, amount: 0, from: '', to: '' };
  } catch (error) {
    console.error('[Verify] Error verifying transaction:', error);
    return { valid: false, amount: 0, from: '', to: '' };
  }
}

/**
 * Generate x402 payment required headers
 */
export function generateX402Headers(recipientWallet: string) {
  const paymentAmount = process.env.X402_PAYMENT_AMOUNT || '0.001';
  const paymentAsset = process.env.X402_PAYMENT_ASSET || 'USDC';
  const paymentNetwork = process.env.X402_PAYMENT_NETWORK || 'base';
  const usdcContract = process.env.USDC_CONTRACT || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

  return {
    'X-Payment-Required': 'true',
    'X-Payment-Amount': paymentAmount,
    'X-Payment-Asset': paymentAsset,
    'X-Payment-Network': paymentNetwork,
    'X-Payment-Recipient': recipientWallet,
    'X-Payment-Contract': usdcContract,
    'X-Payment-Protocol': 'x402',
  };
}
