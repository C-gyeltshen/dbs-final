import type { Metadata } from 'next'
import { AuthCard } from '@/components/AuthCard'

export const metadata: Metadata = {
  title: 'Seller Login — 1MinuteShop',
  description: 'Log in to the 1MinuteShop seller portal.',
}

export default function SellerLoginPage() {
  return <AuthCard mode="seller-login" />
}
