import 'dotenv/config'
import app from './app.js'
import { initSchema } from './db/database.js'
import { seedDatabase, seedAdmin } from './db/seed.js'

const PORT = process.env.PORT || 3001

async function start() {
  await initSchema()
  await seedDatabase()
  await seedAdmin()
  app.listen(PORT, () => {
    console.log(`Intelligent Funding API running on http://localhost:${PORT}`)
  })
}

start().catch(console.error)
