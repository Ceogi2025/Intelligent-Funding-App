import { Router } from 'express'
import type { Request, Response } from 'express'
import { getPool } from '../db/database.js'
import { sendTrialEnding, sendComeBack } from '../lib/email.js'

// ─── Scheduled email ─────────────────────────────────────────────────────────
// Hit by a scheduler (Vercel Cron or any external pinger) rather than an
// in-process timer, because serverless functions do not stay alive to run one.
//
// Guarded by CRON_SECRET so a stranger cannot trigger a mail run. Every send is
// recorded in email_log first, so a scheduler that fires twice, or a retry
// after a timeout, cannot email the same member the same thing twice.

const router = Router()

function pgMode(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL)
}

async function alreadySent(pool: ReturnType<typeof getPool>, userId: number, kind: string): Promise<boolean> {
  const { rows } = await pool.query('SELECT 1 FROM email_log WHERE user_id = $1 AND kind = $2 LIMIT 1', [userId, kind])
  return rows.length > 0
}

async function markSent(pool: ReturnType<typeof getPool>, userId: number, kind: string): Promise<void> {
  await pool.query('INSERT INTO email_log (user_id, kind) VALUES ($1, $2)', [userId, kind])
}

router.post('/run', async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET
  const given = req.header('x-cron-secret') || (req.query.key as string | undefined)
  if (!secret || given !== secret) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const pool = getPool()
  const sent = { trialEnding: 0, comeBack: 0 }

  try {
    // Trials ending within the next 2 days.
    const endingWindow = pgMode()
      ? `subscription_end_date::timestamptz BETWEEN NOW() AND NOW() + INTERVAL '2 days'`
      : `date(subscription_end_date) BETWEEN date('now') AND date('now', '+2 days')`
    const { rows: ending } = await pool.query(
      `SELECT id, email, subscription_end_date FROM users
       WHERE subscription_status = 'trial' AND subscription_end_date IS NOT NULL AND ${endingWindow}`
    )
    for (const u of ending as Array<{ id: number; email: string; subscription_end_date: string }>) {
      if (await alreadySent(pool, u.id, 'trial_ending')) continue
      const end = new Date(u.subscription_end_date).getTime()
      const days = Math.max(1, Math.ceil((end - Date.now()) / 86400000))
      // Record before sending: a duplicate email is worse than a missed one.
      await markSent(pool, u.id, 'trial_ending')
      if (await sendTrialEnding(u.email, days)) sent.trialEnding++
    }

    // Members who signed up 30+ days ago and never came back.
    const staleWindow = pgMode()
      ? `created_at < NOW() - INTERVAL '30 days'`
      : `datetime(created_at) < datetime('now', '-30 days')`
    const { rows: stale } = await pool.query(
      `SELECT u.id, u.email FROM users u
       WHERE u.role = 'customer' AND ${staleWindow}
         AND NOT EXISTS (SELECT 1 FROM member_blueprints b WHERE b.user_id = u.id)
       LIMIT 200`
    )
    for (const u of stale as Array<{ id: number; email: string }>) {
      if (await alreadySent(pool, u.id, 'come_back')) continue
      await markSent(pool, u.id, 'come_back')
      if (await sendComeBack(u.email)) sent.comeBack++
    }

    res.json({ ok: true, sent })
  } catch (err) {
    console.error('Cron run error:', err)
    res.status(500).json({ error: 'Cron run failed' })
  }
})

export default router
