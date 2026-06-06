import { CheckIcon } from './icons'

interface ToastProps {
  message: string
  toastRef: React.RefObject<HTMLDivElement | null>
}

export function Toast({ message, toastRef }: ToastProps) {
  return (
    <div
      ref={toastRef}
      className="fixed bottom-5 sm:bottom-[26px] left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-3 px-5 sm:px-[22px] py-3 sm:py-[14px] bg-[#15171d] text-white rounded-full text-[13px] sm:text-[15px] font-semibold shadow-[0_16px_40px_rgba(0,0,0,0.28)] pointer-events-none max-w-[calc(100vw-32px)] sm:max-w-none sm:whitespace-nowrap"
    >
      <span className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] rounded-full bg-[#F36A1D] grid place-items-center shrink-0">
        <CheckIcon size={12} sw={3}/>
      </span>
      {message}
    </div>
  )
}
