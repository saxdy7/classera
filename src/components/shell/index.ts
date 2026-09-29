/**
 * Shell primitives.
 *
 * `primitives.tsx` holds the current system — Amboras's admin layout language
 * (neutral surfaces, bordered cards, stat tiles, list rows, toolbars) with
 * aria/looma's single purple accent.
 *
 * The exports below it are the earlier aria/looma set, still used by the pages
 * that were converted first.
 */
export {
  btnPrimary, btnSecondary, btnGhost, btnIcon,
  Badge, CountBadge,
  Toolbar, Tabs, FilterChips, SearchBar,
  Stat, ItemCard, List, Row, Toggle, Empty, Section,
  NavList, FieldRow, Panel,
} from './primitives';

export { PageHeader, SectionHeader, primaryButton, outlineButton } from './PageHeader';
export { GradientCard, CreateTile, GradientCardSkeleton, CARD_GRADIENTS, gradientFor } from './GradientCard';
export { Segmented, SearchInput } from './Toolbar';
export type { SegmentOption } from './Toolbar';
export { StatCard } from './StatCard';
export { EmptyState } from './EmptyState';
export { getGreeting } from './greeting';
