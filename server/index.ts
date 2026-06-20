import express from 'express'
import cors from 'cors'
import { seedDatabase, seedAdmin } from './db/seed.js'
import authRoutes from './routes/auth.js'
import institutionRoutes from './routes/institutions.js'
import paymentRoutes from './routes/payments.js'
import adminRoutes from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))

// Stripe webhook needs raw body — must come before json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/institutions', institutionRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/admin', adminRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

async function start() {
  seedDatabase()
  await seedAdmin()
  app.listen(PORT, () => {
    console.log(`Intelligent Funding API running on http://localhost:${PORT}`)
  })
}

start().catch(console.error)
