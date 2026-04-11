'use client';

import Link from 'next/link';
import { BookMarked, Newspaper, FileText, ArrowRight } from 'lucide-react';
import { BentoGrid } from '@/components/magic-ui/bento-grid';

const sections = [
    {
        title: 'Magazines',
        description: 'Yojana, Kurukshetra, and other important UPSC magazines',
        href: '/dashboard/materials/magazines',
        icon: BookMarked,
        color: 'from-blue-500 to-indigo-600',
    },
    {
        title: 'Newspapers',
        description: 'Daily editorials and news analysis from top newspapers',
        href: '/dashboard/materials/newspapers',
        icon: Newspaper,
        color: 'from-amber-500 to-orange-600',
    },
    {
        title: 'Government Schemes',
        description: 'Important government schemes and policies for UPSC',
        href: '/dashboard/materials/schemes',
        icon: FileText,
        color: 'from-emerald-500 to-teal-600',
    },
];

export default function MaterialsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
                <p className="text-muted-foreground mt-2">
                    Browse magazines, newspapers, and government schemes for UPSC preparation
                </p>
            </div>

            <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <Link key={section.href} href={section.href}>
                        <div className="group p-6 rounded-2xl bg-card/40 border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer h-full">
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                                <section.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {section.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                {section.description}
                            </p>
                            <div className="flex items-center gap-2 text-primary text-sm font-medium">
                                Browse <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </Link>
                ))}
            </BentoGrid>
        </div>
    );
}
