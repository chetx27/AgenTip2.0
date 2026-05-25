'use client';

import { useState, useEffect, useRef } from 'react';
import { getCreatorIntelligence, IntelligenceData } from '@/lib/api';
import { formatWalletAddress } from '@/lib/wallet';

interface IntelligenceFeedProps {
  wallet: string;
}

export default function IntelligenceFeed({ wallet }: IntelligenceFeedProps) {
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIntelligence = async () => {
      setLoading(true);
      try {
        const result = await getCreatorIntelligence(wallet);
        setData(result);
        setError(null);
      } catch (err) {
        // Use mock data on error - show activation message
        const mockData: IntelligenceData = {
          hasDoc: false,
          message: 'Intelligence feed will activate after your first agent payment',
        };
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };

    if (wallet) {
      fetchIntelligence();
      // Refresh every 60 seconds
      const interval = setInterval(fetchIntelligence, 60000);
      return () => clearInterval(interval);
    }
  }, [wallet]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#F5F0E8' }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem' }}>Loading intelligence feed...</div>
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

  if (!data) return null;

  return (
    <div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '1rem' }}>
        🧠 Creator Intelligence Network
      </div>

      {!data.hasDoc ? (
        <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', color: '#8C7B6B', marginBottom: '1rem' }}>
            {data.message}
          </div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '0.95rem', color: '#F5F0E8', lineHeight: '1.6' }}>
            Your Creator Intelligence Network will activate once an agent makes their first payment. This creates a dDoc that collects agent contexts and creates semantic understanding of how AI is consuming your content.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* dDoc Viewer Link */}
          <div style={{ background: '#1A1814', border: '1.5px solid #D4A017', borderRadius: '4px', padding: '1.5rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#D4A017', marginBottom: '1rem' }}>
              📄 Your Intelligence Doc
            </div>
            <a
              href={data.viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.25rem',
                background: '#D4A017',
                color: '#1A1814',
                fontFamily: "'Syne', sans-serif",
                fontWeight: '700',
                borderRadius: '4px',
                textDecoration: 'none',
                transition: 'opacity 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '0.8')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '1')}
            >
              View on Fileverse →
            </a>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#8C7B6B', marginTop: '1rem' }}>
              ID: {data.docId?.slice(0, 8)}...
            </div>
          </div>

          {/* Recent Intelligence */}
          <div style={{ background: '#1A1814', border: '1.5px solid #F5F0E8', borderRadius: '4px', padding: '1.5rem' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8C7B6B', marginBottom: '1rem' }}>
              Recent Agent Contexts
            </div>
            {data.recentIntelligence && data.recentIntelligence.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.recentIntelligence.slice(0, 3).map((intel: any, idx: number) => (
                  <div key={idx} style={{ padding: '0.75rem', background: '#11100D', borderRadius: '4px', borderLeft: '3px solid #FFB74D' }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', color: '#FFB74D', marginBottom: '0.25rem' }}>
                      {formatWalletAddress(intel.senderWallet)}
                    </div>
                    {intel.agentQuery && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#F5F0E8', marginBottom: '0.25rem' }}>
                        Query: {intel.agentQuery.slice(0, 40)}...
                      </div>
                    )}
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#8C7B6B' }}>
                      {new Date(intel.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#8C7B6B' }}>
                No agent contexts yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
