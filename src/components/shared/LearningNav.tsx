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
        <div className="sticky top-3 z-40 mx-auto mt-3 w-[calc(100%-1.5rem)] max-w-5xl rounded-full border border-white/70 bg-card/75 shadow-[0_16px_45px_-28px_rgba(30,35,45,.55)] backdrop-blur-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 items-center justify-between">
                    {/* Navigation Tabs */}
                    <nav className="flex items-center gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-all duration-300 ${active
                                            ? item.color === 'purple'
                                                ? 'bg-foreground text-background shadow-[0_8px_20px_-12px_rgba(15,23,42,.8)]'
                                                : item.color === 'blue'
                                                    ? 'bg-foreground text-background shadow-[0_8px_20px_-12px_rgba(15,23,42,.8)]'
                                                    : 'bg-foreground text-background shadow-[0_8px_20px_-12px_rgba(15,23,42,.8)]'
                                            : 'text-foreground/70 hover:-translate-y-0.5 hover:bg-white/60 hover:text-foreground'
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
