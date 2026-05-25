'use client';

import { useState } from 'react';
import { registerForNotifications } from '@/lib/api';

interface EmailNotificationsProps {
  wallet: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function EmailNotifications({ wallet, onSuccess, onError }: EmailNotificationsProps) {
  const [email, setEmail] = useState('');
  const [summaryTime, setSummaryTime] = useState('20:00');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      onError?.('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      await registerForNotifications(wallet, email, summaryTime);
      setRegistered(true);
      setEmail('');
      onSuccess?.();

      setTimeout(() => setRegistered(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', padding: '1.5rem' }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '1rem' }}>
        📧 Daily Summary Email
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '0.5rem' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '0.5rem' }}>
            Summary Time (UTC)
          </label>
          <input
            type="time"
            value={summaryTime}
            onChange={(e) => setSummaryTime(e.target.value)}
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`btn btn-sage ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          style={{
            width: '100%',
          }}
        >
          {loading ? 'Registering...' : registered ? '✓ Registered!' : 'Register'}
        </button>
      </form>

      {registered && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(74, 124, 89, 0.1)', border: '1px solid #4A7C59', borderRadius: '4px', color: '#81C784', fontFamily: "'DM Mono', monospace", fontSize: '0.85rem' }}>
          You'll receive daily summaries at {summaryTime} UTC
        </div>
      )}
    </div>
  );
}
