'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { BrandMark } from './icons'

type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: 'Active' | 'Draft'
}

type Order = {
  id: string
  customer: string
  product: string
  quantity: number
  total: number
  status: 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p-1001', name: 'Wireless headphones', category: 'Electronics', price: 129.99, stock: 42, status: 'Active' },
  { id: 'p-1002', name: 'Instax camera', category: 'Accessories', price: 89.5, stock: 18, status: 'Active' },
  { id: 'p-1003', name: 'Gaming controller', category: 'Electronics', price: 64, stock: 0, status: 'Draft' },
]

const INITIAL_ORDERS: Order[] = [
  { id: 'ord-2401', customer: 'Karma Dorji', product: 'Wireless headphones', quantity: 1, total: 129.99, status: 'PLACED' },
  { id: 'ord-2402', customer: 'Pema Choden', product: 'Instax camera', quantity: 2, total: 179, status: 'CONFIRMED' },
  { id: 'ord-2403', customer: 'Sonam Wangmo', product: 'Gaming controller', quantity: 1, total: 64, status: 'SHIPPED' },
]

const emptyProduct: Omit<Product, 'id'> = {
  name: '',
  category: 'Electronics',
  price: 0,
  stock: 0,
  status: 'Active',
}

const emptyOrder: Omit<Order, 'id'> = {
  customer: '',
  product: '',
  quantity: 1,
  total: 0,
  status: 'PLACED',
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function nextId(prefix: string) {
  return `${prefix}-${Math.floor(Date.now() / 1000)}`
}

export function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [productDraft, setProductDraft] = useState(emptyProduct)
  const [orderDraft, setOrderDraft] = useState(emptyOrder)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + order.total, 0)
    const activeProducts = products.filter((product) => product.status === 'Active').length
    const openOrders = orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status)).length

    return [
      { label: 'Products', value: String(products.length) },
      { label: 'Active listings', value: String(activeProducts) },
      { label: 'Open orders', value: String(openOrders) },
      { label: 'Revenue', value: money.format(revenue) },
    ]
  }, [orders, products])

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (editingProductId) {
      setProducts((current) => current.map((product) => (
        product.id === editingProductId ? { ...productDraft, id: editingProductId } : product
      )))
      setEditingProductId(null)
    } else {
      setProducts((current) => [{ ...productDraft, id: nextId('p') }, ...current])
    }

    setProductDraft(emptyProduct)
  }

  function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (editingOrderId) {
      setOrders((current) => current.map((order) => (
        order.id === editingOrderId ? { ...orderDraft, id: editingOrderId } : order
      )))
      setEditingOrderId(null)
    } else {
      setOrders((current) => [{ ...orderDraft, id: nextId('ord') }, ...current])
    }

    setOrderDraft(emptyOrder)
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 sm:px-6 sm:py-7 lg:px-[clamp(20px,3.2vw,48px)]">
      <div className="mx-auto max-w-[1360px]">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="grid h-12 w-12 place-items-center sm:h-16 sm:w-16" aria-label="1MinuteShop home">
              <BrandMark />
            </Link>
            <div>
              <p className="text-sm font-bold uppercase tracking-[1.6px] text-[#F36A1D]">Seller dashboard</p>
              <h1 className="text-[clamp(30px,4vw,52px)] font-[800] leading-none text-[#15171d]">
                Products and orders
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
          <section className="space-y-6">
            <form onSubmit={saveProduct} className="rounded-[22px] bg-white p-5 shadow-[0_14px_44px_rgba(20,22,28,0.06)]">
              <h2 className="mb-4 text-xl font-[800] text-[#15171d]">{editingProductId ? 'Edit product' : 'Add product'}</h2>
              <div className="space-y-3">
                <input required value={productDraft.name} onChange={(event) => setProductDraft({ ...productDraft, name: event.target.value })} placeholder="Product name" className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none focus:bg-white focus:shadow-[0_0_0_4px_rgba(243,106,29,0.14)]" />
                <select value={productDraft.category} onChange={(event) => setProductDraft({ ...productDraft, category: event.target.value })} className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none">
                  <option>Electronics</option>
                  <option>Accessories</option>
                  <option>Furniture</option>
                  <option>Household</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input required min="0" step="0.01" type="number" value={productDraft.price} onChange={(event) => setProductDraft({ ...productDraft, price: Number(event.target.value) })} placeholder="Price" className="h-12 min-w-0 rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none" />
                  <input required min="0" type="number" value={productDraft.stock} onChange={(event) => setProductDraft({ ...productDraft, stock: Number(event.target.value) })} placeholder="Stock" className="h-12 min-w-0 rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none" />
                </div>
                <select value={productDraft.status} onChange={(event) => setProductDraft({ ...productDraft, status: event.target.value as Product['status'] })} className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none">
                  <option>Active</option>
                  <option>Draft</option>
                </select>
              </div>
              <div className="mt-4 flex gap-3">
                <button type="submit" className="h-11 flex-1 rounded-full bg-[#F36A1D] px-4 text-sm font-bold text-white shadow-[0_10px_26px_rgba(243,106,29,0.28)]">
                  {editingProductId ? 'Save product' : 'Create product'}
                </button>
                {editingProductId && (
                  <button type="button" onClick={() => { setEditingProductId(null); setProductDraft(emptyProduct) }} className="h-11 rounded-full border border-[#ececef] px-4 text-sm font-bold text-[#14161c]">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <form onSubmit={saveOrder} className="rounded-[22px] bg-white p-5 shadow-[0_14px_44px_rgba(20,22,28,0.06)]">
              <h2 className="mb-4 text-xl font-[800] text-[#15171d]">{editingOrderId ? 'Edit order' : 'Add order'}</h2>
              <div className="space-y-3">
                <input required value={orderDraft.customer} onChange={(event) => setOrderDraft({ ...orderDraft, customer: event.target.value })} placeholder="Customer name" className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none" />
                <input required value={orderDraft.product} onChange={(event) => setOrderDraft({ ...orderDraft, product: event.target.value })} placeholder="Product" className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input required min="1" type="number" value={orderDraft.quantity} onChange={(event) => setOrderDraft({ ...orderDraft, quantity: Number(event.target.value) })} placeholder="Qty" className="h-12 min-w-0 rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none" />
                  <input required min="0" step="0.01" type="number" value={orderDraft.total} onChange={(event) => setOrderDraft({ ...orderDraft, total: Number(event.target.value) })} placeholder="Total" className="h-12 min-w-0 rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none" />
                </div>
                <select value={orderDraft.status} onChange={(event) => setOrderDraft({ ...orderDraft, status: event.target.value as Order['status'] })} className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold outline-none">
                  <option>PLACED</option>
                  <option>CONFIRMED</option>
                  <option>SHIPPED</option>
                  <option>DELIVERED</option>
                  <option>CANCELLED</option>
                </select>
              </div>
              <div className="mt-4 flex gap-3">
                <button type="submit" className="h-11 flex-1 rounded-full bg-[#1b1d23] px-4 text-sm font-bold text-white">
                  {editingOrderId ? 'Save order' : 'Create order'}
                </button>
                {editingOrderId && (
                  <button type="button" onClick={() => { setEditingOrderId(null); setOrderDraft(emptyOrder) }} className="h-11 rounded-full border border-[#ececef] px-4 text-sm font-bold text-[#14161c]">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="space-y-6">
            <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_14px_44px_rgba(20,22,28,0.06)]">
              <div className="border-b border-[#ececef] px-5 py-4">
                <h2 className="text-xl font-[800] text-[#15171d]">Products</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                    <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Stock</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececef]">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-5 py-4 font-bold text-[#15171d]">{product.name}</td>
                        <td className="px-5 py-4 text-[#686e78]">{product.category}</td>
                        <td className="px-5 py-4 text-[#686e78]">{money.format(product.price)}</td>
                        <td className="px-5 py-4 text-[#686e78]">{product.stock}</td>
                        <td className="px-5 py-4"><span className="rounded-full bg-[#fff4ee] px-3 py-1 text-xs font-bold text-[#9d4213]">{product.status}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { setEditingProductId(product.id); setProductDraft(product) }} className="rounded-full bg-[#f3f4f6] px-3 py-2 text-xs font-bold text-[#14161c]">Edit</button>
                            <button type="button" onClick={() => setProducts((current) => current.filter((item) => item.id !== product.id))} className="rounded-full bg-[#fff1f1] px-3 py-2 text-xs font-bold text-[#9c2020]">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_14px_44px_rgba(20,22,28,0.06)]">
              <div className="border-b border-[#ececef] px-5 py-4">
                <h2 className="text-xl font-[800] text-[#15171d]">Orders</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-[#f7f8fa] text-xs font-bold uppercase tracking-[1.2px] text-[#7a808a]">
                    <tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Qty</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr>
                  </thead>
                  <tbody className="divide-y divide-[#ececef]">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-5 py-4 font-mono text-xs font-bold text-[#15171d]">{order.id}</td>
                        <td className="px-5 py-4 font-bold text-[#15171d]">{order.customer}</td>
                        <td className="px-5 py-4 text-[#686e78]">{order.product}</td>
                        <td className="px-5 py-4 text-[#686e78]">{order.quantity}</td>
                        <td className="px-5 py-4 text-[#686e78]">{money.format(order.total)}</td>
                        <td className="px-5 py-4"><span className="rounded-full bg-[#eefbf3] px-3 py-1 text-xs font-bold text-[#176236]">{order.status}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button type="button" onClick={() => { setEditingOrderId(order.id); setOrderDraft(order) }} className="rounded-full bg-[#f3f4f6] px-3 py-2 text-xs font-bold text-[#14161c]">Edit</button>
                            <button type="button" onClick={() => setOrders((current) => current.filter((item) => item.id !== order.id))} className="rounded-full bg-[#fff1f1] px-3 py-2 text-xs font-bold text-[#9c2020]">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
