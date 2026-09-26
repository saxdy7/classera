'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, BookText, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LearningNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: Map, label: 'Roadmaps', href: '/roadmaps', color: 'purple' },
        { icon: BookText, label: 'Guides', href: '/guides', color: 'blue' },
        { icon: GraduationCap, label: 'Courses', href: '/courses', color: 'green' },
    ];

    const isActive = (href: string) => pathname.startsWith(href);

    return (
        <div className="bg-card border-b sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Navigation Tabs */}
                    <nav className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${active
                                            ? item.color === 'purple'
                                                ? 'bg-accent-purple/10 text-accent-purple'
                                                : item.color === 'blue'
                                                    ? 'bg-accent-purple/10 text-accent-purple'
                                                    : 'bg-green-500/10 text-green-600'
                                            : 'text-foreground/80 hover:bg-muted'
                                        }`}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* AI Generate Button */}
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 border-accent-purple text-accent-purple hover:bg-accent-purple/10"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>AI Generate</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
