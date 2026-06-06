'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { animate, stagger } from 'motion'
import { TopBar } from '@/components/TopBar'
import { Sidebar } from '@/components/Sidebar'
import { HeroBanner } from '@/components/HeroBanner'
import { PromoColumn } from '@/components/PromoColumn'
import { ProductGrid } from '@/components/ProductGrid'
import { Toast } from '@/components/Toast'

export default function Home() {
  const [activeCat, setActiveCat] = useState("Electronics")
  const [cart, setCart] = useState(4)
  const [toast, setToast] = useState<string | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const cartBadgeRef = useRef<HTMLSpanElement>(null)
  const toastRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const addToCart = useCallback((label: string) => {
    setCart((c) => c + 1)
    if (cartBadgeRef.current) {
      animate(
        cartBadgeRef.current,
        { transform: ["scale(1)", "scale(1.45)", "scale(1)"] },
        { duration: 0.45, ease: [0.16, 1, 0.3, 1] }
      )
    }
    setToast(label)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }, [])

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

        <TopBar cart={cart} cartBadgeRef={cartBadgeRef} onAddToCart={addToCart}/>

        {/* sidebar + main: stacked on mobile, side-by-side on lg+ */}
        <div className="grid grid-cols-1 lg:grid-cols-[188px_1fr] gap-6 lg:gap-[clamp(28px,3.5vw,56px)] items-start">

          <Sidebar activeCat={activeCat} onCatChange={setActiveCat}/>

          <main>
            {/* hero row: stacked on mobile/tablet, side-by-side on lg+ */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-[22px] mb-8 lg:mb-[clamp(32px,4vw,52px)]">
              <HeroBanner onAddToCart={addToCart}/>
              <PromoColumn onAddToCart={addToCart}/>
            </div>

            <ProductGrid onAddToCart={addToCart}/>
          </main>
        </div>
      </div>

      {toast && <Toast message={toast} toastRef={toastRef}/>}
    </div>
  )
}
