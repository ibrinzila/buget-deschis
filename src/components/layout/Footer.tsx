import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">MD</span>
              </div>
              <div>
                <div className="text-white font-bold text-base leading-tight">Buget Deschis Moldova</div>
                <div className="text-gray-400 text-xs">Open Budget Moldova</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed mb-4">
              {t('description')}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/ibrinzila/cohesionsite"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Github size={16} />
                GitHub
              </a>
              <span className="text-gray-600">•</span>
              <a
                href="https://cohesionlab.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink size={14} />
                cohesionlab.org
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Platformă</h3>
            <ul className="space-y-2">
              {[
                { href: '/budget', label: t('links.budget') },
                { href: '/procurement', label: t('links.procurement') },
                { href: '/about', label: t('links.about') },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Standards */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Standarde</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="https://standard.open-contracting.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  OCDS 1.1
                </a>
              </li>
              <li>
                <a href="https://specs.frictionlessdata.io/fiscal-data-package/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Fiscal Data Package
                </a>
              </li>
              <li>
                <a href="https://mtender.gov.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  MTender API
                </a>
              </li>
              <li>
                <a href="https://mf.gov.md" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Ministerul Finanțelor
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">{t('copyright')}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{t('legal.license')}</span>
            <span>•</span>
            <span>{t('legal.data')}</span>
            <span>•</span>
            <Link href="/about" className="hover:text-gray-300 transition-colors">
              {t('legal.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
