import 'dotenv/config'
import { ObjectId } from 'mongodb'
import { mongoClient, mongoDb } from '../lib/mongo.js'

const categoryId = process.env.EXPLAIN_CATEGORY_ID
const userId = process.env.EXPLAIN_USER_ID
const productId = process.env.EXPLAIN_PRODUCT_ID

const parseObjectId = (value: string | undefined, fallback: string) => {
  if (value && ObjectId.isValid(value)) {
    return new ObjectId(value)
  }

  return new ObjectId(fallback)
}

const printExplain = async (name: string, explain: unknown) => {
  console.log(`\n=== ${name} ===`)
  console.log(JSON.stringify(explain, null, 2))
}

try {
  const productListingExplain = await mongoDb
    .collection('Product')
    .find({
      categoryId: parseObjectId(categoryId, '000000000000000000000001'),
      price: { $gte: 0, $lte: 500 },
    })
    .sort({ price: 1 })
    .explain('executionStats')

  await printExplain('Product listing by categoryId + price', productListingExplain)

  const orderHistoryExplain = await mongoDb
    .collection('Order')
    .find({
      userId: parseObjectId(userId, '000000000000000000000002'),
      status: 'DELIVERED',
    })
    .sort({ createdAt: -1 })
    .explain('executionStats')

  await printExplain('Order history by userId + status', orderHistoryExplain)

  const reviewLookupExplain = await mongoDb
    .collection('Review')
    .find({
      productId: parseObjectId(productId, '000000000000000000000003'),
    })
    .explain('executionStats')

  await printExplain('Review lookup by productId', reviewLookupExplain)
} finally {
  await mongoClient.close()
}
