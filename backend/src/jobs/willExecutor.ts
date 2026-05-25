import cron from 'node-cron'
import prisma from '../lib/prisma'
import { readEnsWill, isWillTriggered, daysUntilTriggered } from '../lib/ensWill'

export function startWillExecutorCron() {
  // Check every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('\n⚖️ ENS Will executor checking all creators...')

    const creators = await prisma.creator.findMany({
      where: {
        ensName: { not: null },
        willStatus: { not: 'executed' },
        totalEarnings: { gt: 0 }
      }
    })

    console.log(`Checking ${creators.length} creators with ENS names...`)

    for (const creator of creators) {
      if (!creator.ensName) continue

      try {
        const will = await readEnsWill(creator.ensName)

        if (!will.isValid) {
          console.log(`⚠️ ${creator.ensName} has invalid will: ${will.errors.join(', ')}`)
          continue
        }

        const triggered = isWillTriggered(creator.lastClaimedAt, will.idleDays)
        const daysLeft = daysUntilTriggered(creator.lastClaimedAt, will.idleDays)

        if (triggered) {
          console.log(`⚖️ Executing will for ${creator.ensName}...`)

          const response = await fetch(
            `${process.env.BACKEND_URL}/api/will/execute`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ensName: creator.ensName,
                agentKey: process.env.EXECUTOR_AGENT_KEY
              })
            }
          )

          const result = await response.json()
          console.log(`✅ Will executed for ${creator.ensName}:`, result)

        } else if (daysLeft <= 3 && creator.email) {
          // Warn creator 3 days before will triggers
          console.log(`⚠️ Warning: ${creator.ensName}'s will triggers in ${daysLeft} days`)
          // Email warning handled by notify route (or can be integrated here)
        }

      } catch (err) {
        console.error(`Will check failed for ${creator.ensName}:`, err)
      }
    }

    console.log('⚖️ Will executor done\n')
  })

  console.log('⚖️ ENS Will executor cron started — runs daily at midnight')
}
