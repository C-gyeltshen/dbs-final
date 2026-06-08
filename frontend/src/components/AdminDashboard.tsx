'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BrandMark } from './icons'
import { API_BASE_URL } from '../lib/api'
import { getStoredAuthSession } from '../lib/auth'

type AdminTab = 'customers' | 'products' | 'sellers'

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
}

type Customer = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

type Seller = {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

type AdminProduct = {
  id: string
  name: string
  price: number
  stock: number
  category: { name: string } | null
}

const PAGE_SIZE = 10

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

function Paginator({ pagination, onPage }: Readonly<{ pagination: Pagination; onPage: (p: number) => void }>) {
  const { page, totalPages, total } = pagination
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-[#ececef] px-5 py-3 text-sm text-[#686e78]">
      <span>
        Page {page} of {totalPages} &mdash; {total} record{total !== 1 ? 's' : ''}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="h-9 rounded-full bg-[#f3f4f6] px-4 text-xs font-bold text-[#4a4f59] disabled:opacity-40 hover:bg-[#ececef] disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="h-9 rounded-full bg-[#f3f4f6] px-4 text-xs font-bold text-[#4a4f59] disabled:opacity-40 hover:bg-[#ececef] disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

function StockBadge({ stock }: Readonly<{ stock: number }>) {
  if (stock === 0) {
    return <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-xs font-bold text-[#c0392b]">Out of stock</span>
  }
  if (stock < 15) {
    return <span className="rounded-full bg-[#fff8e6] px-3 py-1 text-xs font-bold text-[#9a6700]">Low stock</span>
  }
  return <span className="rounded-full bg-[#eefbf3] px-3 py-1 text-xs font-bold text-[#176236]">In stock</span>
}

function EmptyRow({ cols, message }: Readonly<{ cols: number; message: string }>) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-8 text-center text-sm text-[#8b929d]">
        {message}
      </td>
    </tr>
  )
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('customers')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerPagination, setCustomerPagination] = useState<Pagination | null>(null)
  const [customerPage, setCustomerPage] = useState(1)
  const [customerLoading, setCustomerLoading] = useState(false)

  const [sellers, setSellers] = useState<Seller[]>([])
  const [sellerPagination, setSellerPagination] = useState<Pagination | null>(null)
  const [sellerPage, setSellerPage] = useState(1)
  const [sellerLoading, setSellerLoading] = useState(false)

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [productPagination, setProductPagination] = useState<Pagination | null>(null)
  const [productPage, setProductPage] = useState(1)
  const [productLoading, setProductLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const authHeader = useCallback((): Record<string, string> => {
    const session = getStoredAuthSession()
    return session ? { Authorization: `Bearer ${session.accessToken}` } : {}
  }, [])

  const fetchCustomers = useCallback(async (page: number) => {
    setCustomerLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/customers?page=${page}&limit=${PAGE_SIZE}`, {
        headers: authHeader(),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load customers.')
      setCustomers(body.customers)
      setCustomerPagination(body.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers.')
    } finally {
      setCustomerLoading(false)
    }
  }, [authHeader])

  const fetchSellers = useCallback(async (page: number) => {
    setSellerLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/sellers?page=${page}&limit=${PAGE_SIZE}`, {
        headers: authHeader(),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load sellers.')
      setSellers(body.sellers)
      setSellerPagination(body.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sellers.')
    } finally {
      setSellerLoading(false)
    }
  }, [authHeader])

  const fetchProducts = useCallback(async (page: number) => {
    setProductLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products?page=${page}&limit=${PAGE_SIZE}`, {
        headers: authHeader(),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load products.')
      setProducts(body.products)
      setProductPagination(body.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.')
    } finally {
      setProductLoading(false)
    }
  }, [authHeader])

  useEffect(() => { fetchCustomers(customerPage) }, [fetchCustomers, customerPage])
  useEffect(() => { fetchSellers(sellerPage) }, [fetchSellers, sellerPage])
  useEffect(() => { fetchProducts(productPage) }, [fetchProducts, productPage])

  const stats = [
    { label: 'Customers', value: customerPagination ? String(customerPagination.total) : '—' },
    { label: 'Products', value: productPagination ? String(productPagination.total) : '—' },
    { label: 'Sellers', value: sellerPagination ? String(sellerPagination.total) : '—' },
    { label: 'Total stock units', value: products.length > 0 ? String(products.reduce((sum, p) => sum + p.stock, 0)) : '—' },
  ]

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 sm:px-6 sm:py-7 lg:px-[clamp(20px,3.2vw,48px)]">
      <div className="mx-auto max-w-340">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="grid h-12 w-12 place-items-center sm:h-16 sm:w-16" aria-label="1MinuteShop home">
              <BrandMark />
            </Link>
            <div>
              <p className="text-sm font-bold uppercase tracking-[1.6px] text-[#F36A1D]">Admin dashboard</p>
              <h1 className="text-[clamp(30px,4vw,52px)] font-extrabold leading-none text-[#15171d]">
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
              <p className="mt-2 text-2xl font-extrabold text-[#15171d] sm:text-3xl">{stat.value}</p>
            </article>
          ))}
        </section>

        {error && (
          <div className="mb-4 rounded-[14px] bg-[#fff1f0] px-5 py-3 text-sm font-semibold text-[#c0392b]">
            {error}
          </div>
        )}

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
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'customers' && (
              <>
                <table className="w-full min-w-170 text-left text-sm">
                  <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                    <tr>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Joined</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececef]">
                    {customerLoading && <EmptyRow cols={5} message="Loading customers…" />}
                    {!customerLoading && customers.length === 0 && <EmptyRow cols={5} message="No customers found." />}
                    {!customerLoading && customers.length > 0 && customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-[#fafafa]">
                        <td className="px-5 py-4 font-bold text-[#15171d]">{customer.name}</td>
                        <td className="px-5 py-4 text-[#686e78]">{customer.email}</td>
                        <td className="px-5 py-4 text-[#686e78] capitalize">{customer.role.toLowerCase()}</td>
                        <td className="px-5 py-4 text-[#686e78]">{fmt(customer.createdAt)}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#eefbf3] px-3 py-1 text-xs font-bold text-[#176236]">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customerPagination && (
                  <Paginator
                    pagination={customerPagination}
                    onPage={(p) => setCustomerPage(p)}
                  />
                )}
              </>
            )}

            {activeTab === 'products' && (
              <>
                <table className="w-full min-w-180 text-left text-sm">
                  <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                    <tr>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Stock</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececef]">
                    {productLoading && <EmptyRow cols={5} message="Loading products…" />}
                    {!productLoading && products.length === 0 && <EmptyRow cols={5} message="No products found." />}
                    {!productLoading && products.length > 0 && products.map((product) => (
                      <tr key={product.id} className="hover:bg-[#fafafa]">
                        <td className="px-5 py-4 font-bold text-[#15171d]">{product.name}</td>
                        <td className="px-5 py-4 text-[#686e78]">{product.category?.name ?? '—'}</td>
                        <td className="px-5 py-4 text-[#686e78]">{product.stock}</td>
                        <td className="px-5 py-4 text-[#686e78]">{money.format(product.price)}</td>
                        <td className="px-5 py-4">
                          <StockBadge stock={product.stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {productPagination && (
                  <Paginator
                    pagination={productPagination}
                    onPage={(p) => setProductPage(p)}
                  />
                )}
              </>
            )}

            {activeTab === 'sellers' && (
              <>
                <table className="w-full min-w-170 text-left text-sm">
                  <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                    <tr>
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Joined</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececef]">
                    {sellerLoading && <EmptyRow cols={5} message="Loading sellers…" />}
                    {!sellerLoading && sellers.length === 0 && <EmptyRow cols={5} message="No sellers found." />}
                    {!sellerLoading && sellers.length > 0 && sellers.map((seller) => (
                      <tr key={seller.id} className="hover:bg-[#fafafa]">
                        <td className="px-5 py-4 font-bold text-[#15171d]">{seller.name}</td>
                        <td className="px-5 py-4 text-[#686e78]">{seller.email}</td>
                        <td className="px-5 py-4 text-[#686e78] capitalize">{seller.role.toLowerCase()}</td>
                        <td className="px-5 py-4 text-[#686e78]">{fmt(seller.createdAt)}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-[#fff4ee] px-3 py-1 text-xs font-bold text-[#9d4213]">Verified</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sellerPagination && (
                  <Paginator
                    pagination={sellerPagination}
                    onPage={(p) => setSellerPage(p)}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
