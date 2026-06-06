const CATEGORIES = [
  "Electronics", "Computers", "Clothes", "Arts & Crafts", "Toys & Games",
  "Jewelry", "Beauty & Care", "Mother & Kids", "Home Design", "Sports", "Pet Supplies",
]

interface SidebarProps {
  activeCat: string
  onCatChange: (cat: string) => void
}

export function Sidebar({ activeCat, onCatChange }: SidebarProps) {
  return (
    <aside data-enter="cat">

      {/* Desktop (lg+): title + vertical list */}
      <h2 className="hidden lg:block text-[30px] font-bold tracking-[-1px] mb-[26px] text-[#14161c]">
        Categories
      </h2>

      <div className="hidden lg:flex flex-col gap-1">
        {CATEGORIES.map((c) => {
          const active = activeCat === c
          return (
            <button
              key={c}
              onClick={() => onCatChange(c)}
              className={[
                "flex items-center gap-2.5 py-[9px] px-3 -ml-3 border-0 rounded-xl text-[16px] cursor-pointer text-left transition-all duration-150",
                active
                  ? "font-semibold text-[#14161c] bg-[#fdeede]"
                  : "font-medium text-[#585e69] bg-transparent hover:text-[#14161c] hover:bg-[#f6f7f8]",
              ].join(" ")}
            >
              <span className={[
                "w-1.5 h-1.5 rounded-full bg-[#F36A1D] shrink-0 transition-all duration-150",
                active ? "opacity-100 scale-100" : "opacity-0 scale-50",
              ].join(" ")}/>
              {c}
            </button>
          )
        })}
      </div>

      {/* Mobile / tablet (<lg): horizontal scrollable pill strip */}
      <div
        className="lg:hidden flex gap-2 overflow-x-auto pb-1 mb-5"
        style={{ scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((c) => {
          const active = activeCat === c
          return (
            <button
              key={c}
              onClick={() => onCatChange(c)}
              className={[
                "shrink-0 px-4 py-2 rounded-full text-sm font-medium border-0 cursor-pointer transition-all duration-150 whitespace-nowrap",
                active
                  ? "bg-[#F36A1D] text-white shadow-[0_4px_12px_rgba(243,106,29,0.35)]"
                  : "bg-[#f3f4f6] text-[#585e69] hover:bg-[#e9eaee] hover:text-[#14161c]",
              ].join(" ")}
            >
              {c}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
