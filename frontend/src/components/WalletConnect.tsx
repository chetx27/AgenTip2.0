'use client';

import { useState, useEffect } from 'react';
import { detectAndConnectWallet, getConnectedWallet, formatWalletAddress, onAccountChanged } from '@/lib/wallet';

interface WalletConnectProps {
  onWalletConnected?: (wallet: string) => void;
  onWalletDisconnected?: () => void;
}

export default function WalletConnect({ onWalletConnected, onWalletDisconnected }: WalletConnectProps) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const connected = getConnectedWallet();
    if (connected) {
      setWallet(connected);
      onWalletConnected?.(connected);
    }

    // Listen for account changes
    const unsubscribe = onAccountChanged((account) => {
      if (account) {
        setWallet(account);
        onWalletConnected?.(account);
      } else {
        setWallet(null);
        onWalletDisconnected?.();
      }
    });

    return unsubscribe;
  }, [onWalletConnected, onWalletDisconnected]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const connected = await detectAndConnectWallet();
      if (connected) {
        setWallet(connected);
        onWalletConnected?.(connected);
      } else {
        setError('No Web3 wallet detected. Please install MetaMask or similar.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setWallet(null);
    setError(null);
    onWalletDisconnected?.();
  };

  if (wallet) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#F5F0E8' }}>
          {formatWalletAddress(wallet)}
        </div>
        <button
          onClick={handleDisconnect}
          className="btn btn-rust"
          style={{
            fontSize: '0.8rem',
            padding: '0.5rem 1rem',
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <button
        onClick={handleConnect}
        disabled={loading}
        className={`btn btn-rust ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && (
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#FFB74D', padding: '0.5rem', background: 'rgba(255, 183, 77, 0.1)', borderRadius: '4px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
