import Link from 'next/link'
import { BrandMark } from './icons'

const FOOTER_LINKS = [
  {
    title: 'Shop',
    links: ['Electronics', 'Accessories', 'Furniture', 'Household'],
  },
  {
    title: 'Support',
    links: ['Contact', 'Shipping', 'Returns', 'Warranty'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Privacy', 'Terms'],
  },
]

export function Footer() {
  return (
    <footer
      className="border-t border-[#ececef] bg-white px-4 pt-8 sm:px-6 sm:pt-10 lg:px-[clamp(20px,3.2vw,48px)]"
      data-enter="hero"
    >
      <div className="mx-auto grid max-w-[1360px] grid-cols-1 gap-8 lg:grid-cols-[1.2fr_2fr] lg:gap-12">
        <div>
          <Link href="/" className="mb-5 grid h-12 w-12 place-items-center sm:h-14 sm:w-14" aria-label="1MinuteShop home">
            <BrandMark />
          </Link>
          <p className="max-w-[330px] text-sm font-medium leading-[1.55] text-[#686e78] sm:text-base">
            Quick deals, saved carts, and everyday essentials delivered with a cleaner shopping experience.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h2 className="mb-3 text-sm font-[800] uppercase tracking-[1.4px] text-[#15171d]">
                {group.title}
              </h2>
              <ul className="space-y-2.5">
                {group.links.map((label) => (
                  <li key={label}>
                    <Link
                      href="/"
                      className="text-sm font-semibold text-[#686e78] transition-colors hover:text-[#F36A1D]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[1360px] flex-col gap-3 border-t border-[#ececef] py-5 text-sm font-semibold text-[#7a808a] sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 1MinuteShop. All rights reserved.</p>
        <p>Customer, seller, and admin access uses the main login.</p>
      </div>
    </footer>
  )
}
