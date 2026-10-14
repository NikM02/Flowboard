"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/shadcn-utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600/20 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-600",
        destructive:
          "rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-600",
        outline:
          "rounded-lg border border-neutral-200 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50 focus-visible:ring-neutral-400",
        secondary:
          "rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-600",
        ghost:
          "rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-400",
        link:
          "text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-600 rounded-md px-1",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }