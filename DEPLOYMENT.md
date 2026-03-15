# AgenTip Deployment Guide

## Architecture

- **Frontend**: Deployed on Vercel (Next.js)
- **Backend**: Deployed on Railway (Node.js/Express)
- **Database**: PostgreSQL (on Railway)

## Frontend Setup (Vercel)

### Environment Variables to Set in Vercel:

1. Go to your Vercel project settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL` and set it to your Railway backend URL
   - Example: `https://agentip-production.up.railway.app`
   - This should match your actual Railway deployment URL

### Build Configuration:

- Build Command: (default - Next.js auto-detected)
- Output Directory: `.next`
- Install Command: (default)

## Backend Setup (Railway)

### Prerequisites:

1. A Railway project with PostgreSQL database
2. Environment variables configured

### Environment Variables to Set on Railway:

Copy all variables from `backend/.env.example` and set them in Railway:

```
DATABASE_URL=postgresql://...  # Your Railway PostgreSQL connection string
FRONTEND_URL=https://your-frontend-vercel-domain.vercel.app
RESEND_API_KEY=re_xxxxx  # Your Resend email API key
FROM_EMAIL=summaries@agenttip.xyz
ETH_MAINNET_RPC=https://eth.llamarpc.com
ESCROW_ADDRESS=0x...  # Your deployed Escrow contract address
X402_PAYMENT_AMOUNT=0.001
X402_ALLOW_FAKE_PAYMENTS=false
EXECUTOR_AGENT_KEY=your_secret_key
PORT=3001  # Railway will assign this automatically
NODE_ENV=production
```

### Build & Start Commands on Railway:

- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### Database Setup:

1. Railway provides a PostgreSQL database with a connection string
2. On first deployment, run migrations:
   ```bash
   railway run npm run db:migrate
   ```
3. Or use the Railway CLI:
   ```bash
   railway run npx prisma migrate deploy
   ```

## Testing the Setup

### 1. Test Backend Health:
```bash
curl https://your-railway-backend-url.up.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "service": "agenttip-backend",
  "timestamp": "2026-03-15T..."
}
```

### 2. Test Frontend → Backend Communication:
- Open your Vercel frontend
- Connect wallet and check Dashboard
- If stats load, the API connection is working

### 3. Check Logs:
- **Frontend**: Vercel Dashboard → Deployments → Logs
- **Backend**: Railway Dashboard → Deployments → Logs

## Troubleshooting

### Issue: Frontend can't reach backend (CORS error)

**Fix**: Verify `FRONTEND_URL` is set correctly in Railway backend environment variables

### Issue: Database connection fails

**Fix**: 
1. Confirm `DATABASE_URL` is correct
2. Ensure Railway PostgreSQL is running
3. Run migrations: `railway run npm run db:migrate`

### Issue: Email notifications not working

**Fix**:
1. Check `RESEND_API_KEY` is set correctly
2. Verify `FROM_EMAIL` is authorized in Resend
3. Check backend logs for error details

### Issue: Payments not verifying

**Fix**:
1. Verify `ESCROW_ADDRESS` is set correctly
2. Ensure `ETH_MAINNET_RPC` is reachable
3. Check if `X402_ALLOW_FAKE_PAYMENTS` should be `true` for testing

## Local Development

### Frontend:
```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

### Backend:
```bash
cd backend
npm install
# Create .env file with your values
npm run db:migrate  # First time only
npm run dev
```

## Key Files

- **Frontend API Config**: `frontend/src/lib/api.ts`
- **Backend Entry Point**: `backend/src/index.ts`
- **Database Schema**: `backend/prisma/schema.prisma`
- **Routes**: `backend/src/routes/`
