'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const NAV_ITEMS = [
  { href: '/', key: 'home', num: '01' },
  { href: '/budget', key: 'budget', num: '02' },
  { href: '/procurement', key: 'procurement', num: '03' },
  { href: '/about', key: 'about', num: '04' },
] as const;

const LOCALES = [
  { code: 'ro', label: 'RO' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
] as const;

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--paper)',
        borderBottom: '1px solid var(--ink)',
      }}
    >
      <style>{`
        @media (max-width: 1180px) {
          .bd-header-subtitle { display: none; }
          .bd-nav-label { display: none; }
          .bd-nav-btn { padding: 8px 10px !important; }
        }
        @media (max-width: 900px) {
          .bd-lang { display: none !important; }
        }
      `}</style>
      <div
        className="wrap"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          gap: '16px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexShrink: 0,
            textDecoration: 'none',
            color: 'var(--ink)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--forest)',
              color: 'var(--paper)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--serif)',
              fontWeight: 700,
              fontSize: '18px',
              fontStyle: 'italic',
              flexShrink: 0,
            }}
          >
            b
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div
              className="serif"
              style={{
                fontSize: '17px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              Buget Deschis
            </div>
            <div
              className="mono bd-header-subtitle"
              style={{
                fontSize: '10px',
                color: 'var(--ink-3)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              Moldova · 2024
            </div>
          </div>
        </Link>

        <nav style={{ display: 'flex', gap: '2px', flexShrink: 1, minWidth: 0 }}>
          {NAV_ITEMS.map((it) => {
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className="bd-nav-btn"
                style={{
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--paper)' : 'var(--ink)',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  letterSpacing: '-0.005em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  textDecoration: 'none',
                }}
              >
                <span className="mono" style={{ fontSize: '9px', opacity: 0.6 }}>
                  {it.num}
                </span>
                <span className="bd-nav-label">{t(it.key)}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className="mono bd-lang"
          style={{ display: 'flex', gap: '4px', fontSize: '11px', flexShrink: 0 }}
        >
          {LOCALES.map((l) => (
            <Link
              key={l.code}
              href={pathname}
              locale={l.code}
              style={{
                background: l.code === locale ? 'var(--ink)' : 'transparent',
                color: l.code === locale ? 'var(--paper)' : 'var(--ink-3)',
                padding: '4px 8px',
                fontFamily: 'var(--mono)',
                fontSize: '10px',
                textDecoration: 'none',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
