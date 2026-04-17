import { Suspense } from 'react';
import Link from 'next/link';
import { Newspaper, Calendar, Eye, ArrowRight, TrendingUp, Globe, Zap, Scale, Leaf, Users, Building2 } from 'lucide-react';
import { getCurrentAffairs, getCurrentAffairsCategories } from '@/lib/services/current-affairs-service';
import { BentoGrid } from '@/components/magic-ui/bento-grid';
import { ShimmerButton } from '@/components/magic-ui/shimmer-button';
import type { CurrentAffair } from '@/types';

export const metadata = {
  title: 'Current Affairs',
};

async function CurrentAffairsList() {
  let affairs: CurrentAffair[] = [];
  try {
    affairs = await getCurrentAffairs({ limit: 20 });
  } catch (error) {
    console.error('Error fetching current affairs:', error);
    affairs = [];
  }

  if (affairs.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] text-center p-12">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
          <Newspaper className="w-8 h-8 text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No current affairs yet</h3>
        <p className="text-white/40 mb-6 max-w-sm mx-auto">
          Check back later for daily UPSC-relevant news and analysis
        </p>
      </div>
    );
  }

  const categoryIcons: Record<string, typeof Newspaper> = {
    'Economy': TrendingUp,
    'International Relations': Globe,
    'Science & Technology': Zap,
    'Polity': Scale,
    'Environment': Leaf,
    'Social Issues': Users,
    'Governance': Building2,
  };

  const categoryColors: Record<string, string> = {
    'Economy': 'secondary',
    'International Relations': 'primary',
    'Science & Technology': 'accent',
    'Polity': 'primary',
    'Environment': 'success',
    'Social Issues': 'warning',
    'Governance': 'primary',
  };

  // Group by date
  const groupedByDate: Record<string, typeof affairs> = {};
  affairs.forEach((affair) => {
    const date = affair.date;
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(affair);
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
                <Link key={affair.id} href={`/current-affairs/${affair.id}`}>
                  <div className="group relative flex flex-col p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-500 overflow-hidden cursor-pointer h-full">
                    {/* Top gradient line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-accent to-primary" />

                    {/* Glow */}
                    <div className={`absolute -right-12 -top-12 w-24 h-24 bg-${color}/20 rounded-full blur-[50px] group-hover:bg-${color}/30 transition-all duration-500`} />

                    <div className="flex flex-col gap-4 z-10">
                      <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/[0.05] text-white/40 group-hover:text-blue-400 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`badge badge-${color}`}>
                          {affair.category}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {affair.topic}
                        </h3>
                        <p className="text-sm text-white/40 line-clamp-3">
                          {affair.content?.summary || 'Comprehensive analysis for UPSC preparation'}
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

function TodayHighlights() {
  const highlights = [
    { title: 'Union Budget 2026 Highlights', category: 'Economy', icon: TrendingUp, color: 'secondary' },
    { title: 'India-US Strategic Partnership', category: 'International Relations', icon: Globe, color: 'primary' },
    { title: 'New Education Policy Updates', category: 'Social Issues', icon: Users, color: 'accent' },
  ];

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-6 mb-8">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-xl">🔥</span> Today&apos;s Highlights
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        {highlights.map((item, index) => (
          <div key={index} className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/5 transition-colors cursor-pointer border border-white/[0.05] hover:border-white/[0.1] group">
            <div className="flex items-center gap-2 mb-2">
              <item.icon className={`w-4 h-4 text-${item.color}`} />
              <span className={`text-xs text-${item.color} font-bold uppercase tracking-wider`}>{item.category}</span>
            </div>
            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryFilter() {
  const categories = [
    { label: 'All', active: true },
    { label: 'Economy', active: false },
    { label: 'Polity', active: false },
    { label: 'International', active: false },
    { label: 'Environment', active: false },
    { label: 'Science', active: false },
    { label: 'Social', active: false },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.label}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${cat.active
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
              : 'bg-white/5 text-white/40 hover:text-white border border-white/[0.05] hover:border-white/[0.1]'
            }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export default function CurrentAffairsPage() {
  return (
    <div className="flex flex-col gap-8 animate-slide-down">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 self-start w-fit">
            <Newspaper className="w-3 h-3 text-orange-400" />
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">Daily Updates</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-light text-white leading-[1.1] tracking-tight">
            Current <span className="font-bold text-gradient">Affairs</span>
          </h1>
          <p className="text-lg text-white/40 font-light max-w-xl">
            Daily UPSC-relevant news with comprehensive analysis
          </p>
        </div>
        <Link href="/dashboard/current-affairs/archive">
          <ShimmerButton className="px-6 py-3 text-sm" background="hsl(var(--secondary))">
            <Calendar className="w-4 h-4 mr-2" />
            Archive
          </ShimmerButton>
        </Link>
      </header>

      {/* Today's Highlights */}
      <TodayHighlights />

      {/* Category Filter */}
      <CategoryFilter />

      {/* Current Affairs List */}
      <Suspense fallback={<AffairsLoading />}>
        <CurrentAffairsList />
      </Suspense>
    </div>
  );
}

function AffairsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.05] h-52 shimmer" />
      ))}
    </div>
  );
}
