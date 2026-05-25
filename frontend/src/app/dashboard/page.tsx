'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WalletConnect from '@/components/WalletConnect';
import DashboardContentPanel from '@/components/DashboardContent';
import TipForm from '@/components/TipForm';
import TransactionsFeed from '@/components/TransactionsFeed';
import EmailNotifications from '@/components/EmailNotifications';
import IntelligenceFeed from '@/components/IntelligenceFeed';

function DashboardContent() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === '1' || searchParams.get('view') === 'demo';

  return (
    <>
      <nav className="sticky-nav">
        <div className="nav-left">
          <div className="logo-pulse"></div>
          <Link href="/" className="logo" style={{ textDecoration: 'none', color: 'inherit' }}>AgenTip</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="tab-group">
            <Link href="/" className="tab">Product</Link>
            <button className="tab active">Dashboard</button>
            <Link href="/dashboard?demo=1" className="tab">Live Demo</Link>
          </div>
        </div>
      </nav>

      <div className="view active" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="dash-content-wrapper">
          <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="heading-section">Dashboard</h1>
              <div className="label-mono" style={{ marginTop: '0.5rem' }}>Manage your earnings & integrations</div>
            </div>
            <WalletConnect 
              onWalletConnected={setConnectedWallet}
              onWalletDisconnected={() => setConnectedWallet(null)}
            />
          </div>

          {!connectedWallet ? (
            <div style={{ background: '#1A1814', border: '1.5px solid #D4A017', borderRadius: '4px', padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.5rem', fontWeight: '800', color: '#D4A017', marginBottom: '1rem' }}>
                Connect Your Wallet
              </div>
              <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1rem', color: '#F5F0E8', lineHeight: '1.6' }}>
                Connect your Web3 wallet to view your earnings, send tips, and manage your creator intelligence network.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <DashboardContentPanel wallet={connectedWallet} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <TipForm creatorWallet={connectedWallet} mode={isDemo ? 'demo' : 'onchain'} />
                <EmailNotifications wallet={connectedWallet} />
              </div>
            </div>
          )}

          {connectedWallet && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
              <div>
                <TransactionsFeed wallet={connectedWallet} limit={10} filter="all" />
              </div>
              <div>
                <IntelligenceFeed wallet={connectedWallet} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
