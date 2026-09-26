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
    "inline-flex items-center rounded-full border px-3 py-1",
    "text-[13px] font-medium leading-[1.4]",
    "transition-colors duration-200 ease-out",
    "focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
  ),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-muted text-foreground",
        outline:
          "border-border bg-transparent text-foreground",
        primary:
          "border-transparent bg-primary text-primary-foreground",

        // Status - tinted fill, full-strength text
        destructive: "border-transparent bg-destructive/10 text-destructive",
        success:     "border-transparent bg-green-500/10 text-green-600",
        warning:     "border-transparent bg-amber-500/10 text-amber-600",
        info:        "border-transparent bg-accent-purple/10 text-accent-purple",

        // Category tags (Clay). Ink text except on pink/teal, which are dark
        // enough to need white.
        pink:     "border-transparent bg-accent-purple text-white",
        teal:     "border-transparent bg-accent-purple text-white",
        lavender: "border-transparent bg-accent-purple text-foreground",
        peach:    "border-transparent bg-accent-purple text-foreground",
        ochre:    "border-transparent bg-accent-purple text-foreground",
        mint:     "border-transparent bg-accent-purple text-foreground",
        coral:    "border-transparent bg-accent-purple text-foreground",
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
