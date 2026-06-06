interface HeroBannerProps {
  onAddToCart: (label: string) => void
}

export function HeroBanner({ onAddToCart }: HeroBannerProps) {
  return (
    <section
      className="relative rounded-[26px] p-6 sm:p-8 lg:p-[clamp(30px,3vw,48px)] min-h-[260px] sm:min-h-[320px] lg:min-h-[392px] overflow-hidden flex flex-col justify-center"
      style={{ background: "linear-gradient(118deg, #e7eefb 0%, #eee9f6 46%, #fbeadf 100%)" }}
      data-enter="hero"
    >
      {/* Copy — full width on mobile, half on lg+ so image doesn't overlap text */}
      <div className="relative z-[2] w-full sm:max-w-[65%] lg:max-w-[50%]">
        <h1 className="text-[clamp(38px,6vw,76px)] font-[800] leading-[0.92] tracking-[-2px] sm:tracking-[-3px] mb-4 sm:mb-[18px] text-[#15171d] uppercase">
          Big<br/>Sale!
        </h1>
        <p className="text-sm sm:text-base lg:text-[18px] font-medium leading-[1.45] text-[#5d636e] mb-6 sm:mb-[30px] max-w-[260px] sm:max-w-[280px]">
          Wireless headphones with noise canceling
        </p>
        <button
          className="inline-flex items-center gap-2.5 px-6 sm:px-[38px] py-3 sm:py-4 border-0 rounded-full bg-[#F36A1D] text-white text-[15px] sm:text-[17px] font-bold cursor-pointer shadow-[0_10px_26px_rgba(243,106,29,0.36)] transition-all duration-200 hover:bg-[#d95a1a]"
          data-press
          onClick={() => onAddToCart("Headphones added to cart")}
        >
          Headphones
        </button>
      </div>

      {/*
       * Hero image:
       * - Hidden on mobile (< sm) so it doesn't crowd the copy
       * - Shown on sm+ with opacity fade on small tablets
       * - Full opacity and larger on lg+
       * class "hero-product" is targeted by the Motion float animation
       */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="hero-product hidden sm:block absolute top-1/2 -translate-y-1/2 right-0 sm:right-2 lg:right-[clamp(-10px,1vw,24px)] w-[clamp(200px,28vw,440px)] h-[clamp(200px,28vw,440px)] z-[1] rounded-[22px] object-cover shadow-[0_26px_60px_rgba(40,30,20,0.22)] sm:opacity-70 lg:opacity-100"
        src="/products/hero-headphones.png"
        alt="Hero headphones"
      />
    </section>
  )
}
