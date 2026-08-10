import * as React from "react"
import { cn } from "@/lib/shadcn-utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm shadow-neutral-200/50 transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-none dark:placeholder:text-neutral-500 dark:hover:border-neutral-700 dark:focus-visible:ring-indigo-500/60",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
