'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { useAuth } from './AuthProvider'
import { BrandMark } from './icons'
import { PublicUser } from '@/lib/auth'

type AuthMode = 'login' | 'signup' | 'seller-login' | 'admin-login'

interface AuthCardProps {
  mode: AuthMode
}

const AUTH_COPY = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Log in to 1MinuteShop',
    subtitle: 'Pick up your saved cart, wishlist, and faster checkout.',
    button: 'Log in',
    switchText: 'New to 1MinuteShop?',
    switchHref: '/signup',
    switchLabel: 'Create account',
    success: 'Logged in successfully. Redirecting to the store.',
    panelEyebrow: 'Members sale',
    panelTitle: 'Faster\nCheckout',
    panelSubtitle: 'Save your cart, get member prices, and move from browse to checkout in one minute.',
    panelStats: ['Saved cart', 'Fast pay', '20% off'],
  },
  signup: {
    eyebrow: 'Create account',
    title: 'Join 1MinuteShop',
    subtitle: 'Start shopping with saved preferences and quick email checkout.',
    button: 'Create account',
    switchText: 'Already have an account?',
    switchHref: '/login',
    switchLabel: 'Log in',
    success: 'Account created successfully. Redirecting to the store.',
    panelEyebrow: 'Members sale',
    panelTitle: 'Faster\nCheckout',
    panelSubtitle: 'Save your cart, get member prices, and move from browse to checkout in one minute.',
    panelStats: ['Saved cart', 'Fast pay', '20% off'],
  },
  'seller-login': {
    eyebrow: 'Seller portal',
    title: 'Log in as seller',
    subtitle: 'Manage products, review orders, and keep your storefront ready for customers.',
    button: 'Seller login',
    switchText: 'Shopping for yourself?',
    switchHref: '/login',
    switchLabel: 'Customer login',
    success: 'Seller login successful. Redirecting to the store.',
    panelEyebrow: 'Seller tools',
    panelTitle: 'Manage\nSales',
    panelSubtitle: 'Track inventory, update product listings, and prepare orders from one focused workspace.',
    panelStats: ['Orders', 'Products', 'Revenue'],
  },
  'admin-login': {
    eyebrow: 'Admin portal',
    title: 'Log in as admin',
    subtitle: 'Access platform controls, review activity, and keep 1MinuteShop running smoothly.',
    button: 'Admin login',
    switchText: 'Need seller access?',
    switchHref: '/seller/login',
    switchLabel: 'Seller login',
    success: 'Admin login successful. Redirecting to the store.',
    panelEyebrow: 'Admin controls',
    panelTitle: 'Operate\nThe Store',
    panelSubtitle: 'Monitor users, sellers, listings, and platform health from a secure control surface.',
    panelStats: ['Users', 'Sellers', 'Reports'],
  },
}

const routeForRole = (role: PublicUser['role']) => {
  if (role === 'SELLER') return '/seller/dashboard'
  if (role === 'ADMIN') return '/admin/dashboard'
  return '/'
}

function FieldIcon({ type }: { type: 'user' | 'mail' | 'lock' }) {
  const path = {
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="10" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
  }[type]

  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}

export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter()
  const auth = useAuth()
  const copy = AUTH_COPY[mode]
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordHelp = useMemo(
    () => mode === 'signup' ? 'Use at least 8 characters.' : 'Use the password for your account.',
    [mode]
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    try {
      const result = mode === 'signup'
        ? await auth.signup({
            name: String(formData.get('name') ?? ''),
            email,
            password,
          })
        : await auth.login({ email, password })

      setMessage(copy.success)
      setTimeout(() => router.push(routeForRole(result.user.role)), 650)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      className="min-h-screen px-4 py-5 sm:px-6 sm:py-7 lg:px-[clamp(20px,3.2vw,48px)]"
      style={{
        background: `
          radial-gradient(1200px 500px at 85% -10%, #f6f3ff 0%, rgba(255,255,255,0) 60%),
          radial-gradient(900px 500px at 10% -5%, #fff4ee 0%, rgba(255,255,255,0) 55%),
          #ffffff
        `,
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1180px] flex-col">
        <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
          <Link href="/" className="grid h-12 w-12 place-items-center sm:h-16 sm:w-16" aria-label="Go home">
            <BrandMark />
          </Link>
          <Link
            href="/"
            className="rounded-full border-[1.5px] border-[#ececef] bg-white px-4 py-2 text-sm font-semibold text-[#14161c] transition-all hover:border-[#F36A1D] hover:text-[#F36A1D] sm:px-5 sm:py-2.5"
          >
            Store
          </Link>
        </header>

        <section className="grid flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-[clamp(34px,5vw,74px)]">
          <div
            className="relative order-2 min-h-[260px] overflow-hidden rounded-[26px] p-6 sm:min-h-[340px] sm:p-8 lg:order-1 lg:min-h-[600px] lg:p-[clamp(34px,4vw,56px)]"
            style={{ background: 'linear-gradient(118deg, #e7eefb 0%, #eee9f6 46%, #fbeadf 100%)' }}
          >
            <div className="relative z-[2] max-w-[360px]">
              <p className="mb-3 text-sm font-bold uppercase tracking-[1.8px] text-[#F36A1D]">
                {copy.panelEyebrow}
              </p>
              <h1 className="mb-4 text-[clamp(38px,6vw,76px)] font-[800] uppercase leading-[0.92] text-[#15171d]">
                {copy.panelTitle.split('\n').map((line, index) => (
                  <span key={line}>
                    {line}
                    {index === 0 && <br />}
                  </span>
                ))}
              </h1>
              <p className="max-w-[300px] text-sm font-medium leading-[1.5] text-[#5d636e] sm:text-base lg:text-[18px]">
                {copy.panelSubtitle}
              </p>
            </div>

            <div className="absolute bottom-5 left-5 right-5 z-[2] grid grid-cols-3 gap-2 sm:bottom-8 sm:left-8 sm:right-auto sm:w-[390px] sm:gap-3">
              {copy.panelStats.map((label) => (
                <div key={label} className="rounded-[18px] bg-white/72 px-3 py-3 text-center text-xs font-bold text-[#1b1d23] backdrop-blur sm:text-sm">
                  {label}
                </div>
              ))}
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/products/hero-headphones.png"
              alt="Wireless headphones"
              className="absolute bottom-[70px] right-[-18px] h-[180px] w-[180px] rounded-[22px] object-cover shadow-[0_26px_60px_rgba(40,30,20,0.22)] sm:bottom-[96px] sm:right-8 sm:h-[260px] sm:w-[260px] lg:bottom-auto lg:right-[-12px] lg:top-1/2 lg:h-[360px] lg:w-[360px] lg:-translate-y-1/2"
            />
          </div>

          <div className="order-1 lg:order-2">
            <div className="mx-auto w-full max-w-[510px] rounded-[26px] border border-[#ececef] bg-white p-5 shadow-[0_24px_80px_rgba(20,22,28,0.08)] sm:p-8 lg:p-10">
              <div className="mb-8">
                <p className="mb-2 text-sm font-bold uppercase tracking-[1.6px] text-[#F36A1D]">{copy.eyebrow}</p>
                <h2 className="text-[clamp(30px,4vw,46px)] font-[800] leading-[1] text-[#15171d]">{copy.title}</h2>
                <p className="mt-3 text-sm font-medium leading-[1.5] text-[#686e78] sm:text-base">{copy.subtitle}</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === 'signup' && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#20242c]">Full name</span>
                    <span className="flex h-12 items-center gap-3 rounded-full bg-[#f3f4f6] px-4 text-[#8b929d] transition-all focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(243,106,29,0.14)] sm:h-[58px] sm:px-5">
                      <FieldIcon type="user" />
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        required
                        placeholder="Karma Dorji"
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#14161c] outline-none placeholder:text-[#9aa0ab] sm:text-base"
                      />
                    </span>
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#20242c]">Email address</span>
                  <span className="flex h-12 items-center gap-3 rounded-full bg-[#f3f4f6] px-4 text-[#8b929d] transition-all focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(243,106,29,0.14)] sm:h-[58px] sm:px-5">
                    <FieldIcon type="mail" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#14161c] outline-none placeholder:text-[#9aa0ab] sm:text-base"
                    />
                  </span>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#20242c]">Password</span>
                  <span className="flex h-12 items-center gap-3 rounded-full bg-[#f3f4f6] px-4 text-[#8b929d] transition-all focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(243,106,29,0.14)] sm:h-[58px] sm:px-5">
                    <FieldIcon type="lock" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                      minLength={mode === 'signup' ? 8 : undefined}
                      placeholder="Enter password"
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#14161c] outline-none placeholder:text-[#9aa0ab] sm:text-base"
                    />
                    <button
                      type="button"
                      className="shrink-0 text-xs font-bold text-[#F36A1D] transition-colors hover:text-[#d95a1a]"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </span>
                  <span className="mt-2 block text-xs font-medium text-[#7a808a]">{passwordHelp}</span>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#4a4f59]">
                    <input type="checkbox" className="h-4 w-4 accent-[#F36A1D]" />
                    Remember me
                  </label>
                  {mode === 'login' && (
                    <Link href="/login" className="text-sm font-bold text-[#F36A1D] hover:text-[#d95a1a]">
                      Forgot password?
                    </Link>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || auth.status === 'loading'}
                  className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-[#1b1d23] px-6 text-base font-bold text-white shadow-[0_12px_28px_rgba(20,22,28,0.18)] transition-all hover:bg-[#2c2f38] disabled:cursor-not-allowed disabled:bg-[#737780] sm:h-[58px]"
                >
                  {isSubmitting ? 'Please wait...' : copy.button}
                </button>

                {message && (
                  <p className="rounded-[18px] bg-[#eefbf3] px-4 py-3 text-sm font-semibold text-[#176236]" role="status">
                    {message}
                  </p>
                )}

                {error && (
                  <p className="rounded-[18px] bg-[#fff1f1] px-4 py-3 text-sm font-semibold text-[#9c2020]" role="alert">
                    {error}
                  </p>
                )}
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#ececef]" />
                <span className="text-xs font-bold uppercase tracking-[1.4px] text-[#9aa0ab]">or</span>
                <span className="h-px flex-1 bg-[#ececef]" />
              </div>

              <button
                type="button"
                className="flex h-12 w-full items-center justify-center gap-3 rounded-full border-[1.5px] border-[#ececef] bg-white px-5 text-sm font-bold text-[#14161c] transition-all hover:border-[#F36A1D] hover:text-[#F36A1D] sm:h-[56px] sm:text-base"
              >
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f3f4f6] font-mono text-sm text-[#F36A1D]">G</span>
                Continue with Google
              </button>

              <p className="mt-6 text-center text-sm font-medium text-[#686e78]">
                {copy.switchText}{' '}
                <Link href={copy.switchHref} className="font-bold text-[#F36A1D] hover:text-[#d95a1a]">
                  {copy.switchLabel}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
