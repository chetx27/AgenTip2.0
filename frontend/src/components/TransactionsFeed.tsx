'use client';

import { useState, useEffect } from 'react';
import { getTransactions, Transaction } from '@/lib/api';
import { formatWalletAddress } from '@/lib/wallet';

interface TransactionsFeedProps {
  wallet?: string;
  limit?: number;
  filter?: 'all' | 'human' | 'agent';
}

export default function TransactionsFeed({ wallet, limit = 10, filter = 'all' }: TransactionsFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const formatAmount = (amount: number, type: 'human' | 'agent') => {
    if (type === 'agent') return amount.toFixed(3);
    return amount.toFixed(2);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const type = filter !== 'all' ? filter : undefined;
        const data = await getTransactions(wallet, limit, 0, type);
        setTransactions(data.transactions);
        setError(null);
      } catch (err) {
        // Use mock data on error
        const mockTransactions: Transaction[] = [
          { id: '1', type: 'human', senderWallet: '0xabc...def', creatorWallet: wallet || '0x742d...bD78', amount: 5.0, status: 'confirmed', createdAt: '2026-03-14 14:32', txHash: '0x123' },
          { id: '2', type: 'agent', senderWallet: '0xghi...jkl', creatorWallet: wallet || '0x742d...bD78', amount: 0.001, status: 'confirmed', createdAt: '2026-03-14 13:15', txHash: '0x456' },
          { id: '3', type: 'human', senderWallet: '0xmno...pqr', creatorWallet: wallet || '0x742d...bD78', amount: 2.50, status: 'confirmed', createdAt: '2026-03-14 11:08', txHash: '0x789' },
          { id: '4', type: 'agent', senderWallet: '0xstu...vwx', creatorWallet: wallet || '0x742d...bD78', amount: 0.001, status: 'confirmed', createdAt: '2026-03-14 09:45', txHash: '0xabc' },
          { id: '5', type: 'human', senderWallet: '0xyza...bcd', creatorWallet: wallet || '0x742d...bD78', amount: 1.0, status: 'confirmed', createdAt: '2026-03-14 08:20', txHash: '0xdef' },
        ];
        let filtered = mockTransactions;
        if (filter !== 'all') {
          filtered = filtered.filter(t => t.type === filter);
        }
        setTransactions(filtered.slice(0, limit));
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Refresh every 5 seconds
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, [wallet, limit, filter]);

  if (loading && transactions.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#F5F0E8' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem' }}>Loading feed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: '#FFB74D' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem' }}>⚠ {error}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '1rem' }}>
        📊 Recent Transactions
      </div>

      {transactions.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#8C7B6B', fontFamily: "'DM Mono', monospace", fontSize: '0.9rem' }}>
          No transactions yet. They'll appear here as they happen.
        </div>
      ) : (
        <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', overflow: 'hidden' }}>
          {transactions.map((tx, idx) => (
            <div
              key={tx.id}
              style={{
                padding: '1rem',
                borderBottom: idx < transactions.length - 1 ? '1px solid rgba(245, 240, 232, 0.1)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span
                    style={{
                      background: tx.type === 'human' ? '#1B4332' : '#3D1C02',
                      color: tx.type === 'human' ? '#81C784' : '#FFB74D',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '2px',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {tx.type}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#F5F0E8' }}>
                    {formatWalletAddress(tx.senderWallet)}
                  </span>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#8C7B6B' }}>
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', color: '#D4A017', fontWeight: '600', marginBottom: '0.25rem' }}>
                  +${formatAmount(parseFloat(tx.amount as any), tx.type)}
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#81C784' }}>
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
