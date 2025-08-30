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

const client = new MongoClient(uri)

if (!cachedClientPromise) {
  cachedClientPromise = client.connect()
}

export async function getMongoClient(): Promise<MongoClient> {
  return cachedClientPromise as Promise<MongoClient>
}

export async function getDb(dbName?: string) {
  const client = await getMongoClient()
  return client.db(dbName)
}
