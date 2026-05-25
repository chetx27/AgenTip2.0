# AgentTip — x402 Tipping Layer for the Internet

> One line of code. Humans tip. AI agents pay. Creators earn USDC on Base.

![License](https://img.shields.io/badge/license-MIT-blue)
![Chain](https://img.shields.io/badge/chain-Base-blue)
![Currency](https://img.shields.io/badge/currency-USDC-green)

---

## 🧠 Creator Intelligence Network (Powered by Fileverse)

AgentTip introduces the **Creator Intelligence Network** — the inverse of surveillance capitalism.

Instead of a platform spying on users and selling insights back to creators (Google Analytics, Meta Pixel), AgentTip agents **voluntarily write their research context** directly into a private encrypted document owned by the creator.

Every agent that pays to access your content leaves a note:
- What task were they working on?
- What specific question brought them to your content?
- What did they find valuable?

This intelligence feeds into a private Fileverse dDoc — end-to-end encrypted, stored on IPFS, readable only by you. Not by AgentTip. Not by any platform. Just you and the agents you served.

**This is built on:**
- [Fileverse dDocs SDK](https://github.com/fileverse/fileverse-ddoc) — encrypted collaborative documents
- [Fileverse IPFS Storage](https://fileverse.io) — decentralized document hosting
- x402 Protocol — the payment layer that funds the intelligence exchange

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Creator's Website                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  <script src="agenttip.xyz/widget.js"               │    │
│  │    data-wallet="0x...">                              │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
     ┌─────▼──────┐               ┌──────▼───────┐
     │   Human    │               │  AI Agent    │
     │  Visitor   │               │  (Python/JS) │
     └─────┬──────┘               └──────┬───────┘
           │                              │
           │ Click Tip Button             │ HTTP GET → 402
           │ → Smart Wallet               │ → Parse x402 Headers
           │ → USDC Transfer              │ → Pay $0.001 USDC
           │                              │ → Send Context Headers
           │                              │ → Retry with Proof
           │                              │
     ┌─────▼──────────────────────────────▼───────┐
     │            AgentTip Backend                 │
     │  ┌──────────────────────────────────────┐   │
     │  │  Express + Socket.io + Prisma        │   │
     │  │  POST /tip (human payments)          │   │
     │  │  POST /verify-payment (agent x402)   │   │
     │  │  GET  /creator/:wallet/stats         │   │
     │  │  GET  /creator/:wallet/intelligence  │   │
     │  └──────────────┬───────────────────────┘   │
     └────────┬────────┼──────────┬────────────────┘
              │        │          │
     ┌────────▼──────┐ │  ┌──────▼─────────────┐
     │  PostgreSQL   │ │  │  Creator           │
     │  (Prisma)     │ │  │  Dashboard         │
     │               │ │  │  (Next.js)         │
     └───────────────┘ │  │  + Intelligence    │
                       │  │    Feed UI         │
              ┌────────▼──┴────────────────────┘
              │  Fileverse dDocs (IPFS)  │
              │  Encrypted Intelligence  │
              │  Documents               │
              └──────────────────────────┘
```

---

## 📦 Project Structure

```
AgenTip/
├── backend/                  # Express + TypeScript + Prisma
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Demo data seeder
│   └── src/
│       ├── index.ts          # Server entrypoint
│       ├── routes/           # API routes
│       │   ├── tip.ts        # POST /tip
│       │   ├── verify.ts     # POST /verify-payment (+ Fileverse intelligence)
│       │   ├── creator.ts    # GET /creator/:wallet/stats + /intelligence
│       │   └── transactions.ts
│       ├── middleware/
│       │   ├── x402.ts       # x402 agent detection + 402 responses
│       │   └── rateLimit.ts  # Rate limiting
│       └── lib/
│           ├── prisma.ts     # Prisma client
│           ├── socket.ts     # Socket.io setup
│           ├── verify.ts     # Payment verification
│           └── fileverse.ts  # Fileverse Intelligence Network
│
├── frontend/                 # Next.js + Tailwind CSS
│   └── src/app/
│       ├── page.tsx          # Landing page
│       ├── dashboard/page.tsx # Creator dashboard + Intelligence Feed
│       ├── layout.tsx        # Root layout
│       └── globals.css       # Global styles
│
├── widget/                   # Vanilla JS widget (19kb)
│   └── src/
│       ├── widget.ts         # Main entry + shadow DOM
│       ├── styles.ts         # Scoped CSS
│       ├── wallet.ts         # Coinbase Smart Wallet
│       └── icons.ts          # SVG icons
│
├── demo/
│   ├── blog.html             # Demo blog page
│   └── agent_demo.py         # Python AI agent demo (with intelligence context)
│
├── .env.example              # Environment template
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Python 3.8+ (for agent demo)

### 1. Clone & Install

```bash
# Install all dependencies
cd backend && npm install
cd ../widget && npm install
cd ../frontend && npm install
```

### 2. Database Setup

```bash
cd backend

# Copy env template
cp ../.env.example .env
# Edit .env with your DATABASE_URL

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# (Optional) Seed demo data
npx ts-node prisma/seed.ts
```

### 3. Build Widget

```bash
cd widget
npm run build
# Output: dist/widget.js (19kb)
```

### 4. Start Services

```bash
# Terminal 1: Backend
cd backend
npm run dev
# → http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev
# → http://localhost:3000
```

### 5. View Demo

Open `demo/blog.html` in your browser to see the widget in action.

### 6. Run Agent Demo

```bash
cd demo
pip install requests

# Single agent flow
python agent_demo.py

# Multi-agent intelligence demo (3 agents with different contexts)
python agent_demo.py --multi
```

---

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/tip` | POST | Record human tip `{ wallet, amount, txHash }` |
| `/verify-payment` | POST | Verify agent x402 payment `{ wallet, txHash }` |
| `/creator/:wallet/stats` | GET | Creator earnings & analytics |
| `/creator/:wallet/intelligence` | GET | Creator's Fileverse intelligence feed |
| `/transactions` | GET | Recent transactions (filterable) |

---

## 🧩 Widget Installation

Add one line to any HTML page:

```html
<script
  src="https://agenttip.xyz/widget.js"
  data-wallet="YOUR_WALLET_ADDRESS"
></script>
```

### Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `data-wallet` | Yes | Creator's Base wallet address |
| `data-api` | No | Custom API URL (default: `https://agenttip.xyz/api`) |
| `data-position` | No | `bottom-right` or `bottom-left` |
| `data-theme` | No | `dark` (default) or `light` |

---

## 🤖 Agent Payment Flow

```
Agent                     Server                    Blockchain
  │                         │                          │
  │── GET /content ────────►│                          │
  │   + X-Agent-Context     │                          │
  │   + X-Agent-Query       │                          │
  │                         │                          │
  │◄── 402 + x402 headers ─│                          │
  │                         │                          │
  │── USDC transfer ───────────────────────────────────►│
  │◄── tx hash ────────────────────────────────────────│
  │                         │                          │
  │── POST /verify-payment ►│                          │
  │   { txHash, wallet }    │── verify on-chain ──────►│
  │   + context headers     │◄── confirmed ────────────│
  │                         │                          │
  │                         │── write to Fileverse ──► IPFS
  │                         │   (async, non-blocking)  │
  │                         │                          │
  │◄── 200 OK ─────────────│                          │
  │                         │                          │
  │── GET /content ────────►│                          │
  │   X-Payment-Proof: tx   │                          │
  │◄── 200 + content ──────│                          │
```

---

## 🚢 Deployment

### Backend → Railway / Render

```bash
# Set environment variables:
PORT=3001
DATABASE_URL=postgresql://...
BASE_RPC_URL=https://mainnet.base.org
USDC_CONTRACT=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
FRONTEND_URL=https://your-frontend.vercel.app

# Build & start:
npm run build && npm start
```

### Frontend → Vercel

```bash
cd frontend
# Set NEXT_PUBLIC_API_URL to your backend URL
npx vercel
```

### Widget CDN

Serve `widget/dist/widget.js` from your backend or a CDN.

---

## 🔒 Security

- **Payment signature verification** via on-chain tx receipts
- **Wallet address validation** (EIP-55 checksummed)
- **Rate limiting** (100 req/min general, 20 req/min payments)
- **Transaction replay protection** (txHash uniqueness)
- **Shadow DOM isolation** (widget CSS doesn't leak)
- **Helmet** security headers
- **End-to-end encrypted** intelligence docs (Fileverse + IPFS)


