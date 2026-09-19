import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge - Classera design system v2 (see /DESIGN.md; sources: Clay + Expo).
 *
 * Clay pill geometry (4x12, pill radius, caption type). Status variants use the
 * semantic colour at 12% for the fill with full-strength colour as the text, so
 * a badge stays legible and never relies on colour alone to carry meaning.
 *
 * The v1 "stage" pastels came from Cursor and have been removed. Category
 * variants below use Clay's palette instead.
 */
const badgeVariants = cva(
  cn(
    "inline-flex items-center rounded-[var(--cl-r-pill)] border px-3 py-1",
    "text-[13px] font-medium leading-[1.4]",
    "transition-colors duration-[var(--cl-dur-micro)] ease-[var(--cl-ease)]",
    "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)]",
  ),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--cl-primary)] text-[var(--cl-on-primary)]",
        secondary:
          "border-transparent bg-[var(--cl-surface-strong)] text-[var(--cl-ink)]",
        outline:
          "border-[var(--cl-hairline-strong)] bg-transparent text-[var(--cl-ink)]",
        primary:
          "border-transparent bg-[var(--cl-primary)] text-[var(--cl-on-primary)]",

        // Status - tinted fill, full-strength text
        destructive: "border-transparent bg-[rgba(239,68,68,0.12)] text-[var(--cl-error)]",
        success:     "border-transparent bg-[rgba(22,163,74,0.12)] text-[var(--cl-success)]",
        warning:     "border-transparent bg-[rgba(171,100,0,0.12)] text-[var(--cl-warning)]",
        info:        "border-transparent bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)]",

        // Category tags (Clay). Ink text except on pink/teal, which are dark
        // enough to need white.
        pink:     "border-transparent bg-[var(--cl-brand-pink)] text-[var(--cl-on-dark)]",
        teal:     "border-transparent bg-[var(--cl-brand-teal)] text-[var(--cl-on-dark)]",
        lavender: "border-transparent bg-[var(--cl-brand-lavender)] text-[var(--cl-ink)]",
        peach:    "border-transparent bg-[var(--cl-brand-peach)] text-[var(--cl-ink)]",
        ochre:    "border-transparent bg-[var(--cl-brand-ochre)] text-[var(--cl-ink)]",
        mint:     "border-transparent bg-[var(--cl-brand-mint)] text-[var(--cl-ink)]",
        coral:    "border-transparent bg-[var(--cl-brand-coral)] text-[var(--cl-ink)]",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
