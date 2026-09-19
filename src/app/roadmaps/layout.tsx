import { ReactNode } from 'react';

/**
 * Applies the Classera design-system surface (see /DESIGN.md). Scoped per
 * segment rather than on <body> so the marketing landing page (/) is untouched.
 */
export default function RoadmapsLayout({ children }: { children: ReactNode }) {
    return <div className="cl-app cl-v3">{children}</div>;
}
