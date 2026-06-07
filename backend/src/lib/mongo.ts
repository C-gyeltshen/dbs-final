import 'dotenv/config'
import { Db, MongoClient } from 'mongodb'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to connect to MongoDB.')
}

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient
  mongoDb?: Db
}

const getDatabaseName = (url: string) => {
  const { pathname } = new URL(url)
  const databaseName = pathname.replace('/', '')

  if (!databaseName) {
    throw new Error('DATABASE_URL must include a database name.')
  }

  return databaseName
}

export const mongoClient = globalForMongo.mongoClient ?? new MongoClient(databaseUrl)
export const mongoDb = globalForMongo.mongoDb ?? mongoClient.db(getDatabaseName(databaseUrl))

if (process.env.NODE_ENV !== 'production') {
  globalForMongo.mongoClient = mongoClient
  globalForMongo.mongoDb = mongoDb
}
