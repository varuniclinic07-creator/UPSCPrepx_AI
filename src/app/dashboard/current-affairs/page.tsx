import { Suspense } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Calendar,
  Eye,
  ArrowRight,
  TrendingUp,
  Globe,
  Zap,
  Scale,
  Leaf,
  Users,
  Building2,
} from 'lucide-react';
import {
  getCurrentAffairs,
  getCurrentAffairsCategories,
} from '@/lib/services/current-affairs-service';
import { BentoGrid } from '@/components/magic-ui/bento-grid';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import {
  DriftingOrbs,
  MotionReveal,
  PulseDot,
} from '@/components/brand/animated-backdrop';
import type { CurrentAffair } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Current Affairs',
};

type CASearchParams = { category?: string; q?: string };

const categoryIcons: Record<string, typeof Newspaper> = {
  Economy: TrendingUp,
  'International Relations': Globe,
  'Science & Technology': Zap,
  'Polity & Governance': Scale,
  Polity: Scale,
  'Environment & Ecology': Leaf,
  Environment: Leaf,
  'Social Issues': Users,
  Governance: Building2,
};

const categoryColors: Record<string, string> = {
  Economy: 'secondary',
  'International Relations': 'primary',
  'Science & Technology': 'accent',
  'Polity & Governance': 'primary',
  Polity: 'primary',
  'Environment & Ecology': 'success',
  Environment: 'success',
  'Social Issues': 'warning',
  Governance: 'primary',
};

async function CurrentAffairsList({ category }: { category: string }) {
  let affairs: CurrentAffair[] = [];
  try {
    affairs = await getCurrentAffairs({
      limit: 20,
      category: category && category !== 'All' ? category : undefined,
    });
  } catch (error) {
    console.error('Error fetching current affairs:', error);
    affairs = [];
  }

  if (affairs.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center p-12">
        <DriftingOrbs palette={['rgba(249,115,22,0.18)', 'rgba(212,175,55,0.14)']} />
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {category && category !== 'All'
              ? `No ${category} stories yet`
              : 'No current affairs yet'}
          </h3>
          <p className="text-white/40 mb-6 max-w-sm mx-auto">
            Hermes pulls from 40+ whitelisted UPSC sources around the clock. New stories will
            appear here as soon as they&apos;re processed and syllabus-mapped.
          </p>
          {category && category !== 'All' ? (
            <Link
              href="/dashboard/current-affairs"
              className="px-4 py-2 rounded-full border border-white/10 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors inline-flex"
            >
              Clear category filter
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  // Group by date so each day gets its own heading.
  const groupedByDate: Record<string, typeof affairs> = {};
  affairs.forEach((affair) => {
    const date = affair.date;
    (groupedByDate[date] ||= []).push(affair);
  });

  return (
    <div className="space-y-10">
      {Object.entries(groupedByDate).map(([date, dateAffairs]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-4 h-4 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">
              {new Date(date).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h2>
          </div>

          <BentoGrid className="grid-cols-1 md:grid-cols-2 gap-5">
            {dateAffairs.map((affair) => {
              const Icon = categoryIcons[affair.category] || Newspaper;
              const color = categoryColors[affair.category] || 'primary';

              return (
                <Link key={affair.id} href={`/dashboard/current-affairs/${affair.id}`}>
                  <div className="group relative flex flex-col p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-500 overflow-hidden cursor-pointer h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-accent to-primary" />
                    <div
                      className={`absolute -right-12 -top-12 w-24 h-24 bg-${color}/20 rounded-full blur-[50px] group-hover:bg-${color}/30 transition-all duration-500`}
                    />

                    <div className="flex flex-col gap-4 z-10">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/[0.05] text-white/40 group-hover:text-blue-400 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`badge badge-${color}`}>{affair.category}</span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {affair.topic}
                        </h3>
                        <p className="text-sm text-white/40 line-clamp-3">
                          {affair.content?.summary ||
                            'Comprehensive analysis for UPSC preparation'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/[0.05] flex justify-between items-center z-10">
                      <span className="text-xs text-white/40 font-medium flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {affair.viewCount || 0} views
                      </span>
                      <span className="text-xs text-blue-400 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read more
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </BentoGrid>
        </div>
      ))}
    </div>
  );
}

async function TodayHighlights() {
  // Real highlights = top 3 most-viewed stories from the last 7 days. No fixture data.
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);

  let recent: CurrentAffair[] = [];
  try {
    recent = await getCurrentAffairs({
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      limit: 50,
    });
  } catch (err) {
    console.error('[ca] highlights fetch failed:', err);
  }

  const highlights = [...recent]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 3);

  if (highlights.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6">
      <DriftingOrbs palette={['rgba(249,115,22,0.15)', 'rgba(59,130,246,0.15)']} />
      <div className="relative">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <PulseDot color="bg-amber-400" />
          This week&apos;s most-read
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {highlights.map((item) => {
            const Icon = categoryIcons[item.category] || Newspaper;
            const color = categoryColors[item.category] || 'primary';
            return (
              <Link
                key={item.id}
                href={`/dashboard/current-affairs/${item.id}`}
                className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/5 transition-colors border border-white/[0.05] hover:border-white/[0.1] group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 text-${color}`} />
                  <span
                    className={`text-xs text-${color} font-bold uppercase tracking-wider`}
                  >
                    {item.category}
                  </span>
                </div>
                <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                  {item.topic}
                </p>
                <p className="text-xs text-white/40 mt-2 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {item.viewCount || 0} views
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CategoryFilter({ active }: { active: string }) {
  const cats = getCurrentAffairsCategories();
  const items = ['All', ...cats];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((label) => {
        const isActive = active === label || (label === 'All' && !active);
        const href =
          label === 'All'
            ? '/dashboard/current-affairs'
            : `/dashboard/current-affairs?category=${encodeURIComponent(label)}`;
        return (
          <Link
            key={label}
            href={href}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                : 'bg-white/5 text-white/40 hover:text-white border border-white/[0.05] hover:border-white/[0.1]'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function CurrentAffairsPage({
  searchParams,
}: {
  searchParams: Promise<CASearchParams>;
}) {
  const resolved = await searchParams;
  const category = (resolved.category ?? 'All').trim();

  return (
    <div className="relative flex flex-col gap-8 animate-slide-down">
      <div className="relative">
        <DriftingOrbs palette={['rgba(249,115,22,0.22)', 'rgba(59,130,246,0.2)']} />
        <MotionReveal>
          <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 self-start w-fit">
                <PulseDot color="bg-orange-400" />
                <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">
                  Live from whitelisted sources
                </span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-tight">
                Current <span className="font-bold text-gradient">Affairs</span>
              </h1>
              <p className="text-lg text-white/40 font-light max-w-xl">
                UPSC-relevant news with syllabus linkage, multi-angle analysis, and PYQ
                connections. Hermes agents pull continuously from 40+ sources.
              </p>
            </div>
            <Link href="/dashboard/daily-digest">
              <ShimmerButton
                className="px-6 py-3 text-sm"
                background="hsl(var(--secondary))"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Today&apos;s Digest
              </ShimmerButton>
            </Link>
          </header>
        </MotionReveal>
      </div>

      <MotionReveal delay={0.08}>
        <Suspense fallback={<HighlightsSkeleton />}>
          <TodayHighlights />
        </Suspense>
      </MotionReveal>

      <MotionReveal delay={0.14}>
        <CategoryFilter active={category} />
      </MotionReveal>

      <Suspense fallback={<AffairsLoading />}>
        <CurrentAffairsList category={category} />
      </Suspense>
    </div>
  );
}

function HighlightsSkeleton() {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] h-40 shimmer" />
  );
}

function AffairsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.05] h-52 shimmer"
        />
      ))}
    </div>
  );
}
