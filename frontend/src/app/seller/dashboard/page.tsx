import type { Metadata } from 'next'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { SellerDashboard } from '@/components/SellerDashboard'

export const metadata: Metadata = {
  title: 'Seller Dashboard — 1MinuteShop',
  description: 'Manage seller products and orders.',
}

export default function SellerDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['SELLER']}>
      <SellerDashboard />
    </ProtectedRoute>
  )
}
