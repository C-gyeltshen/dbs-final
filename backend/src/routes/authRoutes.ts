import { Hono } from 'hono'
import { authController } from '../controller/authController.js'
import { loginRateLimiter } from '../middleware/rateLimiter.js'

export const authRoutes = new Hono()

authRoutes.post('/signup', authController.signup)
authRoutes.post('/login', loginRateLimiter, authController.login)
authRoutes.post('/refresh', authController.refresh)
authRoutes.post('/logout', authController.logout)
authRoutes.get('/me', authController.me)
