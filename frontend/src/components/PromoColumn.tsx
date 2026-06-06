interface PromoColumnProps {
  onAddToCart: (label: string) => void
}

export function PromoColumn({ onAddToCart }: PromoColumnProps) {
  return (
    /*
     * mobile (<sm):  single column, cards stacked
     * sm–lg:         row — cards side by side (hero row is single col, so promo gets full width)
     * lg+:           back to column — sits beside the hero
     */
    <div className="flex flex-col sm:flex-row lg:flex-col gap-[22px]">

      {/* 20% OFF card */}
      <div
        className="flex-1 sm:flex-1 lg:flex-none lg:min-h-[158px] rounded-[26px] px-6 sm:px-8 py-7 sm:py-[30px] overflow-hidden flex flex-col justify-center items-end text-right"
        style={{ background: "linear-gradient(120deg, #fbe2dc 0%, #ede6f7 55%, #e7edfb 100%)" }}
        data-enter="hero"
      >
        <h3 className="text-[clamp(22px,2.3vw,34px)] font-[800] leading-[1.08] tracking-[-1px] sm:tracking-[-1.2px] text-[#15171d]">
          Get up to <span className="text-[#F36A1D]">20%</span><br/>OFF Headphones
        </h3>
      </div>

      {/* Fujifilm promo card */}
      <div
        className="flex-1 min-h-[180px] sm:min-h-[196px] relative rounded-[26px] px-6 sm:px-8 py-7 sm:py-[30px] overflow-hidden flex flex-col justify-center"
        style={{ background: "linear-gradient(120deg, #e9eefb 0%, #eef0f6 100%)" }}
        data-enter="hero"
      >
        <h4 className="text-[clamp(18px,1.9vw,28px)] font-bold leading-[1.1] tracking-[-0.8px] mb-4 sm:mb-[18px] text-[#15171d] max-w-[60%]">
          Fujifilm Instax 11
        </h4>
        <button
          className="inline-flex items-center gap-2 self-start px-5 sm:px-[26px] py-2.5 sm:py-3 border-0 rounded-full bg-[#1b1d23] text-white text-[14px] sm:text-[15px] font-semibold cursor-pointer transition-colors hover:bg-[#2c2f38]"
          data-press
          onClick={() => onAddToCart("Fujifilm Instax 11 added")}
        >
          Shop now
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute right-4 sm:right-[22px] top-1/2 -translate-y-1/2 w-[38%] h-[70%] rounded-2xl object-cover shadow-[0_16px_36px_rgba(40,30,20,0.18)]"
          src="/products/promo-camera.png"
          alt="Fujifilm Instax 11"
        />
      </div>
    </div>
  )
}
