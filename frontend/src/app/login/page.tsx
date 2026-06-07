import type { Metadata } from 'next'
import { AuthCard } from '@/components/AuthCard'

export const metadata: Metadata = {
  title: 'Log in — 1MinuteShop',
  description: 'Log in to your 1MinuteShop account.',
}

export default function LoginPage() {
  return <AuthCard mode="login" />
}
