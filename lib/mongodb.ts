import { MongoClient } from "mongodb"

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI || process.env.MONGO_URI
if (!uri) {
  throw new Error(
    "Missing MongoDB connection string. Please set MONGODB_URI in your environment (.env).",
  )
}

const client = new MongoClient(uri, {
  maxPoolSize: parseInt(process.env.MONGO_MAX_POOL || '10'),
  minPoolSize: parseInt(process.env.MONGO_MIN_POOL || '1'),
  serverSelectionTimeoutMS: 7000,
  appName: "Biz.com",
  family: 4,
})

function createClientPromise(): Promise<MongoClient> {
  let lastErr: any
  const maxAttempts = 3
  const delayMs = 800
  const attemptConnect = async (attempt: number): Promise<MongoClient> => {
    try {
      const c = await client.connect()
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
        return attemptConnect(attempt + 1)
      }
      throw lastErr
    }
  }
  return attemptConnect(1)
}

// Use a global cached promise to survive Next.js HMR in development
const clientPromise: Promise<MongoClient> = global.__mongoClientPromise || createClientPromise()
global.__mongoClientPromise = clientPromise

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise
}

export async function getDb(dbName?: string) {
  const client = await getMongoClient()
  const name = dbName || process.env.MONGODB_DB || undefined
  return client.db(name)
}

export async function getAllBusinessSlugs(): Promise<string[]> {
  try {
    const db = await getDb()
    const businesses = await db.collection("businesses")
      .find({ status: "approved", slug: { $exists: true, $ne: "" } })
      .project({ slug: 1 })
      .toArray()
    return businesses.map(b => b.slug).filter(Boolean)
  } catch (error) {
    console.error("Error fetching business slugs:", error)
    return []
  }
}
