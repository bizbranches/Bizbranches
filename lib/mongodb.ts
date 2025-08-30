import { MongoClient } from "mongodb"

// Use a global cached promise in development to avoid creating multiple clients
// across hot reloads in Next.js
let cachedClientPromise: Promise<MongoClient> | undefined

const uri = process.env.MONGODB_URI || process.env.MONGO_URI
if (!uri) {
  throw new Error(
    "Missing MongoDB connection string. Please set MONGODB_URI in your environment (.env).",
  )
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000, // fail fast if cluster not reachable
  appName: "Biz.com",
  // Force IPv4 if IPv6/DNS is problematic in the environment
  family: 4,
})

async function connectWithRetry(maxAttempts = 3, delayMs = 1000): Promise<MongoClient> {
  let lastErr: any
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const c = await client.connect()
      // Force a ping to trigger server selection immediately
      await c.db().command({ ping: 1 })
      if (attempt > 1) {
        console.log(`[MongoDB] Connected after retry #${attempt - 1}`)
      } else {
        console.log("[MongoDB] Connected successfully")
      }
      return c
    } catch (err: any) {
      lastErr = err
      console.error(`[MongoDB] Connect attempt ${attempt} failed:`, err?.message || err)
      if (attempt < maxAttempts) {
        await new Promise(res => setTimeout(res, delayMs * attempt))
      }
    }
  }
  throw lastErr
}

if (!cachedClientPromise) {
  cachedClientPromise = connectWithRetry()
}

export async function getMongoClient(): Promise<MongoClient> {
  return cachedClientPromise as Promise<MongoClient>
}

export async function getDb(dbName?: string) {
  const client = await getMongoClient()
  return client.db(dbName)
}
