import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_MAINNET_RPC || 'https://eth.llamarpc.com')
})

export interface WillRecipient {
  ensName: string
  resolvedAddress: string | null
  percentage: number
}

export interface WillInstruction {
  ensName: string
  ownerWallet: string | null
  idleDays: number
  action: 'split' | 'donate' | 'deploy' | 'burn'
  recipients: WillRecipient[]
  message: string
  isValid: boolean
  errors: string[]
}

export async function readEnsWill(ensName: string): Promise<WillInstruction> {
  const normalized = normalize(ensName)
  const errors: string[] = []

  const [
    ownerAddress,
    idleDays,
    action,
    splitRaw,
    singleRecipient,
    message
  ] = await Promise.all([
    client.getEnsAddress({ name: normalized }).catch(() => null),
    client.getEnsText({ name: normalized, key: 'agenttip.will.idle-days' }).catch(() => null),
    client.getEnsText({ name: normalized, key: 'agenttip.will.action' }).catch(() => null),
    client.getEnsText({ name: normalized, key: 'agenttip.will.split' }).catch(() => null),
    client.getEnsText({ name: normalized, key: 'agenttip.will.recipient' }).catch(() => null),
    client.getEnsText({ name: normalized, key: 'agenttip.will.message' }).catch(() => null),
  ])

  if (!ownerAddress) errors.push('ENS name does not resolve to an address')
  if (!action) errors.push('agenttip.will.action text record not set')

  // Parse recipients
  // Format: "friend.eth:50,gitcoin.eth:50"
  const recipients: WillRecipient[] = []

  if (splitRaw) {
    const parts = splitRaw.split(',')
    let totalPct = 0

    for (const part of parts) {
      const [ens, pctStr] = part.trim().split(':')
      const pct = parseFloat(pctStr || '0')
      totalPct += pct

      // Resolve ENS name to address at execution time — not at writing time
      // This is the key creative insight: if beneficiary changes wallet, will still finds them
      let resolvedAddress: string | null = null
      try {
        resolvedAddress = await client.getEnsAddress({
          name: normalize(ens.trim())
        }) || null
      } catch {}

      recipients.push({
        ensName: ens.trim(),
        resolvedAddress,
        percentage: pct
      })
    }

    if (Math.round(totalPct) !== 100) {
      errors.push(`Percentages must total 100% — got ${totalPct}%`)
    }

  } else if (singleRecipient) {
    let resolvedAddress: string | null = null
    try {
      resolvedAddress = await client.getEnsAddress({
        name: normalize(singleRecipient)
      }) || null
    } catch {}

    recipients.push({
      ensName: singleRecipient,
      resolvedAddress,
      percentage: 100
    })
  } else {
    errors.push('No recipients set — add agenttip.will.split or agenttip.will.recipient')
  }

  return {
    ensName,
    ownerWallet: ownerAddress as string | null,
    idleDays: parseInt(idleDays || '30'),
    action: (action as WillInstruction['action']) || 'split',
    recipients,
    message: message || 'No message left by creator',
    isValid: errors.length === 0,
    errors
  }
}

export function isWillTriggered(
  lastClaimedAt: Date | null,
  idleDays: number
): boolean {
  if (!lastClaimedAt) return false
  const daysSinceClaim = Math.floor(
    (Date.now() - lastClaimedAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  return daysSinceClaim >= idleDays
}

export function daysUntilTriggered(
  lastClaimedAt: Date | null,
  idleDays: number
): number {
  if (!lastClaimedAt) return idleDays
  const daysSinceClaim = Math.floor(
    (Date.now() - lastClaimedAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  return Math.max(0, idleDays - daysSinceClaim)
}

export function isEnsName(input: string): boolean {
  return input.includes('.') && (input.endsWith('.eth') || input.split('.').length >= 2)
}

export async function resolveEnsToAddress(ensName: string): Promise<string | null> {
  try {
    return await client.getEnsAddress({ name: normalize(ensName) }) || null
  } catch {
    return null
  }
}

export async function resolveAddressToEns(address: string): Promise<string | null> {
  try {
    return await client.getEnsName({ address: address as `0x${string}` }) || null
  } catch {
    return null
  }
}
