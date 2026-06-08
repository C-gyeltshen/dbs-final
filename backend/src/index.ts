import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { requestLogger } from './middleware/logger.js'
import { analyticsRoutes } from './routes/analyticsRoutes.js'
import { authRoutes } from './routes/authRoutes.js'
import { cartRoutes } from './routes/cartRoutes.js'
import { orderRoutes } from './routes/orderRoutes.js'
import { productRoutes } from './routes/productRoutes.js'
import { userRoutes } from './routes/userRoutes.js'

const app = new Hono()

app.use('*', requestLogger)

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'https://final-dbs.netlify.app',
    ],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/auth', authRoutes)
app.route('/cart', cartRoutes)
app.route('/orders', orderRoutes)
app.route('/analytics', analyticsRoutes)
app.route('/products', productRoutes)
app.route('/users', userRoutes)

serve({
  fetch: app.fetch,
  port: 8080
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
