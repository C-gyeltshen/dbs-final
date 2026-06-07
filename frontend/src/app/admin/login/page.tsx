import type { Metadata } from 'next'
import { AuthCard } from '@/components/AuthCard'

export const metadata: Metadata = {
  title: 'Admin Login — 1MinuteShop',
  description: 'Log in to the 1MinuteShop admin portal.',
}

export default function AdminLoginPage() {
  return <AuthCard mode="admin-login" />
}
