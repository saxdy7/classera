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
    "rounded-full text-sm font-semibold",
    "transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-foreground",
    "disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:border-transparent",
  ),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-transparent shadow-[0_8px_22px_-10px_rgba(15,23,42,.7)] hover:-translate-y-0.5 hover:bg-primary/85",
        primary:
          "bg-primary text-primary-foreground border border-transparent shadow-[0_8px_22px_-10px_rgba(15,23,42,.7)] hover:-translate-y-0.5 hover:bg-primary/85",
        secondary:
          "bg-card/80 text-foreground border border-white/70 backdrop-blur-xl hover:-translate-y-0.5 hover:bg-card",
        outline:
          "bg-card/80 text-foreground border border-white/70 backdrop-blur-xl hover:-translate-y-0.5 hover:bg-card",
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
