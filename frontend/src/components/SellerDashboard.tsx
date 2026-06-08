'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { BrandMark } from './icons'
import { API_BASE_URL } from '../lib/api'
import { useAuth } from './AuthProvider'

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
}

type SellerProduct = {
  id: string
  name: string
  price: number
  stock: number
  category: { name: string } | null
  createdAt: string
}

type OrderItem = {
  id: string
  quantity: number
  price: number
  product: { id: string; name: string } | null
}

type SellerOrder = {
  id: string
  status: 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'
  total: number
  createdAt: string
  user: { name: string; email: string }
  items: OrderItem[]
}

type Stats = {
  totalProducts: number
  totalStock: number
  openOrders: number
  revenue: number
}

const PAGE_SIZE = 10

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const STATUS_STYLES: Record<SellerOrder['status'], string> = {
  PLACED:    'bg-[#eef3ff] text-[#2c52b0]',
  CONFIRMED: 'bg-[#f0fdf4] text-[#15803d]',
  SHIPPED:   'bg-[#fefce8] text-[#a16207]',
  DELIVERED: 'bg-[#eefbf3] text-[#176236]',
  CANCELLED: 'bg-[#fff1f0] text-[#c0392b]',
  RETURNED:  'bg-[#f3f4f6] text-[#4a4f59]',
}

function Paginator({ pagination, onPage }: Readonly<{ pagination: Pagination; onPage: (p: number) => void }>) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t border-[#ececef] px-5 py-3 text-sm text-[#686e78]">
      <span>
        Page {pagination.page} of {pagination.totalPages} &mdash; {pagination.total} {pagination.total === 1 ? 'record' : 'records'}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
          className="h-9 rounded-full bg-[#f3f4f6] px-4 text-xs font-bold text-[#4a4f59] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#ececef]"
        >
          ← Prev
        </button>
        <button
          type="button"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}
          className="h-9 rounded-full bg-[#f3f4f6] px-4 text-xs font-bold text-[#4a4f59] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#ececef]"
        >
          Next →
        </button>
      </div>
    </div>
  )
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

function StockBadge({ stock }: Readonly<{ stock: number }>) {
  if (stock === 0) return <span className="rounded-full bg-[#fff0f0] px-3 py-1 text-xs font-bold text-[#c0392b]">Out of stock</span>
  if (stock < 15)  return <span className="rounded-full bg-[#fff8e6] px-3 py-1 text-xs font-bold text-[#9a6700]">Low stock</span>
  return <span className="rounded-full bg-[#eefbf3] px-3 py-1 text-xs font-bold text-[#176236]">In stock</span>
}

export function SellerDashboard() {
  const { accessToken } = useAuth()

  const [stats, setStats] = useState<Stats | null>(null)

  const [products, setProducts] = useState<SellerProduct[]>([])
  const [productPagination, setProductPagination] = useState<Pagination | null>(null)
  const [productPage, setProductPage] = useState(1)
  const [productLoading, setProductLoading] = useState(false)

  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [orderPagination, setOrderPagination] = useState<Pagination | null>(null)
  const [orderPage, setOrderPage] = useState(1)
  const [orderLoading, setOrderLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const authHeader = useCallback((): HeadersInit => (
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  ), [accessToken])

  const fetchStats = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE_URL}/seller/stats`, { headers: authHeader() })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load stats.')
      setStats(body as Stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats.')
    }
  }, [accessToken, authHeader])

  const fetchProducts = useCallback(async (page: number) => {
    if (!accessToken) return
    setProductLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/seller/products?page=${page}&limit=${PAGE_SIZE}`, { headers: authHeader() })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load products.')
      setProducts(body.products)
      setProductPagination(body.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products.')
    } finally {
      setProductLoading(false)
    }
  }, [accessToken, authHeader])

  const fetchOrders = useCallback(async (page: number) => {
    if (!accessToken) return
    setOrderLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/seller/orders?page=${page}&limit=${PAGE_SIZE}`, { headers: authHeader() })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error ?? 'Failed to load orders.')
      setOrders(body.orders)
      setOrderPagination(body.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders.')
    } finally {
      setOrderLoading(false)
    }
  }, [accessToken, authHeader])

  useEffect(() => { void fetchStats() }, [fetchStats])
  useEffect(() => { void fetchProducts(productPage) }, [fetchProducts, productPage])
  useEffect(() => { void fetchOrders(orderPage) }, [fetchOrders, orderPage])

  const statCards = [
    { label: 'Products', value: stats ? String(stats.totalProducts) : '—' },
    { label: 'Total stock', value: stats ? String(stats.totalStock) : '—' },
    { label: 'Open orders', value: stats ? String(stats.openOrders) : '—' },
    { label: 'Revenue', value: stats ? money.format(stats.revenue) : '—' },
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
              <p className="text-sm font-bold uppercase tracking-[1.6px] text-[#F36A1D]">Seller dashboard</p>
              <h1 className="text-[clamp(30px,4vw,52px)] font-extrabold leading-none text-[#15171d]">
                Products &amp; orders
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
          {statCards.map((stat) => (
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

        <div className="space-y-6">
          {/* Products table */}
          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_14px_44px_rgba(20,22,28,0.06)]">
            <div className="border-b border-[#ececef] px-5 py-4">
              <h2 className="text-xl font-extrabold text-[#15171d]">
                My products
                {productPagination && (
                  <span className="ml-2 text-base font-semibold text-[#8b929d]">({productPagination.total})</span>
                )}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Price</th>
                    <th className="px-5 py-3">Stock</th>
                    <th className="px-5 py-3">Stock status</th>
                    <th className="px-5 py-3">Listed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececef]">
                  {productLoading && <EmptyRow cols={6} message="Loading products…" />}
                  {!productLoading && products.length === 0 && <EmptyRow cols={6} message="No products listed yet." />}
                  {!productLoading && products.length > 0 && products.map((product) => (
                    <tr key={product.id} className="hover:bg-[#fafafa]">
                      <td className="px-5 py-4 font-bold text-[#15171d]">{product.name}</td>
                      <td className="px-5 py-4 text-[#686e78]">{product.category?.name ?? '—'}</td>
                      <td className="px-5 py-4 text-[#686e78]">{money.format(product.price)}</td>
                      <td className="px-5 py-4 text-[#686e78]">{product.stock}</td>
                      <td className="px-5 py-4"><StockBadge stock={product.stock} /></td>
                      <td className="px-5 py-4 text-[#686e78]">{fmt(product.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {productPagination && (
              <Paginator pagination={productPagination} onPage={setProductPage} />
            )}
          </div>

          {/* Orders table */}
          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_14px_44px_rgba(20,22,28,0.06)]">
            <div className="border-b border-[#ececef] px-5 py-4">
              <h2 className="text-xl font-extrabold text-[#15171d]">
                Orders for my products
                {orderPagination && (
                  <span className="ml-2 text-base font-semibold text-[#8b929d]">({orderPagination.total})</span>
                )}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-240 text-left text-sm">
                <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                  <tr>
                    <th className="px-5 py-3">Order ID</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Order total</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececef]">
                  {orderLoading && <EmptyRow cols={6} message="Loading orders…" />}
                  {!orderLoading && orders.length === 0 && <EmptyRow cols={6} message="No orders yet." />}
                  {!orderLoading && orders.length > 0 && orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#fafafa]">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-[#15171d]">{order.id.slice(-8).toUpperCase()}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#15171d]">{order.user.name}</p>
                        <p className="text-xs text-[#8b929d]">{order.user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <ul className="space-y-0.5">
                          {order.items.map((item) => (
                            <li key={item.id} className="text-[#686e78]">
                              {item.product?.name ?? 'Unknown'} &times; {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-5 py-4 text-[#686e78]">{money.format(order.total)}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#686e78]">{fmt(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orderPagination && (
              <Paginator pagination={orderPagination} onPage={setOrderPage} />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
