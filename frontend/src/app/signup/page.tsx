import type { Metadata } from 'next'
import { AuthCard } from '@/components/AuthCard'

export const metadata: Metadata = {
  title: 'Sign up — 1MinuteShop',
  description: 'Create your 1MinuteShop account.',
}

export default function SignupPage() {
  return <AuthCard mode="signup" />
}
