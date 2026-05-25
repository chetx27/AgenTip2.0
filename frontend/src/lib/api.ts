const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreatorStats {
  wallet: string;
  totalEarnings: number;
  humanTips: {
    total: number;
    count: number;
  };
  agentPayments: {
    total: number;
    count: number;
  };
  analytics: {
    pageViews: number;
    agentRequests: number;
    humanTips: number;
  };
  dailyEarnings: any[];
  recentTransactions: any[];
}

export interface Transaction {
  id: string;
  senderWallet: string;
  creatorWallet: string;
  amount: number;
  type: 'human' | 'agent';
  status: string;
  txHash?: string;
  createdAt: string;
}

export interface IntelligenceData {
  hasDoc: boolean;
  docId?: string;
  ipfsHash?: string;
  viewerUrl?: string;
  recentIntelligence?: any[];
  message?: string;
}

// Creator Stats
export async function getCreatorStats(wallet: string): Promise<CreatorStats> {
  const res = await fetch(`${API_BASE}/creator/${wallet}/stats`);
  if (!res.ok) throw new Error('Failed to fetch creator stats');
  return res.json();
}

// Creator Intelligence Feed
export async function getCreatorIntelligence(wallet: string): Promise<IntelligenceData> {
  const res = await fetch(`${API_BASE}/creator/${wallet}/intelligence`);
  if (!res.ok) throw new Error('Failed to fetch intelligence');
  return res.json();
}

// Transactions
export async function getTransactions(
  wallet?: string,
  limit = 50,
  offset = 0,
  type?: 'human' | 'agent'
): Promise<{ transactions: Transaction[]; pagination: any }> {
  const params = new URLSearchParams();
  if (wallet) params.append('wallet', wallet);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  if (type) params.append('type', type);

  const res = await fetch(`${API_BASE}/transactions?${params}`);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

// Submit Tip
export async function submitTip(
  wallet: string,
  amount: number,
  txHash: string
): Promise<any> {
  const res = await fetch(`${API_BASE}/tip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, amount, txHash }),
  });
  if (!res.ok) throw new Error('Failed to submit tip');
  return res.json();
}

// Submit Demo Tip (no on-chain verification)
export async function submitDemoTip(
  wallet: string,
  amount: number
): Promise<any> {
  const res = await fetch(`${API_BASE}/tip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet, amount, demo: true }),
  });
  if (!res.ok) throw new Error('Failed to submit demo tip');
  return res.json();
}

// Register for Notifications
export async function registerForNotifications(
  walletAddress: string,
  email: string,
  summaryTime = '20:00'
): Promise<any> {
  const res = await fetch(`${API_BASE}/notify/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, email, summaryTime }),
  });
  if (!res.ok) throw new Error('Failed to register for notifications');
  return res.json();
}

// Health Check
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
