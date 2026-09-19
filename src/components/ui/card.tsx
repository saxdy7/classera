import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card - Classera design system v2 (see /DESIGN.md; sources: Clay + Expo).
 *
 * White card on cream canvas at 16px radius with Expo's single soft shadow.
 * There is exactly one shadow tier in this system - hover deepens it slightly
 * rather than introducing a second level, and nothing lifts or scales.
 *
 * `CardCategory` is Clay's saturated feature card: a large colour surface at
 * 24px radius with no shadow, because the colour itself is the depth device.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-card=""
    className={cn(
      "rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)]",
      "bg-[var(--cl-surface-card)] text-[var(--cl-body)]",
      "shadow-[var(--cl-shadow-card)]",
      "hover:shadow-[var(--cl-shadow-card-hover)] hover:border-[var(--cl-hairline-strong)]",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/** Clay's saturated category card. Colour is the depth device - no shadow. */
type CategoryTone = 'pink' | 'teal' | 'lavender' | 'peach' | 'ochre' | 'mint' | 'coral'

const TONE: Record<CategoryTone, string> = {
  // Pink and teal are saturated enough to carry white text; the rest take ink.
  pink: 'bg-[var(--cl-brand-pink)] text-[var(--cl-on-dark)] [&_h1,&_h2,&_h3,&_h4]:text-[var(--cl-on-dark)]',
  teal: 'bg-[var(--cl-brand-teal)] text-[var(--cl-on-dark)] [&_h1,&_h2,&_h3,&_h4]:text-[var(--cl-on-dark)]',
  lavender: 'bg-[var(--cl-brand-lavender)] text-[var(--cl-ink)]',
  peach: 'bg-[var(--cl-brand-peach)] text-[var(--cl-ink)]',
  ochre: 'bg-[var(--cl-brand-ochre)] text-[var(--cl-ink)]',
  mint: 'bg-[var(--cl-brand-mint)] text-[var(--cl-ink)]',
  coral: 'bg-[var(--cl-brand-coral)] text-[var(--cl-ink)]',
}

const CardCategory = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tone?: CategoryTone }
>(({ className, tone = 'lavender', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[var(--cl-r-xl)] border border-transparent p-8",
      TONE[tone],
      className
    )}
    {...props}
  />
))
CardCategory.displayName = "CardCategory"

/** Dark inverse panel (Expo) - featured tiers, code surfaces, emphasis. */
const CardFeatured = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[var(--cl-r-lg)] border border-transparent",
      "bg-[var(--cl-surface-inverse)] text-[var(--cl-on-dark-soft)]",
      "[&_h1,&_h2,&_h3,&_h4]:text-[var(--cl-on-dark)]",
      className
    )}
    {...props}
  />
))
CardFeatured.displayName = "CardFeatured"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-[18px] font-semibold leading-[1.4] tracking-normal text-[var(--cl-ink)]",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-[1.55] text-[var(--cl-muted)]", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardCategory,
  CardFeatured,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
