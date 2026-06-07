'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BrandMark } from './icons'

type AdminTab = 'customers' | 'products' | 'sellers'

const CUSTOMERS = [
  { id: 'cus-1001', name: 'Karma Dorji', email: 'karma@example.com', orders: 8, joined: '2026-01-12' },
  { id: 'cus-1002', name: 'Pema Choden', email: 'pema@example.com', orders: 4, joined: '2026-02-03' },
  { id: 'cus-1003', name: 'Sonam Wangmo', email: 'sonam@example.com', orders: 11, joined: '2026-03-18' },
]

const PRODUCTS = [
  { id: 'p-1001', name: 'Wireless headphones', seller: 'Tech Corner', category: 'Electronics', stock: 42, price: 129.99 },
  { id: 'p-1002', name: 'Instax camera', seller: 'Photo Mart', category: 'Accessories', stock: 18, price: 89.5 },
  { id: 'p-1003', name: 'Lounge chair', seller: 'Home Base', category: 'Furniture', stock: 9, price: 240 },
]

const SELLERS = [
  { id: 'sel-1001', name: 'Tech Corner', owner: 'Tashi Dendup', email: 'seller-tech@example.com', products: 38, status: 'Verified' },
  { id: 'sel-1002', name: 'Photo Mart', owner: 'Chimi Lhamo', email: 'seller-photo@example.com', products: 16, status: 'Verified' },
  { id: 'sel-1003', name: 'Home Base', owner: 'Ugyen Dorji', email: 'seller-home@example.com', products: 24, status: 'Review' },
]

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('customers')
  const [query, setQuery] = useState('')

  const stats = [
    { label: 'Customers', value: String(CUSTOMERS.length) },
    { label: 'Products', value: String(PRODUCTS.length) },
    { label: 'Sellers', value: String(SELLERS.length) },
    { label: 'Inventory units', value: String(PRODUCTS.reduce((sum, product) => sum + product.stock, 0)) },
  ]

  const visibleCustomers = useMemo(() => CUSTOMERS.filter((customer) => (
    `${customer.name} ${customer.email}`.toLowerCase().includes(query.toLowerCase())
  )), [query])

  const visibleProducts = useMemo(() => PRODUCTS.filter((product) => (
    `${product.name} ${product.seller} ${product.category}`.toLowerCase().includes(query.toLowerCase())
  )), [query])

  const visibleSellers = useMemo(() => SELLERS.filter((seller) => (
    `${seller.name} ${seller.owner} ${seller.email}`.toLowerCase().includes(query.toLowerCase())
  )), [query])

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 sm:px-6 sm:py-7 lg:px-[clamp(20px,3.2vw,48px)]">
      <div className="mx-auto max-w-[1360px]">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="grid h-12 w-12 place-items-center sm:h-16 sm:w-16" aria-label="1MinuteShop home">
              <BrandMark />
            </Link>
            <div>
              <p className="text-sm font-bold uppercase tracking-[1.6px] text-[#F36A1D]">Admin dashboard</p>
              <h1 className="text-[clamp(30px,4vw,52px)] font-[800] leading-none text-[#15171d]">
                Platform overview
              </h1>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#1b1d23] px-5 text-sm font-bold text-white transition-colors hover:bg-[#2c2f38]"
          >
            Storefront
          </Link>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-[20px] bg-white p-4 shadow-[0_14px_44px_rgba(20,22,28,0.06)] sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[1.2px] text-[#8b929d]">{stat.label}</p>
              <p className="mt-2 text-2xl font-[800] text-[#15171d] sm:text-3xl">{stat.value}</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_14px_44px_rgba(20,22,28,0.06)]">
          <div className="flex flex-col gap-4 border-b border-[#ececef] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex flex-wrap gap-2">
              {(['customers', 'products', 'sellers'] as AdminTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`h-10 rounded-full px-4 text-sm font-bold capitalize transition-colors ${
                    activeTab === tab ? 'bg-[#F36A1D] text-white' : 'bg-[#f3f4f6] text-[#4a4f59] hover:bg-[#ececef]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search records"
              className="h-11 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none focus:bg-white focus:shadow-[0_0_0_4px_rgba(243,106,29,0.14)] sm:w-[280px]"
            />
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'customers' && (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                  <tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Orders</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-[#ececef]">
                  {visibleCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-5 py-4 font-bold text-[#15171d]">{customer.name}</td>
                      <td className="px-5 py-4 text-[#686e78]">{customer.email}</td>
                      <td className="px-5 py-4 text-[#686e78]">{customer.orders}</td>
                      <td className="px-5 py-4 text-[#686e78]">{customer.joined}</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-[#eefbf3] px-3 py-1 text-xs font-bold text-[#176236]">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'products' && (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                  <tr><th className="px-5 py-3">Product</th><th className="px-5 py-3">Seller</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Stock</th><th className="px-5 py-3">Price</th></tr>
                </thead>
                <tbody className="divide-y divide-[#ececef]">
                  {visibleProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-5 py-4 font-bold text-[#15171d]">{product.name}</td>
                      <td className="px-5 py-4 text-[#686e78]">{product.seller}</td>
                      <td className="px-5 py-4 text-[#686e78]">{product.category}</td>
                      <td className="px-5 py-4 text-[#686e78]">{product.stock}</td>
                      <td className="px-5 py-4 text-[#686e78]">{money.format(product.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'sellers' && (
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                  <tr><th className="px-5 py-3">Store</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Products</th><th className="px-5 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-[#ececef]">
                  {visibleSellers.map((seller) => (
                    <tr key={seller.id}>
                      <td className="px-5 py-4 font-bold text-[#15171d]">{seller.name}</td>
                      <td className="px-5 py-4 text-[#686e78]">{seller.owner}</td>
                      <td className="px-5 py-4 text-[#686e78]">{seller.email}</td>
                      <td className="px-5 py-4 text-[#686e78]">{seller.products}</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-[#fff4ee] px-3 py-1 text-xs font-bold text-[#9d4213]">{seller.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
