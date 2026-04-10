import mongoose from 'mongoose'

const MONGODB_URL = process.env.MONGODB_URL

if (!MONGODB_URL) {
  throw new Error('MONGODB_URL environment variable is not set')
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Extend globalThis to cache the connection across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = globalThis.mongooseCache ?? { conn: null, promise: null }
globalThis.mongooseCache = cached

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URL!, {
      dbName: 'highandseeek_db',
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
