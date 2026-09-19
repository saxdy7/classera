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
    "rounded-[var(--cl-r-md)] text-sm font-semibold",
    "transition-colors duration-[var(--cl-dur-micro)] ease-[var(--cl-ease)]",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)] focus-visible:border-[var(--cl-ink)]",
    "disabled:pointer-events-none disabled:bg-[var(--cl-primary-disabled)] disabled:text-[var(--cl-muted)] disabled:border-transparent",
  ),
  {
    variants: {
      variant: {
        default:
          "bg-[var(--cl-primary)] text-[var(--cl-on-primary)] border border-transparent hover:bg-[var(--cl-primary-active)]",
        primary:
          "bg-[var(--cl-primary)] text-[var(--cl-on-primary)] border border-transparent hover:bg-[var(--cl-primary-active)]",
        secondary:
          "bg-[var(--cl-surface-card)] text-[var(--cl-ink)] border border-[var(--cl-hairline-strong)] hover:bg-[var(--cl-canvas-soft)]",
        outline:
          "bg-[var(--cl-surface-card)] text-[var(--cl-ink)] border border-[var(--cl-hairline-strong)] hover:bg-[var(--cl-canvas-soft)]",
        /** White button for placement on saturated category cards. */
        onColor:
          "bg-[var(--cl-surface-card)] text-[var(--cl-ink)] border border-transparent hover:bg-[var(--cl-canvas-soft)]",
        ghost:
          "bg-transparent text-[var(--cl-ink)] border border-transparent hover:bg-[var(--cl-surface-strong)]",
        destructive:
          "bg-[var(--cl-error)] text-[var(--cl-on-dark)] border border-transparent hover:bg-[#d33b3b]",
        /** Inline text link (Expo blue). Never used as a filled CTA. */
        link:
          "bg-transparent text-[var(--cl-text-link)] border border-transparent underline-offset-4 hover:underline",
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
