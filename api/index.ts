import type { Request, Response } from 'express'
import app from '../server/app.js'
import { initSchema } from '../server/db/database.js'
import { seedDatabase, seedAdmin } from '../server/db/seed.js'

let dbInitError: Error | null = null

const ready = initSchema()
  .then(() => seedDatabase())
  .then(() => seedAdmin())
  .catch((err: Error) => {
    dbInitError = err
    console.error('DB init error:', err.message)
  })

export default async function handler(req: Request, res: Response) {
  await ready
  if (dbInitError) {
    res.status(500).json({ error: 'Database connection failed', detail: dbInitError.message })
    return
  }
  app(req, res)
}
