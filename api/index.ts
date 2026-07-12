import type { Request, Response } from 'express'
import app from '../server/app.js'
import { initSchema } from '../server/db/database.js'
import { seedDatabase, seedAdmin, seedProductUpdates, seedWins, seedBusinessLenders } from '../server/db/seed.js'

let initialized = false

async function ensureReady(): Promise<void> {
  if (initialized) return
  await initSchema()
  await seedDatabase()
  await seedAdmin()
  await seedProductUpdates()
  await seedWins()
  await seedBusinessLenders()
  initialized = true
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureReady()
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('DB init failed:', detail)
    res.status(500).json({ error: 'Database connection failed', detail })
    return
  }
  app(req, res)
}
