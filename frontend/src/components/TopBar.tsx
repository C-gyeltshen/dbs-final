'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { BrandMark, SearchIcon, ShoppingCartIcon, HeartIcon } from './icons'

interface TopBarProps {
  cart: number
  cartBadgeRef: React.RefObject<HTMLSpanElement | null>
  onOpenCart: () => void
}

export function TopBar({ cart, cartBadgeRef, onOpenCart }: TopBarProps) {
  const { user, status, logout } = useAuth()
  const initials = user?.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const confirmLogout = () => {
    if (window.confirm('Log out of your account?')) {
      logout()
    }
  }

  return (
    /*
     * Mobile  (<640px): 2-col [logo | search], actions wrap to row 2 (col-span-2)
     * sm+     (640px+): 3-col [logo | search | actions] in one row
     */
    <header className="grid grid-cols-[48px_1fr] sm:grid-cols-[132px_1fr_auto] items-center gap-3 sm:gap-7 mb-5 sm:mb-[clamp(28px,4vw,52px)]">

      {/* Brand */}
      <div
        className="w-12 h-12 sm:w-16 sm:h-16 grid place-items-center cursor-pointer shrink-0"
        data-enter="bar"
        data-press
      >
        <BrandMark />
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 sm:gap-3.5 w-full" data-enter="bar">
        <div className="flex-1 flex items-center gap-2 sm:gap-3.5 h-11 sm:h-[62px] px-4 sm:px-[26px] bg-[#f3f4f6] border-[1.5px] border-transparent rounded-full transition-all duration-200 focus-within:bg-white focus-within:border-[#F36A1D] focus-within:shadow-[0_0_0_4px_rgba(243,106,29,0.14)]">
          <span className="text-[#9aa0ab] shrink-0"><SearchIcon size={20} sw={2}/></span>
          <input
            placeholder="Search"
            aria-label="Search products"
            className="flex-1 border-none outline-none bg-transparent text-sm sm:text-[17px] font-medium text-[#14161c] placeholder:text-[#9aa0ab] placeholder:font-medium"
          />
        </div>
        {/* Filter pill — hide on the smallest screens to save space */}
        <button
          className="grid w-11 h-11 sm:w-[62px] sm:h-[62px] place-items-center rounded-full bg-[#f3f4f6] border-0 cursor-pointer text-[#4a4f59] transition-all duration-200 hover:bg-[#e9eaee] hover:text-[#14161c] shrink-0"
          aria-label="Filters"
          data-press
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="8" x2="20" y2="8"/>
            <circle cx="9" cy="8" r="2.4" fill="#f3f4f6"/>
            <line x1="4" y1="16" x2="20" y2="16"/>
            <circle cx="15" cy="16" r="2.4" fill="#f3f4f6"/>
          </svg>
        </button>
      </div>

      {/* Actions — col-span-2 on mobile so it wraps to row 2, normal on sm+ */}
      <div
        className="col-span-2 sm:col-span-1 flex items-center justify-end gap-2 sm:gap-3.5"
        data-enter="bar"
      >
        <button
          className="relative w-11 h-11 sm:w-[54px] sm:h-[54px] grid place-items-center rounded-full bg-[#f3f4f6] border-0 cursor-pointer text-[#3a3f49] transition-all hover:bg-[#ececef] hover:text-[#14161c]"
          aria-label="Cart"
          data-press
          onClick={onOpenCart}
        >
          <ShoppingCartIcon size={21} sw={2}/>
          <span
            ref={cartBadgeRef}
            className="absolute -top-[3px] -right-[3px] min-w-[20px] h-5 px-1 grid place-items-center rounded-full bg-[#F36A1D] text-white text-[10px] font-bold border-2 border-white font-mono"
          >
            {cart}
          </span>
        </button>

        <button
          className="w-11 h-11 sm:w-[54px] sm:h-[54px] grid place-items-center rounded-full bg-[#f3f4f6] border-0 cursor-pointer text-[#3a3f49] transition-all hover:bg-[#ececef] hover:text-[#14161c]"
          aria-label="Wishlist"
          data-press
        >
          <HeartIcon size={21} sw={2}/>
        </button>

        {status === 'authenticated' && user ? (
          <div className="flex items-center gap-2 rounded-full bg-[#f3f4f6] p-1.5 pr-2 sm:pr-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1b1d23] text-xs font-bold text-white sm:h-[42px] sm:w-[42px]">
              {initials || user.name[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden max-w-[150px] sm:block">
              <p className="truncate text-sm font-bold leading-tight text-[#14161c]">{user.name}</p>
              <p className="truncate text-xs font-medium leading-tight text-[#686e78]">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={confirmLogout}
              className="rounded-full px-3 py-2 text-xs font-bold text-[#F36A1D] transition-colors hover:bg-white hover:text-[#d95a1a]"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex h-11 items-center rounded-full bg-[#1b1d23] px-4 text-sm font-bold text-white transition-colors hover:bg-[#2c2f38] sm:h-[54px] sm:px-5"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  )
}
