import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowRight,
  BarChart3,
  ShoppingCart,
  Database,
  Bell,
  TrendingUp,
  Award,
  Github,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import BudgetTimeSeries from '@/components/charts/BudgetTimeSeries';

function HeroSection() {
  const t = useTranslations('home.hero');
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-800/60 border border-blue-600/40 text-blue-200 text-xs font-medium mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t('badge')}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 leading-relaxed mb-10 max-w-2xl">
            {t('subtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/budget" className="btn-primary bg-white text-blue-700 hover:bg-blue-50 font-semibold">
              <BarChart3 size={18} />
              {t('ctaBudget')}
              <ArrowRight size={16} />
            </Link>
            <Link href="/procurement" className="btn-secondary border-blue-500/40 text-blue-100 hover:bg-blue-800/40 bg-transparent">
              <ShoppingCart size={18} />
              {t('ctaProcurement')}
            </Link>
          </div>
          <p className="text-xs text-blue-300 mt-6">
            {t('lastUpdated')}: Aprilie 2026 • MTender API • Ministerul Finanțelor
          </p>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const t = useTranslations('home.stats');
  const stats = [
    { label: t('budget2024'), value: '100 mld.', sub: 'MDL', color: 'blue' },
    { label: t('procurement'), value: '41.8 mld.', sub: 'MDL', color: 'green' },
    { label: t('obsScore'), value: '81/100', sub: `5 ${t('obsRank')}`, color: 'amber' },
    { label: t('procedures'), value: '385K+', sub: '2018–2024', color: 'purple' },
    { label: t('executionRate'), value: '93.1%', sub: '2024', color: 'emerald' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-emerald-200 bg-emerald-50',
    amber: 'border-amber-200 bg-amber-50',
    purple: 'border-violet-200 bg-violet-50',
    emerald: 'border-teal-200 bg-teal-50',
  };

  const valColor: Record<string, string> = {
    blue: 'text-blue-700',
    green: 'text-emerald-700',
    amber: 'text-amber-700',
    purple: 'text-violet-700',
    emerald: 'text-teal-700',
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(({ label, value, sub, color }) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 bg-white shadow-sm ${colorMap[color] || ''}`}
          >
            <p className="text-xs text-gray-500 font-medium mb-1 leading-tight">{label}</p>
            <p className={`text-xl font-bold tabular-nums ${valColor[color] || 'text-gray-900'}`}>
              {value}
            </p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const t = useTranslations('home.features');
  const features = [
    {
      icon: BarChart3,
      color: 'blue',
      href: '/budget',
      titleKey: 'budget.title',
      descKey: 'budget.desc',
    },
    {
      icon: ShoppingCart,
      color: 'emerald',
      href: '/procurement',
      titleKey: 'procurement.title',
      descKey: 'procurement.desc',
    },
    {
      icon: Database,
      color: 'violet',
      href: '/about',
      titleKey: 'openData.title',
      descKey: 'openData.desc',
    },
    {
      icon: Bell,
      color: 'amber',
      href: '/about',
      titleKey: 'alerts.title',
      descKey: 'alerts.desc',
    },
  ] as const;

  const iconColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="text-center mb-12">
        <h2 className="section-heading">{t('title')}</h2>
        <p className="section-sub mx-auto">{t('subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map(({ icon: Icon, color, href, titleKey, descKey }) => (
          <Link
            key={titleKey}
            href={href}
            className="card-padded hover:shadow-md transition-shadow group flex flex-col gap-4"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColors[color]}`}>
              <Icon size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                {t(titleKey)}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{t(descKey)}</p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Explorează</span>
              <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TrendSection() {
  const t = useTranslations('home');
  const tBudgetTrend = useTranslations('budget.trend');

  return (
    <section className="bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="section-heading">{tBudgetTrend('title')}</h2>
            <p className="text-sm text-gray-500 mb-6">{tBudgetTrend('subtitle')}</p>
            <BudgetTimeSeries />
          </div>
          <div className="flex flex-col gap-4 justify-center">
            <HighlightCard
              icon={TrendingUp}
              color="blue"
              title={t('highlights.budgetGrowth')}
              desc={t('highlights.budgetGrowthDesc')}
            />
            <HighlightCard
              icon={Award}
              color="amber"
              title={t('highlights.obsImprovement')}
              desc={t('highlights.obsImprovementDesc')}
            />
            <HighlightCard
              icon={CheckCircle2}
              color="emerald"
              title={t('highlights.mtender')}
              desc={t('highlights.mtenderDesc')}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HighlightCard({
  icon: Icon,
  color,
  title,
  desc,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  desc: string;
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
  };
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
      <div className={`p-2 rounded-lg h-fit ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm mb-0.5">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function CTASection() {
  const t = useTranslations('home.cta');
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t('title')}</h2>
          <p className="text-gray-400 max-w-lg">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['EUPL-1.2', 'Next.js 14', 'PostgreSQL', 'OCDS 1.1', 'TypeScript'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full bg-gray-700 text-gray-300 text-xs font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <a
            href="https://github.com/ibrinzila/cohesionsite"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            <Github size={18} />
            {t('github')}
          </a>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 font-medium text-sm hover:bg-gray-700 transition-colors"
          >
            <ExternalLink size={16} />
            {t('methodology')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <TrendSection />
      <CTASection />
    </>
  );
}
