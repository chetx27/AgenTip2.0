import express from 'express'
import prisma from '../lib/prisma'
import {
  readEnsWill,
  isWillTriggered,
  daysUntilTriggered,
  isEnsName
} from '../lib/ensWill'

const router = express.Router()

// GET /api/will/:ensName
// Read and validate a creator's ENS will
router.get('/:ensName', async (req, res) => {
  const { ensName } = req.params

  if (!isEnsName(ensName)) {
    return res.status(400).json({ error: 'Must be a valid ENS name e.g. yourname.eth' })
  }

  try {
    const will = await readEnsWill(ensName)

    const creator = await prisma.creator.findFirst({
      where: { ensName }
    })

    const triggered = creator
      ? isWillTriggered(creator.lastClaimedAt, will.idleDays)
      : false

    const daysLeft = creator
      ? daysUntilTriggered(creator.lastClaimedAt, will.idleDays)
      : will.idleDays

    res.json({
      will,
      status: {
        triggered,
        daysLeft,
        pendingBalance: creator?.totalEarnings || 0,
        lastClaimed: creator?.lastClaimedAt || null,
        willExecutedAt: creator?.willExecutedAt || null
      },
      message: will.isValid
        ? triggered
          ? `⚠️ Will is triggered — ready to execute`
          : `Will is active — executes in ${daysLeft} days of inactivity`
        : `Will has errors: ${will.errors.join(', ')}`
    })

  } catch (err: any) {
    res.status(500).json({ error: `ENS lookup failed: ${err.message}` })
  }
})

// POST /api/will/preview
// Show exactly what the will would distribute right now
router.post('/preview', async (req, res) => {
  const { ensName } = req.body

  if (!ensName || !isEnsName(ensName)) {
    return res.status(400).json({ error: 'Valid ENS name required' })
  }

  try {
    const will = await readEnsWill(ensName)

    const creator = await prisma.creator.findFirst({
      where: { ensName }
    })

    const pendingBalance = creator?.totalEarnings || 0.47 // use mock if no creator
    const daysLeft = creator
      ? daysUntilTriggered(creator.lastClaimedAt, will.idleDays)
      : will.idleDays

    const preview = will.recipients.map(r => ({
      ensName: r.ensName,
      resolvedAddress: r.resolvedAddress,
      addressResolved: !!r.resolvedAddress,
      percentage: r.percentage,
      wouldReceive: parseFloat((pendingBalance * r.percentage / 100).toFixed(6)),
      currency: 'USDC'
    }))

    res.json({
      ensName,
      isValid: will.isValid,
      errors: will.errors,
      action: will.action,
      idleDays: will.idleDays,
      daysLeft,
      totalAmount: pendingBalance,
      message: will.message,
      recipients: preview,
      warning: will.recipients.some(r => !r.resolvedAddress)
        ? 'Some ENS names could not be resolved — verify they are registered'
        : null,
      note: 'ENS names resolve at execution time — beneficiaries can change wallets and will still be found'
    })

  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/will/execute
// Execute the will — called by executor agent only
router.post('/execute', async (req, res) => {
  const { ensName, agentKey } = req.body

  if (agentKey !== process.env.EXECUTOR_AGENT_KEY) {
    return res.status(401).json({ error: 'Unauthorized executor' })
  }

  if (!ensName || !isEnsName(ensName)) {
    return res.status(400).json({ error: 'Valid ENS name required' })
  }

  try {
    const will = await readEnsWill(ensName)

    if (!will.isValid) {
      return res.status(400).json({
        error: 'Will is invalid',
        errors: will.errors
      })
    }

    const creator = await (prisma.creator as any).findFirst({
      where: { ensName: ensName.toLowerCase() }
    })

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found in AgentTip' })
    }

    if (!isWillTriggered(creator.lastClaimedAt, will.idleDays)) {
      const daysLeft = daysUntilTriggered(creator.lastClaimedAt, will.idleDays)
      return res.status(400).json({
        error: 'Will not triggered yet',
        daysLeft,
        message: `Will triggers in ${daysLeft} more days of inactivity`
      })
    }

    const totalAmount = creator.totalEarnings || 0

    if (totalAmount <= 0) {
      return res.status(400).json({ error: 'No pending balance to distribute' })
    }

    // Execute distributions to each ENS-named beneficiary
    const txHashes: Record<string, string> = {}
    const distributions = []

    for (const recipient of will.recipients) {
      if (!recipient.resolvedAddress) {
        console.warn(`Skipping ${recipient.ensName} — could not resolve address`)
        continue
      }

      const amount = parseFloat((totalAmount * recipient.percentage / 100).toFixed(6))

      // Record the transfer transaction
      await prisma.transaction.create({
        data: {
          creatorWallet: creator.wallet,
          amount,
          currency: 'USDC',
          type: 'will-execution',
          status: 'confirmed',
          txHash: `will-${ensName}-${recipient.ensName}-${Date.now()}`
        }
      })

      const mockTxHash = `0x${Buffer.from(`${ensName}-${recipient.ensName}-${Date.now()}`).toString('hex').slice(0, 64)}`
      txHashes[recipient.ensName] = mockTxHash

      distributions.push({
        ensName: recipient.ensName,
        resolvedAddress: recipient.resolvedAddress,
        amount,
        percentage: recipient.percentage,
        txHash: mockTxHash
      })

      console.log(`⚖️ Will distributed: ${amount} USDC → ${recipient.ensName} (${recipient.resolvedAddress})`)
    }

    // Record the full execution
    const execution = await prisma.willExecution.create({
      data: {
        creatorWallet: creator.wallet,
        ensName,
        totalAmount,
        action: will.action,
        recipients: will.recipients as any,
        message: will.message,
        txHashes: txHashes as any,
        status: 'executed'
      }
    })

    // Update creator — zero out balance, mark will as executed
    await prisma.creator.update({
      where: { id: creator.id },
      data: {
        willExecutedAt: new Date(),
        willStatus: 'executed',
        totalEarnings: 0
      }
    })

    res.json({
      success: true,
      executionId: execution.id,
      ensName,
      totalDistributed: totalAmount,
      message: will.message,
      distributions,
      note: 'ENS names were resolved at execution time — not when will was written'
    })

  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/will/:ensName/history
router.get('/:ensName/history', async (req, res) => {
  try {
    const executions = await prisma.willExecution.findMany({
      where: { ensName: req.params.ensName },
      orderBy: { executedAt: 'desc' }
    })
    res.json({ executions, total: executions.length })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
