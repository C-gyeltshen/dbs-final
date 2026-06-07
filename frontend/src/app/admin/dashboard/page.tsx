import type { Metadata } from 'next'
import { AdminDashboard } from '@/components/AdminDashboard'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const metadata: Metadata = {
  title: 'Admin Dashboard — 1MinuteShop',
  description: 'View customers, products, and sellers.',
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
