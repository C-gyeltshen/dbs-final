import { ObjectId, type ClientSession } from 'mongodb'
import { mongoClient, mongoDb } from '../lib/mongo.js'

type OrderItemInput = {
  productId: string
  quantity: number
}

type DeliveryAddressInput = {
  street: string
  city: string
  country: string
  zip: string
}

type PlaceOrderInput = {
  userId: string
  items: OrderItemInput[]
  deliveryAddress: DeliveryAddressInput
}

type ProductDocument = {
  _id: ObjectId
  name: string
  price: number
}

type OrderDocument = {
  _id: ObjectId
  userId: ObjectId
  status: 'PLACED'
  total: number
  deliveryAddress: DeliveryAddressInput
  createdAt: Date
  updatedAt: Date
}

type OrderItemDocument = {
  _id: ObjectId
  orderId: ObjectId
  productId: ObjectId
  quantity: number
  price: number
}

type CreatedOrderItem = {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
}

type CreatedOrderResult = {
  order: {
    id: string
    userId: string
    status: OrderDocument['status']
    total: number
    deliveryAddress: DeliveryAddressInput
    createdAt: string
    updatedAt: string
    items: CreatedOrderItem[]
  }
}

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message)
  }
}

const toObjectId = (value: string, fieldName: string) => {
  if (!ObjectId.isValid(value)) {
    throw new OrderError(`${fieldName} must be a valid ObjectId.`)
  }

  return new ObjectId(value)
}

const normalizeItems = (items: OrderItemInput[]) => {
  const itemMap = new Map<string, number>()

  for (const item of items) {
    if (!ObjectId.isValid(item.productId)) {
      throw new OrderError('Each item productId must be a valid ObjectId.')
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new OrderError('Each item quantity must be a positive integer.')
    }

    itemMap.set(item.productId, (itemMap.get(item.productId) ?? 0) + item.quantity)
  }

  return Array.from(itemMap.entries()).map(([productId, quantity]) => ({
    productId: new ObjectId(productId),
    quantity,
  }))
}

const normalizeDeliveryAddress = (address: DeliveryAddressInput) => {
  if (!address || typeof address !== 'object') {
    throw new OrderError('Delivery address is required.')
  }

  const normalizedAddress = {
    street: String(address.street ?? '').trim(),
    city: String(address.city ?? '').trim(),
    country: String(address.country ?? '').trim(),
    zip: String(address.zip ?? '').trim(),
  }

  if (!normalizedAddress.street || !normalizedAddress.city || !normalizedAddress.country || !normalizedAddress.zip) {
    throw new OrderError('Delivery address must include street, city, country, and zip.')
  }

  return normalizedAddress
}

const getProductsById = async (productIds: ObjectId[], session: ClientSession) => {
  const products = await mongoDb
    .collection<ProductDocument>('Product')
    .find({ _id: { $in: productIds } }, { session })
    .toArray()

  return new Map(products.map((product) => [product._id.toHexString(), product]))
}

export const orderService = {
  async placeOrder(input: PlaceOrderInput) {
    const userId = toObjectId(input.userId, 'userId')

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new OrderError('Order must contain at least one item.')
    }

    const items = normalizeItems(input.items)
    const deliveryAddress = normalizeDeliveryAddress(input.deliveryAddress)
    const session = mongoClient.startSession()

    try {
      const transactionResult = await session.withTransaction<CreatedOrderResult>(
        async () => {
          const productIds = items.map((item) => item.productId)
          const productsById = await getProductsById(productIds, session)

          if (productsById.size !== productIds.length) {
            throw new OrderError('One or more products were not found.')
          }

          for (const item of items) {
            const inventoryUpdate = await mongoDb.collection('Inventory').updateOne(
              {
                productId: item.productId,
                quantity: { $gte: item.quantity },
              },
              {
                $inc: { quantity: -item.quantity },
                $set: { updatedAt: new Date() },
              },
              { session },
            )

            if (inventoryUpdate.modifiedCount !== 1) {
              throw new OrderError(`Product ${item.productId.toHexString()} is out of stock.`, 409)
            }
          }

          const now = new Date()
          const orderItems: OrderItemDocument[] = items.map((item) => {
            const product = productsById.get(item.productId.toHexString())

            if (!product) {
              throw new OrderError('One or more products were not found.')
            }

            return {
              _id: new ObjectId(),
              orderId: new ObjectId(),
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
            }
          })
          const orderId = new ObjectId()
          const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

          const createdOrder: OrderDocument = {
            _id: orderId,
            userId,
            status: 'PLACED',
            total,
            deliveryAddress,
            createdAt: now,
            updatedAt: now,
          }

          for (const item of orderItems) {
            item.orderId = orderId
          }

          await mongoDb.collection<OrderDocument>('Order').insertOne(createdOrder, { session })
          await mongoDb.collection<OrderItemDocument>('OrderItem').insertMany(orderItems, { session })

          const createdItems = orderItems.map((item) => {
            const product = productsById.get(item.productId.toHexString())

            return {
              id: item._id.toHexString(),
              productId: item.productId.toHexString(),
              productName: product?.name ?? '',
              quantity: item.quantity,
              price: item.price,
            }
          })

          return {
            order: {
              id: createdOrder._id.toHexString(),
              userId: createdOrder.userId.toHexString(),
              status: createdOrder.status,
              total: createdOrder.total,
              deliveryAddress: createdOrder.deliveryAddress,
              createdAt: createdOrder.createdAt.toISOString(),
              updatedAt: createdOrder.updatedAt.toISOString(),
              items: createdItems,
            },
          }
        },
        {
          readConcern: { level: 'majority' },
          writeConcern: { w: 'majority' },
        },
      )

      if (!transactionResult) {
        throw new OrderError('Order could not be created.', 500)
      }

      return transactionResult
    } finally {
      await session.endSession()
    }
  },
}
