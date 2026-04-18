import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Info,
  Database,
  Code2,
  Mail,
  Globe,
  Github,
  ExternalLink,
  Shield,
  BookOpen,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function AboutPage() {
  const t = useTranslations('about');

  const dataSources = [
    {
      key: 'mtender',
      icon: Database,
      color: 'blue',
      link: 'https://mtender.gov.md',
      badge: 'OCDS 1.1',
    },
    {
      key: 'mof',
      icon: BookOpen,
      color: 'emerald',
      link: 'https://mf.gov.md',
      badge: 'PDF / Excel',
    },
    {
      key: 'boost',
      icon: Globe,
      color: 'violet',
      link: 'https://datacatalog.worldbank.org/dataset/moldova-boost-public-expenditure-database',
      badge: 'CSV',
    },
    {
      key: 'ccrm',
      icon: Shield,
      color: 'amber',
      link: 'https://www.ccrm.md',
      badge: 'PDF',
    },
  ] as const;

  const iconColor: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    violet: 'bg-violet-100 text-violet-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  const standards = [
    { name: 'OCDS 1.1', desc: 'Open Contracting Data Standard', link: 'https://standard.open-contracting.org/' },
    { name: 'Fiscal Data Package', desc: 'Frictionless Data Standard', link: 'https://specs.frictionlessdata.io/fiscal-data-package/' },
    { name: 'COFOG', desc: 'UN Classification of Functions of Government', link: 'https://unstats.un.org/unsd/iiss/Classification-of-the-Functions-of-Government-COFOG.ashx' },
    { name: 'WCAG 2.1 AA', desc: 'Web Content Accessibility Guidelines', link: 'https://www.w3.org/WAI/WCAG21/quickref/' },
    { name: 'EUPL-1.2', desc: 'European Union Public Licence', link: 'https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12' },
  ];

  const techStack = [
    'Next.js 14 (App Router)',
    'TypeScript',
    'Tailwind CSS',
    'Recharts',
    'PostgreSQL 16',
    'next-intl',
    'Docker Compose',
    'Cloudflare CDN',
  ];

  const values = [
    'Transparența totală a codului sursă (GitHub public)',
    'Date publice sub licența CC0 (domeniu public)',
    'Fără tracker-e sau publicitate',
    'Accesibilitate WCAG 2.1 AA',
    'Multilingv: română, rusă, engleză',
    'API public documentat',
    'Fără dependențe de vendor-i SaaS',
    'Hosting în UE (conformitate GDPR)',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Info size={15} />
          <span>Platformă → Despre</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-500 max-w-2xl">{t('subtitle')}</p>
      </div>

      {/* Mission */}
      <section className="card-padded mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
            <Users size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('mission.title')}</h2>
        </div>
        <p className="text-gray-700 leading-relaxed text-base">{t('mission.text')}</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {values.map((v) => (
            <div key={v} className="flex items-start gap-2.5 text-sm text-gray-700">
              <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              {v}
            </div>
          ))}
        </div>
      </section>

      {/* Data sources */}
      <section className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dataSource.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dataSources.map(({ key, icon: Icon, color, link, badge }) => (
            <a
              key={key}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="card-padded hover:shadow-md transition-shadow group flex gap-4"
            >
              <div className={`p-2.5 rounded-xl h-fit ${iconColor[color]}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {t(`dataSource.${key}.title`)}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-mono">
                    {badge}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t(`dataSource.${key}.desc`)}
                </p>
                <div className="flex items-center gap-1 text-xs text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={11} />
                  {link.replace('https://', '')}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section className="card-padded mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-violet-100 text-violet-600 rounded-xl">
            <BookOpen size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('methodology.title')}</h2>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">{t('methodology.text')}</p>
        <h3 className="font-semibold text-gray-900 mb-3">{t('partners.title')}</h3>
        <div className="flex flex-wrap gap-2">
          {standards.map(({ name, desc, link }) => (
            <a
              key={name}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
            >
              <span className="font-mono font-medium text-blue-700">{name}</span>
              <ExternalLink size={11} className="text-gray-400" />
            </a>
          ))}
        </div>
      </section>

      {/* Open Source */}
      <section className="card-padded mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gray-800 text-white rounded-xl">
            <Code2 size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('openSource.title')}</h2>
        </div>
        <p className="text-gray-700 leading-relaxed mb-4">{t('openSource.text')}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {techStack.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-md bg-gray-900 text-gray-300 text-xs font-mono"
            >
              {tech}
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          <a
            href="https://github.com/ibrinzila/cohesionsite"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <Github size={16} />
            {t('openSource.github')}
          </a>
          <a
            href="https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <Shield size={15} />
            {t('openSource.license')}
          </a>
        </div>
      </section>

      {/* Contact */}
      <section className="card-padded">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
            <Mail size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('contact.title')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={`mailto:${t('contact.email')}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Mail size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Email</p>
              <p className="text-sm font-medium text-gray-900">{t('contact.email')}</p>
            </div>
          </a>
          <a
            href={`https://${t('contact.website')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <Globe size={18} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Website</p>
              <p className="text-sm font-medium text-gray-900">{t('contact.website')}</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
