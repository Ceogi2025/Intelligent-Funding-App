import { Router, Request, Response } from 'express'
import Stripe from 'stripe'
import { getDb } from '../db/database.js'
import { requireAuth, AuthRequest } from '../middleware/auth.js'

const router = Router()

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

// Stripe price IDs — set these in .env after creating products in Stripe dashboard
const PRICE_IDS = {
  trial: process.env.STRIPE_PRICE_TRIAL || '',
  monthly: process.env.STRIPE_PRICE_MONTHLY || '',
  annual: process.env.STRIPE_PRICE_ANNUAL || '',
}

function getStripe(): Stripe {
  if (!STRIPE_SECRET) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(STRIPE_SECRET)
}

// Create Stripe checkout session
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
    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as {
      id: number; email: string; stripe_customer_id: string | null
    }

    let customerId = user.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email })
      customerId = customer.id
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, user.id)
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
      mode: plan === 'trial' ? 'subscription' : 'subscription',
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

// Stripe webhook — handles subscription events
router.post('/webhook', async (req: Request, res: Response) => {
  if (!STRIPE_SECRET) {
    res.status(200).send()
    return
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'] as string,
      STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    res.status(400).send()
    return
  }

  const db = getDb()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const userId = session.metadata?.user_id
    const plan = session.metadata?.plan

    if (userId && plan) {
      const endDate = plan === 'trial'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : plan === 'monthly'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

      db.prepare(`
        UPDATE users SET subscription_status = ?, subscription_end_date = ?
        WHERE id = ?
      `).run(plan === 'trial' ? 'trial' : 'active', endDate, parseInt(userId))
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customer = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(sub.customer as string)
    if (customer) {
      db.prepare("UPDATE users SET subscription_status = 'inactive' WHERE id = ?").run((customer as { id: number }).id)
    }
  }

  res.status(200).send()
})

// Get customer portal link
router.post('/portal', requireAuth, async (req: AuthRequest, res: Response) => {
  if (!STRIPE_SECRET) {
    res.status(503).json({ error: 'Payment not configured' })
    return
  }

  try {
    const stripe = getStripe()
    const db = getDb()
    const user = db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').get(req.user!.id) as { stripe_customer_id: string | null }

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
    res.status(500).json({ error: 'Portal creation failed' })
  }
})

export default router
