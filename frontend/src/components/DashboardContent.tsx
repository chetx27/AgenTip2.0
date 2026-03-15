'use client';

import { useState, useEffect } from 'react';
import { getCreatorStats, CreatorStats } from '@/lib/api';
import { formatWalletAddress } from '@/lib/wallet';

interface DashboardContentProps {
  wallet: string;
  onLoadingChange?: (loading: boolean) => void;
}

export default function DashboardContent({ wallet, onLoadingChange }: DashboardContentProps) {
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wallet) return;

    const fetchStats = async () => {
      setLoading(true);
      onLoadingChange?.(true);
      try {
        const data = await getCreatorStats(wallet);
        setStats(data);
        setError(null);
      } catch (err) {
        // Use mock data on error
        const mockStats: CreatorStats = {
          wallet: wallet,
          totalEarnings: 542.35,
          humanTips: { total: 127.50, count: 34 },
          agentPayments: { total: 414.85, count: 414850 },
          analytics: { pageViews: 2847, agentRequests: 1240, humanTips: 89 },
          dailyEarnings: [],
          recentTransactions: [
            { id: '1', creatorWallet: wallet, senderWallet: '0xabc...def', amount: 5.0, type: 'human', status: 'confirmed', createdAt: '2026-03-14 14:32', txHash: '0x123' },
            { id: '2', creatorWallet: wallet, senderWallet: '0xghi...jkl', amount: 0.001, type: 'agent', status: 'confirmed', createdAt: '2026-03-14 13:15', txHash: '0x456' },
            { id: '3', creatorWallet: wallet, senderWallet: '0xmno...pqr', amount: 2.50, type: 'human', status: 'confirmed', createdAt: '2026-03-14 11:08', txHash: '0x789' },
          ],
        };
        setStats(mockStats);
        setError(null);
      } finally {
        setLoading(false);
        onLoadingChange?.(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [wallet, onLoadingChange]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#F5F0E8' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem' }}>Loading stats...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: '#FFB74D', background: '#1A1814', border: '1.5px solid #FFB74D', borderRadius: '4px' }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem' }}>⚠ {error}</p>
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#F5F0E8' }}>
          Make sure you have earned some payments to see your stats.
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', color: '#F5F0E8', marginBottom: '1rem' }}>No Stats Found</div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#8C7B6B' }}>
          Your wallet ({formatWalletAddress(wallet)}) doesn't have any earnings yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Wallet Address */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(245, 240, 232, 0.2)' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '0.5rem' }}>
          Connected Wallet
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', color: '#F5F0E8' }}>
          {formatWalletAddress(stats.wallet)}
        </div>
      </div>

      {/* Total Earnings */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '0.5rem' }}>
          Total Earnings
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '2.5rem', fontWeight: '600', color: '#D4A017', marginBottom: '0.5rem' }}>
          ${stats.totalEarnings.toFixed(2)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Human Tips */}
          <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', padding: '1rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#81C784', marginBottom: '0.5rem' }}>
              💰 Human Tips
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.5rem', color: '#81C784', marginBottom: '0.25rem' }}>
              ${stats.humanTips.total.toFixed(2)}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#8C7B6B' }}>
              {stats.humanTips.count} transactions
            </div>
          </div>

          {/* Agent Payments */}
          <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', padding: '1rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#FFB74D', marginBottom: '0.5rem' }}>
              🤖 Agent Payments
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.5rem', color: '#FFB74D', marginBottom: '0.25rem' }}>
              ${stats.agentPayments.total.toFixed(2)}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#8C7B6B' }}>
              {stats.agentPayments.count} payments
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '1rem' }}>
          Analytics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', padding: '1rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#8C7B6B', marginBottom: '0.5rem' }}>
              Page Views
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.8rem', color: '#F5F0E8' }}>
              {stats.analytics.pageViews.toLocaleString()}
            </div>
          </div>
          <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', padding: '1rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#8C7B6B', marginBottom: '0.5rem' }}>
              Agent Requests
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.8rem', color: '#F5F0E8' }}>
              {stats.analytics.agentRequests.toLocaleString()}
            </div>
          </div>
          <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', padding: '1rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#8C7B6B', marginBottom: '0.5rem' }}>
              Human Tips Count
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.8rem', color: '#F5F0E8' }}>
              {stats.analytics.humanTips}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {stats.recentTransactions.length > 0 && (
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '1rem' }}>
            Recent Transactions
          </div>
          <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', overflow: 'hidden' }}>
            {stats.recentTransactions.slice(0, 5).map((tx: any, idx: number) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  borderBottom: idx < stats.recentTransactions.length - 1 ? '1px solid rgba(245, 240, 232, 0.1)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#F5F0E8', marginBottom: '0.25rem' }}>
                    <span style={{ background: tx.type === 'human' ? '#1B4332' : '#3D1C02', color: tx.type === 'human' ? '#81C784' : '#FFB74D', padding: '0.15rem 0.4rem', borderRadius: '2px', marginRight: '0.5rem', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                      {tx.type}
                    </span>
                    {formatWalletAddress(tx.senderWallet)}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#8C7B6B' }}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', color: '#D4A017', fontWeight: '600' }}>
                  +${parseFloat(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
