// Fileverse Intelligence Network
// Each creator has one private dDoc that agents collaboratively write into
//
// This is the inverse of Google Analytics — agents voluntarily report their
// research context directly to the creator through encrypted decentralized storage.

const FILEVERSE_API = 'https://api.fileverse.io/v1';

export interface AgentIntelligenceEntry {
  agentAddress: string;
  context: string;       // What was the agent researching?
  query: string;         // What specific question brought it here?
  contentTitle: string;  // What page/content did it pay for?
  amount: number;
  timestamp: Date;
}

/**
 * Create a new private intelligence dDoc for a creator.
 * Called lazily on the first agent payment to that creator.
 */
export async function createCreatorIntelligenceDoc(
  creatorWallet: string
): Promise<{ docId: string; ipfsHash: string }> {
  const initialContent = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: '🧠 Your AI Intelligence Feed' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `This document is written by AI agents — not by AgentTip, not by any platform. Every agent that paid to access your content left a note here describing what they were working on. This document is end-to-end encrypted via Fileverse and stored on IPFS. Only you can read it.`,
          },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: `Creator wallet: ${creatorWallet}` }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `Document created: ${new Date().toISOString()}` },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '📡 Agent Intelligence Log' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Waiting for first agent visit...' }],
      },
    ],
  };

  const response = await fetch(`${FILEVERSE_API}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: initialContent,
      owner: creatorWallet,
      encrypted: true,
      title: `AgentTip Intelligence Feed — ${creatorWallet.slice(0, 8)}...`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Fileverse doc creation failed: ${response.statusText}`);
  }

  const result: any = await response.json();
  return {
    docId: result.id || result.docId,
    ipfsHash: result.ipfsHash || result.cid,
  };
}

/**
 * Append a new agent intelligence entry to the creator's dDoc.
 * Each entry is a blockquote with the agent's context, query, and payment info.
 */
export async function appendAgentIntelligence(
  docId: string,
  entry: AgentIntelligenceEntry
): Promise<void> {
  const newEntry = {
    type: 'blockquote',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `🤖 Agent ${entry.agentAddress.slice(0, 8)}... · ${entry.timestamp.toLocaleString()} · Paid ${entry.amount} USDC`,
            marks: [{ type: 'bold' }],
          },
        ],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: `📋 Task: ${entry.context}` }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: `❓ Researching: ${entry.query}` }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: `📄 Accessed: ${entry.contentTitle}` },
        ],
      },
    ],
  };

  await fetch(`${FILEVERSE_API}/documents/${docId}/append`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ block: newEntry }),
  });
}

/**
 * Get the public IPFS viewer URL for a creator's intelligence doc.
 */
export function getDocViewerUrl(ipfsHash: string): string {
  return `https://ddocs.new/ipfs/${ipfsHash}`;
}
