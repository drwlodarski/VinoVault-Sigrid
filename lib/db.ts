import mongoose from 'mongoose'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }
global._mongooseCache = cache

export async function connectDB() {
  if (cache.conn) return cache.conn

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('Missing required environment variable: MONGODB_URI')

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then((m) => m)
      .catch((err) => {
        cache.promise = null // allow retry on next request
        throw err
      })
  }

  cache.conn = await cache.promise
  return cache.conn
}
