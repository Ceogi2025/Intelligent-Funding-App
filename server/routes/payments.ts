import { Router } from 'express'
import type { Request, Response } from 'express'
import Stripe from 'stripe'
import { getPool } from '../db/database.js'
import { requireAuth } from '../middleware/auth.js'
import type { AuthRequest } from '../middleware/auth.js'

const router = Router()

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const PRICE_IDS = {
  trial: process.env.STRIPE_PRICE_TRIAL || '',
  monthly: process.env.STRIPE_PRICE_MONTHLY || '',
  annual: process.env.STRIPE_PRICE_ANNUAL || '',
}

function getStripe(): Stripe {
  if (!STRIPE_SECRET) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(STRIPE_SECRET)
}

router.post('/create-checkout', requireAuth, async (req: AuthRequest, res: Response) => {
  const { plan } = req.body
  if (!['trial', 'monthly', 'annual'].includes(plan)) {
    res.status(400).json({ error: 'Invalid plan' })
    return
  }
  if (!STRIPE_SECRET) {
    res.status(503).json({ error: 'Payment processing not configured. Contact support.' })
    return
  }

  try {
    const stripe = getStripe()
    const pool = getPool()
    const { rows } = await pool.query('SELECT id, email, stripe_customer_id FROM users WHERE id = $1', [req.user!.id])
    const user = rows[0] as { id: number; email: string; stripe_customer_id: string | null }

    let customerId = user.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email })
      customerId = customer.id
      await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, user.id])
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS]
    if (!priceId) {
      res.status(503).json({ error: 'Plan not configured. Contact support.' })
      return
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL || 'http://localhost:5173'}/home?payment=success`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:5173'}/?payment=cancelled`,
      metadata: { user_id: String(user.id), plan },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    res.status(500).json({ error: 'Payment session creation failed' })
  }
})

router.post('/webhook', async (req: Request, res: Response) => {
  if (!STRIPE_SECRET) { res.status(200).send(); return }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'] as string, STRIPE_WEBHOOK_SECRET)
  } catch {
    res.status(400).send()
    return
  }

  const pool = getPool()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const plan = session.metadata?.plan
    if (userId && plan) {
      const endDate = plan === 'trial'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : plan === 'monthly'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      await pool.query(
        'UPDATE users SET subscription_status = $1, subscription_end_date = $2 WHERE id = $3',
        [plan === 'trial' ? 'trial' : 'active', endDate, parseInt(userId)]
      )
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const { rows } = await pool.query('SELECT id FROM users WHERE stripe_customer_id = $1', [sub.customer as string])
    if (rows[0]) {
      await pool.query("UPDATE users SET subscription_status = 'inactive' WHERE id = $1", [rows[0].id])
    }
  }

  res.status(200).send()
})

router.post('/portal', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!STRIPE_SECRET) { res.status(503).json({ error: 'Payment not configured' }); return }

  try {
    const stripe = getStripe()
    const pool = getPool()
    const { rows } = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.user!.id])
    const user = rows[0] as { stripe_customer_id: string | null }

    if (!user?.stripe_customer_id) {
      res.status(400).json({ error: 'No subscription found' })
      return
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.APP_URL || 'http://localhost:5173'}/home`,
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Portal error:', err)
    res.status(500).json({ error: 'Portal creation failed' })
  }
})

export default router
