import { ArrowRightIcon, PlusIcon } from './icons'

const TILE_PASTEL = ["#e9f0fb", "#f7efe6", "#f0f1f4", "#fbe9ef"]

const PRODUCTS = [
  { id: "household",   name: "Household goods", tag: "− 30%", img: "/products/cat-household.png" },
  { id: "controllers", name: "Game controllers", tag: "New",   img: "/products/cat-controllers.png" },
  { id: "accessories", name: "Accessories",      tag: null,    img: "/products/cat-accessories.png" },
  { id: "furniture",   name: "Furniture",        tag: null,    img: "/products/cat-furniture.png" },
]

interface ProductGridProps {
  onAddToCart: (label: string) => void
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  return (
    <>
      {/* Section header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-[26px]" data-enter="hero">
        <h2 className="text-[clamp(22px,2.6vw,38px)] font-[800] tracking-[-1px] sm:tracking-[-1.4px] text-[#14161c]">
          Explore popular categories
        </h2>
        <button
          className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-[22px] py-2 sm:py-3 rounded-full border-[1.5px] border-[#ececef] bg-white text-[13px] sm:text-[15px] font-semibold text-[#14161c] cursor-pointer whitespace-nowrap transition-all hover:border-[#F36A1D] hover:text-[#F36A1D]"
          data-press
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-[22px]">
        {PRODUCTS.map((p, i) => (
          <article
            key={p.id}
            className="prod-card group relative rounded-[20px] sm:rounded-[26px] px-4 sm:px-[22px] pt-4 sm:pt-6 pb-6 sm:pb-7 cursor-pointer overflow-hidden will-change-transform"
            style={{ background: TILE_PASTEL[i % TILE_PASTEL.length] }}
            data-enter="card"
            onClick={() => onAddToCart(p.name + " added to cart")}
          >
            {p.tag && (
              <span className="absolute top-4 left-4 z-[3] px-3 sm:px-[15px] py-1.5 sm:py-[7px] rounded-full bg-black/60 text-white text-[11px] sm:text-[13px] font-semibold tracking-[0.2px] whitespace-nowrap backdrop-blur-[4px]">
                {p.tag}
              </span>
            )}

            {/* class "prod-img" used by Motion hover animation */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="prod-img w-full h-[140px] sm:h-[196px] mb-3 sm:mb-[18px] rounded-2xl sm:rounded-[18px] object-cover block"
              src={p.img}
              alt={p.name}
            />

            <h3 className="text-center text-[15px] sm:text-[19px] font-semibold tracking-[-0.4px] text-[#20242c]">
              {p.name}
            </h3>

            <button
              className="absolute right-3 sm:right-[18px] bottom-3 sm:bottom-[18px] w-9 h-9 sm:w-11 sm:h-11 grid place-items-center rounded-full border-0 bg-white text-[#F36A1D] cursor-pointer shadow-[0_6px_18px_rgba(20,22,28,0.12)] opacity-0 translate-y-2 scale-90 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 hover:!bg-[#F36A1D] hover:!text-white"
              aria-label={"Add " + p.name}
              data-press
              onClick={(e) => { e.stopPropagation(); onAddToCart(p.name + " added to cart") }}
            >
              <PlusIcon size={18} sw={2.4}/>
            </button>
          </article>
        ))}
      </div>
    </>
  )
}
