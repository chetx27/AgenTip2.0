import cron from 'node-cron'
import prisma from '../lib/prisma'
import { triggerSummaryEmail } from '../routes/notify'

export function startDailySummaryCron() {
  // Runs every minute — checks which creators have their summary time now
  cron.schedule('* * * * *', async () => {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const creators = await prisma.creator.findMany({
      where: {
        summaryTime: currentTime,
        notificationsEnabled: true,
        email: { not: null }
      }
    })

    for (const creator of creators) {
      if (creator.email) {
        await triggerSummaryEmail(creator.wallet, creator.email)
          .catch(console.error)
      }
    }

    if (creators.length > 0) {
      console.log(`📧 Sent daily summaries to ${creators.length} creators at ${currentTime}`)
    }
  })

  console.log('📅 Daily summary email cron started')
}
