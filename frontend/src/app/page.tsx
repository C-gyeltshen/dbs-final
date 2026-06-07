'use client'

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'
import { animate, stagger } from 'motion'
import { TopBar } from '@/components/TopBar'
import { Sidebar } from '@/components/Sidebar'
import { HeroBanner } from '@/components/HeroBanner'
import { PromoColumn } from '@/components/PromoColumn'
import { ProductGrid } from '@/components/ProductGrid'
import { Toast } from '@/components/Toast'
import { useAuth } from '@/components/AuthProvider'
import { addCartItem, getCart, removeCartItem, updateCartItem, type CartItem } from '@/lib/cart'
import { placeOrder, type DeliveryAddress } from '@/lib/orders'
import type { Product } from '@/lib/products'

type CheckoutStep = 'cart' | 'address' | 'auth' | 'placing' | 'success'
type CheckoutAuthMode = 'login' | 'signup'

export default function Home() {
  const auth = useAuth()
  const { accessToken, status, refreshSession } = auth
  const [activeCat, setActiveCat] = useState("Electronics")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart')
  const [checkoutAuthMode, setCheckoutAuthMode] = useState<CheckoutAuthMode>('login')
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: '',
    city: '',
    country: '',
    zip: '',
  })
  const [orderId, setOrderId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const cartBadgeRef = useRef<HTMLSpanElement>(null)
  const toastRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + (item.product?.price ?? 0) * item.quantity, 0)

  const showToast = useCallback((label: string) => {
    setToast(label)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }, [])

  /* entrance choreography */
  useEffect(() => {
    if (!rootRef.current) return
    const root = rootRef.current
    const groups = [
      root.querySelectorAll<Element>("[data-enter='bar']"),
      root.querySelectorAll<Element>("[data-enter='hero']"),
      root.querySelectorAll<Element>("[data-enter='cat']"),
      root.querySelectorAll<Element>("[data-enter='card']"),
    ]
    let base = 0
    groups.forEach((els) => {
      if (!els.length) return
      animate(
        Array.from(els),
        { opacity: [0, 1], transform: ["translateY(18px)", "translateY(0px)"] },
        { duration: 0.62, delay: stagger(0.05, { startDelay: base }), ease: [0.16, 1, 0.3, 1] }
      )
      base += 0.12 + els.length * 0.05
    })
  }, [])

  /* hover lift on product cards */
  useEffect(() => {
    if (!rootRef.current) return
    const cleanups: (() => void)[] = []
    rootRef.current.querySelectorAll<HTMLElement>(".prod-card").forEach((card) => {
      const img = card.querySelector<HTMLElement>(".prod-img")
      const enter = () => {
        animate(card, { transform: "translateY(-8px)" }, { duration: 0.3, ease: [0.16, 1, 0.3, 1] })
        if (img) animate(img, { transform: "scale(1.07) rotate(-1.5deg)" }, { duration: 0.4, ease: [0.16, 1, 0.3, 1] })
      }
      const leave = () => {
        animate(card, { transform: "translateY(0px)" }, { duration: 0.35 })
        if (img) animate(img, { transform: "scale(1) rotate(0deg)" }, { duration: 0.4 })
      }
      card.addEventListener("mouseenter", enter)
      card.addEventListener("mouseleave", leave)
      cleanups.push(() => {
        card.removeEventListener("mouseenter", enter)
        card.removeEventListener("mouseleave", leave)
      })
    })
    return () => cleanups.forEach((c) => c())
  }, [])

  /* press spring on all [data-press] elements */
  useEffect(() => {
    if (!rootRef.current) return
    const cleanups: (() => void)[] = []
    rootRef.current.querySelectorAll<HTMLElement>("[data-press]").forEach((el) => {
      const down = () => animate(el, { transform: "scale(0.94)" }, { duration: 0.12 })
      const up = () => animate(el, { transform: "scale(1)" }, { type: "spring", stiffness: 420, damping: 15 })
      el.addEventListener("pointerdown", down)
      el.addEventListener("pointerup", up)
      el.addEventListener("pointerleave", up)
      cleanups.push(() => {
        el.removeEventListener("pointerdown", down)
        el.removeEventListener("pointerup", up)
        el.removeEventListener("pointerleave", up)
      })
    })
    return () => cleanups.forEach((c) => c())
  }, [])

  /* gentle float on hero product */
  useEffect(() => {
    if (!rootRef.current) return
    const hero = rootRef.current.querySelector<HTMLElement>(".hero-product")
    if (!hero) return
    const anim = animate(
      hero,
      { transform: ["translateY(-50%) translate(0px,0px)", "translateY(-50%) translate(0px,-14px)"] },
      { duration: 3.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
    )
    return () => { anim?.stop?.() }
  }, [])

  /* toast entrance */
  useEffect(() => {
    if (toast && toastRef.current) {
      animate(
        toastRef.current,
        { opacity: [0, 1], transform: ["translateX(-50%) translateY(20px)", "translateX(-50%) translateY(0px)"] },
        { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
      )
    }
  }, [toast])

  useEffect(() => {
    let cancelled = false

    const syncCart = async () => {
      if (status !== 'authenticated' || !accessToken) {
        if (!cancelled) {
          setCartItems([])
        }
        return
      }

      try {
        const cart = await getCart(accessToken)

        if (!cancelled) {
          setCartItems(cart.items)
          setCartError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setCartError(error instanceof Error ? error.message : 'Cart could not be loaded.')
        }
      }
    }

    void syncCart()

    return () => {
      cancelled = true
    }
  }, [accessToken, status])

  const animateCartBadge = useCallback(() => {
    if (cartBadgeRef.current) {
      animate(
        cartBadgeRef.current,
        { transform: ["scale(1)", "scale(1.45)", "scale(1)"] },
        { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
      )
    }
  }, [])

  const addProductToCart = useCallback(async (product: Product) => {
    if (status === 'loading') {
      showToast('Account is still loading')
      return
    }

    const existingItem = cartItems.find((item) => item.productId === product.id)
    const quantity = (existingItem?.quantity ?? 0) + 1

    if (status !== 'authenticated' || !accessToken) {
      setCartItems((currentItems) => {
        const itemExists = currentItems.some((item) => item.productId === product.id)

        if (!itemExists) {
          return [
            ...currentItems,
            {
              productId: product.id,
              quantity: 1,
              product,
            },
          ]
        }

        return currentItems.map((item) => (
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                product: item.product ?? product,
              }
            : item
        ))
      })
      animateCartBadge()
      showToast(product.name + ' added to cart')
      return
    }

    try {
      const cart = await addCartItem(accessToken, product.id, quantity)
      setCartItems(cart.items)
      setCartError(null)
      animateCartBadge()
      showToast(product.name + ' added to cart')
    } catch (error) {
      const nextSession = await refreshSession()

      if (!nextSession) {
        showToast(error instanceof Error ? error.message : 'Product could not be added.')
        return
      }

      try {
        const cart = await addCartItem(nextSession.accessToken, product.id, quantity)
        setCartItems(cart.items)
        setCartError(null)
        animateCartBadge()
        showToast(product.name + ' added to cart')
      } catch (retryError) {
        showToast(retryError instanceof Error ? retryError.message : 'Product could not be added.')
      }
    }
  }, [accessToken, animateCartBadge, cartItems, refreshSession, showToast, status])

  const changeCartQuantity = useCallback(async (productId: string, nextQuantity: number) => {
    if (!accessToken) {
      setCartItems((currentItems) => {
        if (nextQuantity <= 0) {
          return currentItems.filter((item) => item.productId !== productId)
        }

        return currentItems.map((item) => (
          item.productId === productId
            ? {
                ...item,
                quantity: nextQuantity,
              }
            : item
        ))
      })
      return
    }

    try {
      const cart = nextQuantity <= 0
        ? await removeCartItem(accessToken, productId)
        : await updateCartItem(accessToken, productId, nextQuantity)

      setCartItems(cart.items)
      setCartError(null)
    } catch (error) {
      setCartError(error instanceof Error ? error.message : 'Cart could not be updated.')
    }
  }, [accessToken])

  const resetCheckout = useCallback(() => {
    setCheckoutStep('cart')
    setCartError(null)
    setOrderId(null)
  }, [])

  const clearPersistedCart = useCallback(async (token: string, items: CartItem[]) => {
    await Promise.all(items.map((item) => removeCartItem(token, item.productId)))
  }, [])

  const submitOrder = useCallback(async (token: string, address = deliveryAddress) => {
    if (cartItems.length === 0) {
      setCartError('Your cart is empty.')
      setCheckoutStep('cart')
      return
    }

    setCheckoutStep('placing')
    setCartError(null)

    try {
      const result = await placeOrder(token, {
        deliveryAddress: address,
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      })

      await clearPersistedCart(token, cartItems)
      setCartItems([])
      setOrderId(result.order.id)
      setCheckoutStep('success')
      showToast('Order placed successfully')
    } catch (error) {
      setCartError(error instanceof Error ? error.message : 'Order could not be placed.')
      setCheckoutStep(status === 'authenticated' ? 'address' : 'auth')
    }
  }, [cartItems, clearPersistedCart, deliveryAddress, showToast, status])

  const handleAddressSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextAddress = {
      street: String(formData.get('street') ?? '').trim(),
      city: String(formData.get('city') ?? '').trim(),
      country: String(formData.get('country') ?? '').trim(),
      zip: String(formData.get('zip') ?? '').trim(),
    }

    setDeliveryAddress(nextAddress)

    if (status === 'authenticated' && accessToken) {
      void submitOrder(accessToken, nextAddress)
      return
    }

    setCheckoutStep('auth')
  }, [accessToken, status, submitOrder])

  const handleCheckoutAuth = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCartError(null)
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    try {
      const session = checkoutAuthMode === 'signup'
        ? await auth.signup({
            name: String(formData.get('name') ?? ''),
            email,
            password,
          })
        : await auth.login({
            email,
            password,
          })

      await submitOrder(session.accessToken)
    } catch (error) {
      setCartError(error instanceof Error ? error.message : 'Authentication failed.')
      setCheckoutStep('auth')
    }
  }, [auth, checkoutAuthMode, submitOrder])

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen px-4 sm:px-6 lg:px-[clamp(20px,3.2vw,48px)] pt-5 sm:pt-7 pb-16"
      style={{
        background: `
          radial-gradient(1200px 500px at 85% -10%, #f6f3ff 0%, rgba(255,255,255,0) 60%),
          radial-gradient(900px 500px at 10% -5%, #fff4ee 0%, rgba(255,255,255,0) 55%),
          #ffffff
        `,
      }}
    >
      <div className="max-w-[1360px] mx-auto">

        <TopBar cart={cartCount} cartBadgeRef={cartBadgeRef} onOpenCart={() => setIsCartOpen(true)}/>

        {/* sidebar + main: stacked on mobile, side-by-side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-[188px_1fr] gap-6 lg:gap-[clamp(28px,3.5vw,56px)] items-start">

          <Sidebar activeCat={activeCat} onCatChange={setActiveCat}/>

          <main>
            {/* hero row: stacked on mobile/tablet, side-by-side on lg+ */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-[22px] mb-8 lg:mb-[clamp(32px,4vw,52px)]">
              <HeroBanner onAddToCart={showToast}/>
              <PromoColumn onAddToCart={showToast}/>
            </div>

            <ProductGrid
              activeCategory={activeCat}
              onShowAll={() => setActiveCat("All products")}
              onAddToCart={addProductToCart}
            />
          </main>
        </div>
      </div>

      {toast && <Toast message={toast} toastRef={toastRef}/>}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px]" onClick={() => setIsCartOpen(false)}>
          <aside
            className="h-full w-full max-w-[420px] overflow-y-auto bg-white px-5 py-6 shadow-[-18px_0_48px_rgba(20,22,28,0.18)] sm:px-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#14161c]">Shopping cart</h2>
                <p className="mt-1 text-sm font-medium text-[#686e78]">{cartCount} items</p>
              </div>
              <button
                className="grid h-10 w-10 place-items-center rounded-full bg-[#f3f4f6] text-lg font-bold text-[#3a3f49] transition-colors hover:bg-[#ececef]"
                type="button"
                aria-label="Close cart"
                onClick={() => {
                  setIsCartOpen(false)
                  resetCheckout()
                }}
              >
                x
              </button>
            </div>

            {checkoutStep === 'cart' && status !== 'authenticated' && (
              <div className="mb-4 rounded-[18px] border border-[#ececef] bg-[#fafafa] px-5 py-4 text-sm font-semibold text-[#585e69]">
                You can add items now. Sign in or create an account during checkout.
              </div>
            )}

            {cartError && (
              <div className="mb-4 rounded-[18px] border border-[#f2d0c1] bg-[#fff7f2] px-5 py-4 text-sm font-semibold text-[#a24112]">
                {cartError}
              </div>
            )}

            {checkoutStep === 'cart' && cartItems.length === 0 && (
              <div className="rounded-[18px] border border-[#ececef] bg-[#fafafa] px-5 py-5 text-sm font-semibold text-[#585e69]">
                Your cart is empty.
              </div>
            )}

            {checkoutStep === 'cart' && cartItems.length > 0 && (
              <>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <article key={item.productId} className="rounded-[18px] border border-[#ececef] bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-[#14161c]">
                            {item.product?.name ?? item.productId}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-[#686e78]">
                            Nu. {(item.product?.price ?? 0).toFixed(2)}
                          </p>
                        </div>
                        <button
                          className="text-xs font-bold text-[#F36A1D]"
                          type="button"
                          onClick={() => changeCartQuantity(item.productId, 0)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center rounded-full bg-[#f3f4f6] p-1">
                          <button
                            className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-bold text-[#14161c]"
                            type="button"
                            onClick={() => changeCartQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </button>
                          <span className="grid h-8 min-w-10 place-items-center px-2 text-sm font-bold text-[#14161c]">
                            {item.quantity}
                          </span>
                          <button
                            className="grid h-8 w-8 place-items-center rounded-full bg-white text-base font-bold text-[#14161c]"
                            type="button"
                            onClick={() => changeCartQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-sm font-bold text-[#14161c]">
                          Nu. {((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 rounded-[18px] bg-[#14161c] p-5 text-white">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>Nu. {cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    className="mt-4 h-12 w-full rounded-full bg-[#F36A1D] text-sm font-bold text-white transition-colors hover:bg-[#d95a1a]"
                    type="button"
                    onClick={() => setCheckoutStep('address')}
                  >
                    Checkout
                  </button>
                </div>
              </>
            )}

            {checkoutStep === 'address' && (
              <form className="space-y-4" onSubmit={handleAddressSubmit}>
                <button
                  className="text-sm font-bold text-[#F36A1D]"
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                >
                  Back to cart
                </button>
                <h3 className="text-xl font-bold text-[#14161c]">Delivery address</h3>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#20242c]">Street address</span>
                  <input
                    className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold text-[#14161c] outline-none"
                    name="street"
                    required
                    defaultValue={deliveryAddress.street}
                    placeholder="Building, street, area"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#20242c]">City</span>
                    <input
                      className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold text-[#14161c] outline-none"
                      name="city"
                      required
                      defaultValue={deliveryAddress.city}
                      placeholder="Thimphu"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#20242c]">Zip</span>
                    <input
                      className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold text-[#14161c] outline-none"
                      name="zip"
                      required
                      defaultValue={deliveryAddress.zip}
                      placeholder="11001"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#20242c]">Country</span>
                  <input
                    className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold text-[#14161c] outline-none"
                    name="country"
                    required
                    defaultValue={deliveryAddress.country || 'Bhutan'}
                    placeholder="Bhutan"
                  />
                </label>
                <button
                  className="h-12 w-full rounded-full bg-[#F36A1D] text-sm font-bold text-white transition-colors hover:bg-[#d95a1a]"
                  type="submit"
                >
                  Continue
                </button>
              </form>
            )}

            {checkoutStep === 'auth' && (
              <form className="space-y-4" onSubmit={handleCheckoutAuth}>
                <button
                  className="text-sm font-bold text-[#F36A1D]"
                  type="button"
                  onClick={() => setCheckoutStep('address')}
                >
                  Back to address
                </button>
                <div>
                  <h3 className="text-xl font-bold text-[#14161c]">Complete checkout</h3>
                  <p className="mt-1 text-sm font-medium text-[#686e78]">Log in or create an account to place the order.</p>
                </div>
                <div className="grid grid-cols-2 rounded-full bg-[#f3f4f6] p-1">
                  <button
                    className={[
                      'h-10 rounded-full text-sm font-bold transition-colors',
                      checkoutAuthMode === 'login' ? 'bg-white text-[#14161c]' : 'text-[#686e78]',
                    ].join(' ')}
                    type="button"
                    onClick={() => setCheckoutAuthMode('login')}
                  >
                    Log in
                  </button>
                  <button
                    className={[
                      'h-10 rounded-full text-sm font-bold transition-colors',
                      checkoutAuthMode === 'signup' ? 'bg-white text-[#14161c]' : 'text-[#686e78]',
                    ].join(' ')}
                    type="button"
                    onClick={() => setCheckoutAuthMode('signup')}
                  >
                    Sign up
                  </button>
                </div>

                {checkoutAuthMode === 'signup' && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-[#20242c]">Full name</span>
                    <input className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold text-[#14161c] outline-none" name="name" required placeholder="Karma Dorji" />
                  </label>
                )}
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#20242c]">Email</span>
                  <input className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold text-[#14161c] outline-none" name="email" type="email" required placeholder="you@example.com" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-[#20242c]">Password</span>
                  <input className="h-12 w-full rounded-full bg-[#f3f4f6] px-4 text-sm font-semibold text-[#14161c] outline-none" name="password" type="password" required minLength={checkoutAuthMode === 'signup' ? 8 : undefined} placeholder="Enter password" />
                </label>
                <button
                  className="h-12 w-full rounded-full bg-[#F36A1D] text-sm font-bold text-white transition-colors hover:bg-[#d95a1a]"
                  type="submit"
                >
                  Place order
                </button>
              </form>
            )}

            {checkoutStep === 'placing' && (
              <div className="rounded-[18px] border border-[#ececef] bg-[#fafafa] px-5 py-5 text-sm font-semibold text-[#585e69]">
                Placing your order...
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="rounded-[18px] bg-[#eefbf3] px-5 py-5">
                <h3 className="text-xl font-bold text-[#176236]">Order placed</h3>
                <p className="mt-2 text-sm font-semibold text-[#176236]">Order ID: {orderId}</p>
                <button
                  className="mt-5 h-12 w-full rounded-full bg-[#176236] text-sm font-bold text-white"
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false)
                    resetCheckout()
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
