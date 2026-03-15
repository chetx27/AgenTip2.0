'use client';

import { useState } from 'react';
import { submitTip } from '@/lib/api';

interface TipFormProps {
  creatorWallet: string;
  onSuccess?: (amount: number) => void;
  onError?: (error: string) => void;
}

export default function TipForm({ creatorWallet, onSuccess, onError }: TipFormProps) {
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !txHash) {
      onError?.('Please fill in all fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      onError?.('Amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await submitTip(creatorWallet, numAmount, txHash);
      setSubmitted(true);
      setAmount('');
      setTxHash('');
      onSuccess?.(numAmount);

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit tip';
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '0.5rem' }}>
          Amount (USDC)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontFamily: "'DM Mono', monospace",
            fontSize: '1rem',
            background: '#11100D',
            border: '1px solid #8C7B6B',
            borderRadius: '4px',
            color: '#F5F0E8',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '0.5rem' }}>
          Transaction Hash
        </label>
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x..."
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.9rem',
            background: '#11100D',
            border: '1px solid #8C7B6B',
            borderRadius: '4px',
            color: '#F5F0E8',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#8C7B6B', marginTop: '0.5rem' }}>
          Paste your transaction hash from the blockchain explorer
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`btn btn-rust ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
        style={{
          width: '100%',
        }}
      >
        {loading ? 'Processing...' : submitted ? '✓ Tip Sent!' : 'Send Tip'}
      </button>

      {submitted && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(129, 199, 132, 0.1)', border: '1px solid #81C784', borderRadius: '4px', color: '#81C784', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}>
          Thank you! Your tip has been recorded.
        </div>
      )}
    </form>
  );
}
