import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 hover:border-blue-700 shadow-md hover:shadow-lg font-semibold",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 border border-red-600 hover:border-red-700 shadow-md hover:shadow-lg font-semibold",
        outline:
          "border-2 border-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 text-blue-600 shadow-sm hover:shadow-md font-semibold",
        secondary:
          "bg-green-600 text-white hover:bg-green-700 border border-green-600 hover:border-green-700 shadow-md hover:shadow-lg font-semibold",
        ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-700 border border-transparent hover:border-gray-200 font-medium",
        link: "text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 font-medium",
      },
      size: {
        default: "h-10 px-4 py-2 min-w-[4rem]",
        sm: "h-8 rounded-md px-3 text-xs min-w-[3rem]",
        lg: "h-12 rounded-md px-8 text-base min-w-[5rem]",
        icon: "h-10 w-10",
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
