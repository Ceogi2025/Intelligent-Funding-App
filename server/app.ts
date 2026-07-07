import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import institutionRoutes from './routes/institutions.js'
import paymentRoutes from './routes/payments.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'
import chatRoutes from './routes/chat.js'

const app = express()

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173']

app.use(cors({ origin: allowedOrigins, credentials: true }))

// Stripe webhook must receive raw body — before json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/institutions', institutionRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api', publicRoutes)

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

export default app
