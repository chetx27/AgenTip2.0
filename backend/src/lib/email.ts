import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SummaryEmailData {
  creatorEmail: string
  creatorWallet: string
  totalToday: number
  agentVisits: number
  agentTotal: number
  humanTips: number
  humanTotal: number
  topTopics: [string, number][]
  changePercent: number | null
  pendingBalance: number
  elsaProtocol: string | null
  elsaApy: number | null
  dashboardUrl: string
}

export async function sendDailySummaryEmail(data: SummaryEmailData): Promise<boolean> {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  const changeText = data.changePercent !== null
    ? `${data.changePercent >= 0 ? '📈' : '📉'} ${data.changePercent >= 0 ? '+' : ''}${data.changePercent}% vs yesterday`
    : ''

  const topicsHtml = data.topTopics.map(([topic, count]) =>
    `<tr>
      <td style="padding:8px 0;color:#a1a1aa;font-size:14px;">• ${topic}</td>
      <td style="padding:8px 0;color:#e4e4e7;font-size:14px;text-align:right;">${count} visits</td>
    </tr>`
  ).join('')

  const elsaSection = data.elsaApy && data.pendingBalance > 0 ? `
    <div style="background:#1a1a2e;border:1px solid #7c3aed;border-radius:12px;padding:24px;margin:24px 0;">
      <p style="color:#a78bfa;font-size:12px;font-weight:600;letter-spacing:1px;margin:0 0 8px;">HEY ELSA RECOMMENDATION</p>
      <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 4px;">${data.elsaApy}% APY on Base</p>
      <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">
        ${data.elsaProtocol || 'Aave v3'} · Your $${data.pendingBalance.toFixed(4)} would earn 
        <strong style="color:#e4e4e7;">$${(data.pendingBalance * data.elsaApy / 100 / 12).toFixed(4)}/month</strong> passively
      </p>
      <a href="${data.dashboardUrl}?deploy=true" 
         style="background:#7c3aed;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">
        💰 Deploy with Elsa
      </a>
    </div>
  ` : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
    <body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

        <!-- Header -->
        <div style="margin-bottom:32px;">
          <p style="color:#7c3aed;font-size:12px;font-weight:600;letter-spacing:1px;margin:0 0 8px;">AGENTTIP DAILY SUMMARY</p>
          <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 4px;">
            $${data.totalToday.toFixed(4)} USDC
          </h1>
          <p style="color:#71717a;font-size:14px;margin:0;">${date}</p>
        </div>

        <!-- Stats row -->
        <div style="display:flex;gap:12px;margin-bottom:24px;">
          <div style="flex:1;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;">
            <p style="color:#71717a;font-size:12px;margin:0 0 4px;">🤖 Agent visits</p>
            <p style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">${data.agentVisits.toLocaleString()}</p>
            <p style="color:#a1a1aa;font-size:12px;margin:4px 0 0;">$${data.agentTotal.toFixed(4)} USDC</p>
          </div>
          <div style="flex:1;background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;">
            <p style="color:#71717a;font-size:12px;margin:0 0 4px;">👤 Human tips</p>
            <p style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">${data.humanTips}</p>
            <p style="color:#a1a1aa;font-size:12px;margin:4px 0 0;">$${data.humanTotal.toFixed(4)} USDC</p>
          </div>
        </div>

        <!-- Change vs yesterday -->
        ${changeText ? `
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="color:#a1a1aa;font-size:14px;margin:0;">${changeText}</p>
        </div>
        ` : ''}

        <!-- Top topics -->
        ${data.topTopics.length > 0 ? `
        <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="color:#71717a;font-size:12px;font-weight:600;letter-spacing:1px;margin:0 0 12px;">TOP AGENT RESEARCH TODAY</p>
          <table style="width:100%;border-collapse:collapse;">
            ${topicsHtml}
          </table>
        </div>
        ` : ''}

        <!-- Elsa recommendation -->
        ${elsaSection}

        <!-- CTA -->
        <div style="text-align:center;margin-top:32px;">
          <a href="${data.dashboardUrl}" 
             style="background:#18181b;color:#a1a1aa;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;border:1px solid #27272a;display:inline-block;">
            📊 View Full Dashboard
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #18181b;margin-top:40px;padding-top:24px;text-align:center;">
          <p style="color:#3f3f46;font-size:12px;margin:0;">
            AgentTip · Built on x402 · Base Chain · USDC<br>
            <a href="${data.dashboardUrl}?unsubscribe=true" style="color:#3f3f46;">Unsubscribe</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'summaries@agenttip.xyz',
      to: data.creatorEmail,
      subject: `⚡ You earned $${data.totalToday.toFixed(4)} today — AgentTip Summary`,
      html
    })

    console.log(`📧 Summary email sent to ${data.creatorEmail}:`, result.data?.id)
    return true

  } catch (err) {
    console.error('Email send failed:', err)
    return false
  }
}
