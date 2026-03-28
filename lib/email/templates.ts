import { resend, FROM_EMAIL } from './resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studybuddy.ai'
const APP_NAME = 'StudyBuddy'

function baseLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${previewText}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="display:inline-table;">
                <tr>
                  <td style="background:#4f46e5;border-radius:12px;padding:10px 16px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">${APP_NAME}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                ${APP_NAME} · <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">${APP_URL}</a><br/>
                You received this email because you have a ${APP_NAME} account.<br/>
                <a href="${APP_URL}/settings" style="color:#9ca3af;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.5px;">${text}</h1>`
}

function p(text: string) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;">${text}</p>`
}

function button(text: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:#4f46e5;border-radius:10px;">
        <a href="${href}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${text}</a>
      </td>
    </tr>
  </table>`
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`
}

function stat(label: string, value: string, color = '#4f46e5') {
  return `<td style="text-align:center;padding:16px 12px;background:#f9fafb;border-radius:12px;">
    <div style="font-size:28px;font-weight:700;color:${color};">${value}</div>
    <div style="font-size:12px;color:#6b7280;margin-top:4px;">${label}</div>
  </td>`
}

// ────────────────────────────────────────────────────────────
// Welcome email
// ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string
  name: string | null
}) {
  const firstName = params.name?.split(' ')[0] ?? 'there'
  const html = baseLayout(
    `${h1(`Welcome to ${APP_NAME}, ${firstName}!`)}
     ${p(`You're all set. Ask your first question and get a clear, step-by-step explanation in seconds.`)}
     ${p(`Here's what you can do on your free plan:`)}
     <ul style="margin:0 0 16px;padding-left:20px;color:#374151;font-size:15px;line-height:2;">
       <li>5 questions per day across 6 subjects</li>
       <li>Automatic 3-question quizzes after every answer</li>
       <li>Save everything to your Notebook</li>
       <li>Track your study streak</li>
     </ul>
     ${button('Start studying now', `${APP_URL}/ask`)}
     ${divider()}
     ${p(`<span style="color:#6b7280;font-size:13px;">Need more questions? <a href="${APP_URL}/upgrade" style="color:#4f46e5;">Upgrade to Pro</a> for unlimited access.</span>`)}`,
    `Welcome to ${APP_NAME}!`
  )

  return resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Welcome to ${APP_NAME}!`,
    html,
  })
}

// ────────────────────────────────────────────────────────────
// Daily study reminder
// ────────────────────────────────────────────────────────────

export async function sendDailyReminderEmail(params: {
  to: string
  name: string | null
  streak: number
  daysSinceLastStudy: number
}) {
  const firstName = params.name?.split(' ')[0] ?? 'there'
  const html = baseLayout(
    `${h1(`Don't break your streak, ${firstName}!`)}
     ${p(`It's been ${params.daysSinceLastStudy} day${params.daysSinceLastStudy !== 1 ? 's' : ''} since you last studied. Your ${params.streak}-day streak is waiting for you.`)}
     ${p(`Even answering one question today keeps your streak alive. It only takes a minute.`)}
     ${button('Study now', `${APP_URL}/ask`)}
     ${divider()}
     ${p(`<span style="color:#6b7280;font-size:13px;">Current streak: <strong>${params.streak} day${params.streak !== 1 ? 's' : ''}</strong></span>`)}`,
    `Your streak is waiting for you`
  )

  return resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Don't break your ${params.streak}-day streak!`,
    html,
  })
}

// ────────────────────────────────────────────────────────────
// Weekly progress report
// ────────────────────────────────────────────────────────────

export async function sendWeeklyReportEmail(params: {
  to: string
  name: string | null
  streak: number
  questionsThisWeek: number
  avgQuizScore: number | null
  topSubject: string | null
}) {
  const firstName = params.name?.split(' ')[0] ?? 'there'
  const scoreText = params.avgQuizScore !== null ? `${params.avgQuizScore}%` : '—'

  const html = baseLayout(
    `${h1(`Your weekly progress report`)}
     ${p(`Here's how you did this week, ${firstName}:`)}
     <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
       <tr>
         <td style="width:4px;"></td>
         ${stat('Questions asked', String(params.questionsThisWeek), '#4f46e5')}
         <td style="width:12px;"></td>
         ${stat('Day streak', String(params.streak), '#f59e0b')}
         <td style="width:12px;"></td>
         ${stat('Quiz average', scoreText, '#10b981')}
         <td style="width:4px;"></td>
       </tr>
     </table>
     ${params.topSubject ? p(`Your most-studied subject this week was <strong>${params.topSubject}</strong>. Keep it up!`) : ''}
     ${button('View full analytics', `${APP_URL}/analytics`)}
     ${divider()}
     ${p(`<span style="color:#6b7280;font-size:13px;">Keep up the great work. Consistency is the key to learning.</span>`)}`,
    `Your weekly StudyBuddy report`
  )

  return resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Your weekly progress: ${params.questionsThisWeek} questions, ${params.streak}-day streak`,
    html,
  })
}

// ────────────────────────────────────────────────────────────
// Payment confirmation
// ────────────────────────────────────────────────────────────

export async function sendPaymentConfirmationEmail(params: {
  to: string
  name: string | null
  plan: 'pro' | 'family'
  amountUsd: number
  periodEnd: string
}) {
  const firstName = params.name?.split(' ')[0] ?? 'there'
  const planName = params.plan === 'family' ? 'Family' : 'Pro'
  const formattedAmount = `$${(params.amountUsd / 100).toFixed(2)}`
  const formattedDate = new Date(params.periodEnd).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const html = baseLayout(
    `${h1(`You're now on ${APP_NAME} ${planName}!`)}
     ${p(`Thanks, ${firstName}. Your payment was processed successfully.`)}
     <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;">
       <tr>
         <td style="font-size:13px;color:#6b7280;padding:4px 0;">Plan</td>
         <td style="font-size:14px;font-weight:600;color:#111827;text-align:right;padding:4px 0;">${planName}</td>
       </tr>
       <tr>
         <td style="font-size:13px;color:#6b7280;padding:4px 0;">Amount charged</td>
         <td style="font-size:14px;font-weight:600;color:#111827;text-align:right;padding:4px 0;">${formattedAmount}/month</td>
       </tr>
       <tr>
         <td style="font-size:13px;color:#6b7280;padding:4px 0;">Next billing date</td>
         <td style="font-size:14px;font-weight:600;color:#111827;text-align:right;padding:4px 0;">${formattedDate}</td>
       </tr>
     </table>
     ${button('Start using Pro →', `${APP_URL}/ask`)}
     ${divider()}
     ${p(`<span style="color:#6b7280;font-size:13px;">To manage or cancel your subscription, visit your <a href="${APP_URL}/settings" style="color:#4f46e5;">settings page</a>. You can cancel anytime.</span>`)}`,
    `Payment confirmed — welcome to ${planName}!`
  )

  return resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Payment confirmed — welcome to ${APP_NAME} ${planName}!`,
    html,
  })
}
