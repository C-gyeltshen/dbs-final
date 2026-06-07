'use client'

import { useEffect, useMemo, useState } from 'react'
import { getProducts, type Product } from '@/lib/products'
import { ArrowRightIcon, PlusIcon } from './icons'

const TILE_PASTEL = ["#e9f0fb", "#f7efe6", "#f0f1f4", "#fbe9ef"]
const PRODUCT_IMAGES = [
  "/products/hero-headphones.png",
  "/products/promo-camera.png",
  "/products/cat-controllers.png",
  "/products/cat-accessories.png",
  "/products/cat-household.png",
  "/products/cat-furniture.png",
]

const CATEGORY_ALIASES: Record<string, string> = {
  Clothes: "Clothing",
  "Home Design": "Home & Kitchen",
}

interface ProductGridProps {
  activeCategory: string
  onShowAll: () => void
  onAddToCart: (product: Product) => void
}

const productImage = (product: Product, index: number) => {
  const electronicsHint = `${product.name} ${product.category?.name ?? ''} ${product.tags.join(' ')}`.toLowerCase()

  if (electronicsHint.includes('headphone') || electronicsHint.includes('audio')) {
    return "/products/hero-headphones.png"
  }

  if (electronicsHint.includes('camera')) {
    return "/products/promo-camera.png"
  }

  return PRODUCT_IMAGES[index % PRODUCT_IMAGES.length]
}

const productTag = (product: Product) => {
  if (product.stock <= 10) {
    return "Low stock"
  }

  return product.tags[0] ?? product.category?.name ?? null
}

type ProductGridState = {
  categoryKey: string
  products: Product[]
  error: string | null
  status: 'loading' | 'loadingMore' | 'success' | 'error'
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
  } | null
}

export function ProductGrid({ activeCategory, onShowAll, onAddToCart }: ProductGridProps) {
  const apiCategory = useMemo(
    () => activeCategory === "All products" ? undefined : CATEGORY_ALIASES[activeCategory] ?? activeCategory,
    [activeCategory],
  )
  const categoryKey = apiCategory ?? 'all'
  const [gridState, setGridState] = useState<ProductGridState>({
    categoryKey,
    products: [],
    error: null,
    status: 'loading',
    pagination: null,
  })

  useEffect(() => {
    let cancelled = false

    getProducts({ category: apiCategory, limit: 8, page: 1 })
      .then(({ products: loadedProducts, pagination }) => {
        if (!cancelled) {
          setGridState({
            categoryKey,
            products: loadedProducts,
            error: null,
            status: 'success',
            pagination,
          })
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setGridState({
            categoryKey,
            products: [],
            error: loadError instanceof Error ? loadError.message : 'Products could not be loaded.',
            status: 'error',
            pagination: null,
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [apiCategory, categoryKey])

  const isCurrentCategory = gridState.categoryKey === categoryKey
  const isLoading = !isCurrentCategory || gridState.status === 'loading'
  const isLoadingMore = isCurrentCategory && gridState.status === 'loadingMore'
  const products = isCurrentCategory ? gridState.products : []
  const error = isCurrentCategory ? gridState.error : null
  const pagination = isCurrentCategory ? gridState.pagination : null
  const heading = activeCategory === "All products" ? "All products" : `${activeCategory} products`

  const loadMore = () => {
    if (!pagination?.hasNextPage || isLoadingMore) {
      return
    }

    const nextPage = pagination.page + 1

    setGridState((current) => ({
      ...current,
      status: 'loadingMore',
      error: null,
    }))

    getProducts({ category: apiCategory, limit: pagination.limit, page: nextPage })
      .then(({ products: nextProducts, pagination: nextPagination }) => {
        setGridState((current) => {
          if (current.categoryKey !== categoryKey) {
            return current
          }

          return {
            categoryKey,
            products: [...current.products, ...nextProducts],
            error: null,
            status: 'success',
            pagination: nextPagination,
          }
        })
      })
      .catch((loadError: unknown) => {
        setGridState((current) => {
          if (current.categoryKey !== categoryKey) {
            return current
          }

          return {
            ...current,
            error: loadError instanceof Error ? loadError.message : 'More products could not be loaded.',
            status: 'success',
          }
        })
      })
  }

  return (
    <>
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-[26px]" data-enter="hero">
        <h2 className="text-[clamp(22px,2.6vw,38px)] font-[800] tracking-[-1px] sm:tracking-[-1.4px] text-[#14161c]">
          {heading}
        </h2>
        <button
          className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-[22px] py-2 sm:py-3 rounded-full border-[1.5px] border-[#ececef] bg-white text-[13px] sm:text-[15px] font-semibold text-[#14161c] cursor-pointer whitespace-nowrap transition-all hover:border-[#F36A1D] hover:text-[#F36A1D]"
          data-press
          onClick={onShowAll}
        >
          See all <ArrowRightIcon size={16} sw={2}/>
        </button>
      </div>

      {/*
       * Grid columns:
       * xs (<480px):  1 col  — prevent cramped cards on tiny phones
       * sm (480px+):  2 cols
       * lg (1024px+): 4 cols
       */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-[22px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <article
              key={i}
              className="rounded-[20px] sm:rounded-[26px] px-4 sm:px-[22px] pt-4 sm:pt-6 pb-6 sm:pb-7 overflow-hidden animate-pulse"
              style={{ background: TILE_PASTEL[i % TILE_PASTEL.length] }}
            >
              <div className="w-full h-[140px] sm:h-[196px] mb-3 sm:mb-[18px] rounded-2xl sm:rounded-[18px] bg-white/60" />
              <div className="h-5 w-3/4 mx-auto rounded-full bg-white/70" />
              <div className="h-4 w-1/2 mx-auto mt-3 rounded-full bg-white/50" />
            </article>
          ))}
        </div>
      )}

      {!isLoading && error && products.length === 0 && (
        <div className="rounded-[20px] border border-[#f2d0c1] bg-[#fff7f2] px-5 py-6 text-sm font-semibold text-[#a24112]">
          {error}
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="rounded-[20px] border border-[#ececef] bg-[#fafafa] px-5 py-6 text-sm font-semibold text-[#585e69]">
          No products found for {activeCategory}.
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-[22px]">
          {products.map((product, i) => {
            const tag = productTag(product)

            return (
              <article
                key={product.id}
                className="prod-card group relative rounded-[20px] sm:rounded-[26px] px-4 sm:px-[22px] pt-4 sm:pt-6 pb-6 sm:pb-7 cursor-pointer overflow-hidden will-change-transform"
                style={{ background: TILE_PASTEL[i % TILE_PASTEL.length] }}
                data-enter="card"
                onClick={() => onAddToCart(product)}
              >
                {tag && (
                  <span className="absolute top-4 left-4 z-[3] px-3 sm:px-[15px] py-1.5 sm:py-[7px] rounded-full bg-black/60 text-white text-[11px] sm:text-[13px] font-semibold tracking-[0.2px] whitespace-nowrap backdrop-blur-[4px]">
                    {tag}
                  </span>
                )}

                {/* class "prod-img" used by Motion hover animation */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="prod-img w-full h-[140px] sm:h-[196px] mb-3 sm:mb-[18px] rounded-2xl sm:rounded-[18px] object-cover block"
                  src={productImage(product, i)}
                  alt={product.name}
                />

                <h3 className="min-h-[44px] text-center text-[14px] sm:text-[18px] font-semibold text-[#20242c] leading-tight">
                  {product.name}
                </h3>

                <p className="mt-2 text-center text-[13px] sm:text-[15px] font-bold text-[#F36A1D]">
                  Nu. {product.price.toFixed(2)}
                </p>
                <p className="mt-1 text-center text-[11px] sm:text-[12px] font-medium text-[#6b7280]">
                  {product.category?.name ?? activeCategory} · {product.stock} in stock
                </p>

                <button
                  className="absolute right-3 sm:right-[18px] bottom-3 sm:bottom-[18px] w-9 h-9 sm:w-11 sm:h-11 grid place-items-center rounded-full border-0 bg-white text-[#F36A1D] cursor-pointer shadow-[0_6px_18px_rgba(20,22,28,0.12)] opacity-0 translate-y-2 scale-90 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 hover:!bg-[#F36A1D] hover:!text-white"
                  aria-label={"Add " + product.name}
                  data-press
                  onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}
                >
                  <PlusIcon size={18} sw={2.4}/>
                </button>
              </article>
            )
          })}
        </div>
      )}

      {!isLoading && error && products.length > 0 && (
        <div className="mt-4 rounded-[16px] border border-[#f2d0c1] bg-[#fff7f2] px-5 py-4 text-sm font-semibold text-[#a24112]">
          {error}
        </div>
      )}

      {!isLoading && pagination?.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <button
            className="inline-flex items-center justify-center px-5 sm:px-7 py-3 rounded-full border-[1.5px] border-[#ececef] bg-white text-[13px] sm:text-[15px] font-semibold text-[#14161c] cursor-pointer transition-all hover:border-[#F36A1D] hover:text-[#F36A1D] disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            data-press
            disabled={isLoadingMore}
            onClick={loadMore}
          >
            {isLoadingMore ? 'Loading...' : `Load more (${products.length}/${pagination.total})`}
          </button>
        </div>
      )}
    </>
  )
}
