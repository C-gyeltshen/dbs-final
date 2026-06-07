'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import type { PublicUser } from '@/lib/auth'

const routeForRole = (role: PublicUser['role']) => {
  if (role === 'SELLER') return '/seller/dashboard'
  if (role === 'ADMIN') return '/admin/dashboard'
  return '/'
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles?: PublicUser['role'][]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { status, user } = useAuth()
  const isAllowedRole = !allowedRoles || (!!user && allowedRoles.includes(user.role))

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    if (status === 'authenticated' && user && !isAllowedRole) {
      router.replace(routeForRole(user.role))
    }
  }, [isAllowedRole, pathname, router, status, user])

  if (status === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center bg-white px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ececef] border-t-[#F36A1D]" />
      </main>
    )
  }

  if (status === 'unauthenticated' || !isAllowedRole) {
    return null
  }

  return children
}
