function Icon({ d, size = 18, sw = 1.8, ...props }: {
  d: React.ReactNode; size?: number; sw?: number; [k: string]: unknown
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      {...(props as React.SVGProps<SVGSVGElement>)}>
      {d}
    </svg>
  )
}

export const SearchIcon = (p: { size?: number; sw?: number }) =>
  <Icon {...p} d={<><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>}/>

export const ShoppingCartIcon = (p: { size?: number; sw?: number }) =>
  <Icon {...p} d={<><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></>}/>

export const HeartIcon = (p: { size?: number; sw?: number }) =>
  <Icon {...p} d={<><path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.79z"/></>}/>

export const ArrowRightIcon = (p: { size?: number; sw?: number }) =>
  <Icon {...p} d={<><path d="M5 12h14M13 5l7 7-7 7"/></>}/>

export const PlusIcon = (p: { size?: number; sw?: number }) =>
  <Icon {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}/>

export const CheckIcon = (p: { size?: number; sw?: number }) =>
  <Icon {...p} d={<><polyline points="20 6 9 17 4 12"/></>}/>

export function BrandMark() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-label="1MinuteShop">
      <rect x="3" y="3" width="26" height="26" rx="9" fill="#1a1c22"/>
      <circle cx="44" cy="13" r="9" fill="#1a1c22"/>
      <circle cx="14" cy="44" r="9" fill="#1a1c22"/>
      <circle cx="39" cy="40" r="13" fill="#F36A1D"/>
    </svg>
  )
}
