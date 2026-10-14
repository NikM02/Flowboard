import * as React from "react"
import { cn } from "@/lib/shadcn-utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-900 placeholder:text-neutral-400 hover:border-neutral-300 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed disabled:opacity-50    :text-neutral-50 :text-neutral-500 :border-neutral-600 :border-blue-500 :ring-blue-500/25",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
