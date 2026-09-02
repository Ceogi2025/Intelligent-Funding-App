// ─── Email ───────────────────────────────────────────────────────────────────
// A subscription business that cannot reach its members is leaking revenue by
// design: no welcome, no "your trial ends tomorrow", no win-back.
//
// Deliberately dependency-free. Resend's HTTP API is a single fetch, which
// keeps the serverless bundle small and avoids an SMTP connection that Vercel
// functions handle badly. If RESEND_API_KEY is absent the module logs and
// no-ops, so local development and the current production deploy keep working
// untouched until Grams adds a key.

type SendArgs = { to: string; subject: string; heading: string; body: string[]; cta?: { label: string; url: string } }

const FROM = process.env.EMAIL_FROM || 'Intelligent Funding <hello@intelligentfunding.org>'
const SITE = process.env.PUBLIC_SITE_URL || 'https://www.intelligentfunding.org'

function shell(heading: string, body: string[], cta?: { label: string; url: string }): string {
  const paras = body.map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151">${p}</p>`).join('')
  const button = cta
    ? `<a href="${cta.url}" style="display:inline-block;background:#0891b2;color:#fff;font-weight:700;font-size:15px;padding:13px 26px;border-radius:8px;text-decoration:none">${cta.label}</a>`
    : ''
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f8fb">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;padding:32px 12px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,.08)">
<tr><td style="background:#1e40af;padding:22px 28px">
<span style="color:#fff;font-weight:800;font-size:17px;letter-spacing:.02em">INTELLIGENT</span>
<span style="color:#67e8f9;font-weight:800;font-size:17px;letter-spacing:.02em"> FUNDING</span>
</td></tr>
<tr><td style="padding:30px 28px">
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:#0F1117">${heading}</h1>
${paras}${button}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #E5E7EB;background:#fafbfc">
<p style="margin:0;font-size:12px;line-height:1.6;color:#6B7280">
Educational information only, not financial advice. Intelligent Funding is not a credit repair
organization and does not repair credit or dispute items on your behalf.<br>
Vault Capital Group LLC · <a href="${SITE}" style="color:#0891b2">intelligentfunding.org</a>
</p></td></tr>
</table></td></tr></table></body></html>`
}

export async function sendEmail({ to, subject, heading, body, cta }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.log(`[email] skipped (no RESEND_API_KEY): "${subject}" to ${to}`)
    return false
  }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html: shell(heading, body, cta) }),
    })
    if (!r.ok) {
      console.error('[email] send failed:', r.status, await r.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    // Never let an email failure break a signup or a login.
    console.error('[email] error:', err)
    return false
  }
}

// ─── The three that matter ───────────────────────────────────────────────────

export function sendWelcome(to: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Your funding blueprint is ready to build',
    heading: "You're in. Here's the first move.",
    body: [
      'Most people apply for credit in the order the ads reach them, get denied, and never find out why. That is the pattern we built this to break.',
      '<b>Run the Strategy Engine first.</b> Nine questions, about two minutes, and they match what Credit Karma already shows you so you can copy the numbers straight across.',
      'What comes back is a numbered plan: which institutions, in what order, on which bureau, and when. If the honest answer is that you are not ready yet, it will tell you that too, and tell you exactly what to fix first.',
    ],
    cta: { label: 'Build my blueprint', url: `${SITE}/strategy` },
  })
}

export function sendTrialEnding(to: string, daysLeft: number): Promise<boolean> {
  const when = daysLeft <= 1 ? 'tomorrow' : `in ${daysLeft} days`
  return sendEmail({
    to,
    subject: `Your trial ends ${when}`,
    heading: `Your trial ends ${when}`,
    body: [
      `Your $1 trial ends ${when}, and it becomes $29/month unless you cancel. No tricks, and you can cancel anytime from your account.`,
      'Before it does, make sure you have gotten the value out of it: run the engine if you have not, save your blueprint so it is there whenever you need it, and log any application you have made so your funding map starts tracking your inquiry lanes.',
      'If it has not been useful, cancel. We would rather you leave clean than pay for something you are not using.',
    ],
    cta: { label: 'Open my blueprint', url: `${SITE}/blueprint` },
  })
}

export function sendComeBack(to: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Your inquiry lanes have been resting',
    heading: 'It has been a minute, and that is not a bad thing',
    body: [
      'Inquiries age. A lane that was too hot to touch a few months ago may be open now, and your plan should be re-read against where your credit actually sits today, not where it sat when you started.',
      'Re-running the engine takes two minutes and rebuilds your blueprint from scratch.',
    ],
    cta: { label: 'Re-run my plan', url: `${SITE}/strategy` },
  })
}
