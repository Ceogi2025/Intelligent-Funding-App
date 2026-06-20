import app from '../server/app.js'
import { initSchema } from '../server/db/database.js'
import { seedDatabase, seedAdmin } from '../server/db/seed.js'

// Initialize DB once per serverless instance (cached across warm invocations)
const ready = initSchema()
  .then(() => seedDatabase())
  .then(() => seedAdmin())
  .catch(err => console.error('DB init error:', err))

export default async function handler(req: object, res: object) {
  await ready
  return app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1])
}
