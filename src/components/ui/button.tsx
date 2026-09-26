import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button - Classera design system v2 (see /DESIGN.md; sources: Clay + Expo).
 *
 * Both source systems chose a near-black CTA independently, so black is the
 * only action colour. There is deliberately no saturated brand button: colour
 * belongs to category surfaces, restraint belongs to actions.
 *
 * Clay geometry: 44px tall, 12px radius, 12x20 padding, Inter 14/600.
 * `onColor` is Clay's button-on-color - a white button for use on top of a
 * saturated category card, where a black button would fight the surface.
 *
 * Variant names are unchanged so existing call sites keep working.
 */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center whitespace-nowrap gap-2 cl-press",
    "rounded-lg text-sm font-semibold",
    "transition-colors duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-foreground",
    "disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:border-transparent",
  ),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-transparent hover:bg-primary/90",
        primary:
          "bg-primary text-primary-foreground border border-transparent hover:bg-primary/90",
        secondary:
          "bg-card text-foreground border border-border hover:bg-muted/40",
        outline:
          "bg-card text-foreground border border-border hover:bg-muted/40",
        /** White button for placement on saturated category cards. */
        onColor:
          "bg-card text-foreground border border-transparent hover:bg-muted/40",
        ghost:
          "bg-transparent text-foreground border border-transparent hover:bg-muted",
        destructive:
          "bg-destructive text-white border border-transparent hover:bg-[#d33b3b]",
        /** Inline text link (Expo blue). Never used as a filled CTA. */
        link:
          "bg-transparent text-accent-purple border border-transparent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-3",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-6",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
