import { Hono } from 'hono'
import { mongoDb } from '../lib/mongo.js'

export const analyticsRoutes = new Hono()

analyticsRoutes.get('/revenue', async (c) => {
  const revenue = await mongoDb
    .collection('Order')
    .aggregate([
      {
        $match: {
          status: 'DELIVERED',
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          revenue: { $round: ['$revenue', 2] },
          orderCount: 1,
        },
      },
      {
        $sort: {
          year: 1,
          month: 1,
        },
      },
    ])
    .toArray()

  return c.json({ revenue })
})

analyticsRoutes.get('/top-products', async (c) => {
  const topProducts = await mongoDb
    .collection('OrderItem')
    .aggregate([
      {
        $group: {
          _id: '$productId',
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: { $multiply: ['$quantity', '$price'] } },
        },
      },
      {
        $sort: {
          totalQuantity: -1,
          totalRevenue: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'Product',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          productId: { $toString: '$_id' },
          productName: '$product.name',
          totalQuantity: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
        },
      },
    ])
    .toArray()

  return c.json({ topProducts })
})
