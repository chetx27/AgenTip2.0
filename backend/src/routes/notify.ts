import express from 'express'
import cron from 'node-cron'
import prisma from '../lib/prisma'
import { sendDailySummaryEmail } from '../lib/email'
import { getBestYieldStrategy } from '../lib/elsa'
import { statsLimiter } from '../middleware/rateLimit'
import { isValidAddress } from '../lib/verify'
import { requireAuth } from '../middleware/auth'

const router = express.Router()

// POST /notify/register
// Creator registers their email and preferred summary time
router.post('/register', requireAuth, statsLimiter, async (req, res) => {
  const { walletAddress, email, summaryTime } = req.body
  
  // Security check: Only allow modifying own profile
  if (req.user?.wallet !== walletAddress.toLowerCase()) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email required' })
    return;
  }
  
  if (!walletAddress || !isValidAddress(walletAddress)) {
    res.status(400).json({ error: 'Invalid wallet address' })
    return;
  }

  const normalizedWallet = walletAddress.toLowerCase();

  await prisma.creator.upsert({
    where: { wallet: normalizedWallet },
    update: {
      email,
      summaryTime: summaryTime || '20:00',
      notificationsEnabled: true
    },
    create: {
      wallet: normalizedWallet,
      email,
      summaryTime: summaryTime || '20:00',
      notificationsEnabled: true
    }
  })

  // Send a welcome email immediately
  await resendWelcome(email, normalizedWallet, summaryTime || '20:00')

  res.json({
    success: true,
    message: `Daily summary will be sent to ${email} at ${summaryTime || '20:00'} every day`
  })
})

// POST /notify/test
// Sends an immediate test summary email
router.post('/test', requireAuth, statsLimiter, async (req, res) => {
  const { walletAddress } = req.body
  
  // Security check
  if (req.user?.wallet !== walletAddress.toLowerCase()) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (!walletAddress || !isValidAddress(walletAddress)) {
    res.status(400).json({ error: 'Invalid wallet address' })
    return;
  }

  const normalizedWallet = walletAddress.toLowerCase();

  const creator = await prisma.creator.findUnique({
    where: { wallet: normalizedWallet }
  })

  if (!creator?.email) {
    res.status(400).json({ error: 'No email registered' })
    return;
  }

  const sent = await triggerSummaryEmail(normalizedWallet, creator.email)
  res.json({ success: sent, message: sent ? `Test email sent to ${creator.email}` : 'Email failed' })
})

// PUT /notify/schedule
// Updates summary time
router.put('/schedule', requireAuth, statsLimiter, async (req, res) => {
  const { walletAddress, summaryTime } = req.body
  
  // Security check
  if (req.user?.wallet !== walletAddress.toLowerCase()) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (!walletAddress || !isValidAddress(walletAddress)) {
    res.status(400).json({ error: 'Invalid wallet address' })
    return;
  }

  await prisma.creator.update({
    where: { wallet: walletAddress.toLowerCase() },
    data: { summaryTime }
  })

  res.json({ success: true, message: `Daily summary rescheduled to ${summaryTime}` })
})

// DELETE /notify/unsubscribe
router.delete('/unsubscribe', requireAuth, statsLimiter, async (req, res) => {
  const { walletAddress } = req.body
  
  // Security check
  if (req.user?.wallet !== walletAddress.toLowerCase()) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  if (!walletAddress || !isValidAddress(walletAddress)) {
    res.status(400).json({ error: 'Invalid wallet address' })
    return;
  }

  await prisma.creator.update({
    where: { wallet: walletAddress.toLowerCase() },
    data: { notificationsEnabled: false }
  })

  res.json({ success: true, message: 'Unsubscribed from daily summaries' })
})

// Internal: build and send the summary email
async function triggerSummaryEmail(walletAddress: string, email: string): Promise<boolean> {
  try {
    const [statsRes, txRes] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          creatorWallet: walletAddress,
          createdAt: { gte: startOfDay() }
        }
      }),
      prisma.transaction.findMany({
        where: {
          creatorWallet: walletAddress,
          createdAt: { gte: startOfYesterday(), lt: startOfDay() }
        }
      })
    ])

    const todayTxs = statsRes
    const yesterdayTxs = txRes

    const agentTxs = todayTxs.filter(t => t.type === 'agent')
    const humanTxs = todayTxs.filter(t => t.type === 'human')
    const agentTotal = agentTxs.reduce((sum, t) => sum + t.amount, 0)
    const humanTotal = humanTxs.reduce((sum, t) => sum + t.amount, 0)
    const totalToday = agentTotal + humanTotal
    const yesterdayTotal = yesterdayTxs.reduce((sum, t) => sum + t.amount, 0)

    const changePercent = yesterdayTotal > 0
      ? Math.round(((totalToday - yesterdayTotal) / yesterdayTotal) * 100)
      : null

    // Top research topics
    const topicCounts: Record<string, number> = {}
    agentTxs.forEach(tx => {
      if (tx.agentContext) {
        const topic = tx.agentContext.split(' ').slice(0, 4).join(' ')
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      }
    })
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) as [string, number][]

    // Elsa yield recommendation
    const elsa = await getBestYieldStrategy(totalToday, walletAddress)

    return await sendDailySummaryEmail({
        creatorEmail: email,
        creatorWallet: walletAddress,
        totalToday,
        agentVisits: agentTxs.length,
        agentTotal,
        humanTips: humanTxs.length,
        humanTotal,
        topTopics,
        changePercent,
        pendingBalance: totalToday,
        elsaProtocol: elsa?.protocol || null,
        elsaApy: elsa?.apy || null,
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
    })

  } catch (err) {
    console.error('Summary email error:', err)
    return false
  }
}

async function resendWelcome(email: string, wallet: string, time: string) {
  const { Resend } = require('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'summaries@agenttip.xyz',
    to: email,
    subject: '⚡ AgentTip notifications enabled',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#09090b;color:#e4e4e7;">
        <h2 style="color:#7c3aed;">You're all set ⚡</h2>
        <p>Your daily AgentTip earnings summary will arrive every day at <strong>${time}</strong>.</p>
        <p style="color:#71717a;font-size:14px;">Each summary includes your total earnings, agent visit breakdown, top research topics, and a Hey Elsa yield recommendation for your idle USDC.</p>
        <p style="color:#71717a;font-size:14px;">Wallet: ${wallet.slice(0, 8)}...${wallet.slice(-6)}</p>
      </div>
    `
  })
}

function startOfDay(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfYesterday(): Date {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export { triggerSummaryEmail }
export default router
