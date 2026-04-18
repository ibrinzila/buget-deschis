import { useTranslations } from 'next-intl';

function Eyebrow({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
      <span
        className="mono"
        style={{
          fontSize: '11px',
          background: 'var(--ink)',
          color: 'var(--paper)',
          padding: '2px 8px',
          letterSpacing: '0.1em',
        }}
      >
        {num}
      </span>
      <span style={{ flex: 1, height: '1px', background: 'var(--rule)' }} />
      <span
        className="mono"
        style={{
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--ink-3)',
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default function AboutPage() {
  const t = useTranslations('about');

  const sources = [
    { key: 'mtender' as const, href: 'https://mtender.gov.md' },
    { key: 'mof' as const, href: 'https://mf.gov.md' },
    { key: 'boost' as const, href: 'https://datacatalog.worldbank.org' },
    { key: 'ccrm' as const, href: 'https://ccrm.md' },
  ];

  const steps = [
    { title: t('methodology.step1Title'), body: t('methodology.step1') },
    { title: t('methodology.step2Title'), body: t('methodology.step2') },
    { title: t('methodology.step3Title'), body: t('methodology.step3') },
    { title: t('methodology.step4Title'), body: t('methodology.step4') },
  ];

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero */}
      <section style={{ borderBottom: '1px solid var(--ink)', padding: '56px 0' }}>
        <div className="wrap-narrow">
          <div
            className="mono"
            style={{
              fontSize: '11px',
              color: 'var(--ink-3)',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            {t('kicker')}
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 'var(--fs-d2)',
              lineHeight: 0.95,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              margin: '0 0 24px',
            }}
          >
            {t('titlePre')} <em style={{ color: 'var(--forest)' }}>{t('titleEm')}</em> {t('titlePost')}
          </h1>
          <p
            style={{
              fontSize: '20px',
              lineHeight: 1.5,
              color: 'var(--ink-2)',
              margin: '0 0 40px',
              maxWidth: '680px',
            }}
          >
            {t('subtitle')}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a className="btn btn-forest" href="#methodology">
              {t('ctaMethodology')}
            </a>
            <a
              className="btn"
              href="https://cohesionlab.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('ctaCohesion')}
            </a>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap-narrow">
          <Eyebrow num="01">{t('mission.eyebrow')}</Eyebrow>
          <p
            className="serif"
            style={{
              fontSize: '28px',
              lineHeight: 1.3,
              fontWeight: 400,
              margin: '0 0 32px',
              color: 'var(--ink-2)',
              fontStyle: 'italic',
              letterSpacing: '-0.01em',
            }}
          >
            {t('mission.quote')}
          </p>
          <p style={{ fontSize: '15px', color: 'var(--ink-3)', fontStyle: 'italic' }}>
            {t('mission.author')}
          </p>
        </div>
      </section>

      {/* Data sources */}
      <section
        style={{
          padding: '64px 0',
          borderBottom: '1px solid var(--ink)',
          background: 'var(--paper-2)',
        }}
      >
        <div className="wrap">
          <Eyebrow num="02">{t('sources.eyebrow')}</Eyebrow>
          <h2
            className="serif"
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 500,
              margin: '0 0 32px',
              letterSpacing: '-0.02em',
            }}
          >
            {t('sources.title')}
          </h2>
          <div
            className="bd-sources"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0,
              border: '1px solid var(--ink)',
              background: 'var(--paper)',
            }}
          >
            {sources.map((src, i) => (
              <a
                key={src.key}
                href={src.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '28px 24px',
                  borderRight: i < 3 ? '1px solid var(--ink)' : 'none',
                  display: 'block',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div
                  className="mono"
                  style={{ fontSize: '10px', color: 'var(--ink-3)', marginBottom: '12px' }}
                >
                  SURSA · {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="serif" style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 4px' }}>
                  {t(`sources.${src.key}.title`)}
                </h3>
                <div
                  className="mono"
                  style={{ fontSize: '11px', color: 'var(--forest)', marginBottom: '12px' }}
                >
                  {t(`sources.${src.key}.site`)}
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: 'var(--ink-2)',
                    margin: '0 0 12px',
                  }}
                >
                  {t(`sources.${src.key}.desc`)}
                </p>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--ink-3)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  Format: {t(`sources.${src.key}.format`)}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology + Open Source */}
      <section id="methodology" style={{ padding: '64px 0', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap">
          <div
            className="bd-about-split"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}
          >
            <div>
              <Eyebrow num="03">{t('methodology.eyebrow')}</Eyebrow>
              <h2
                className="serif"
                style={{
                  fontSize: 'var(--fs-h2)',
                  fontWeight: 500,
                  margin: '0 0 20px',
                  letterSpacing: '-0.02em',
                }}
              >
                {t('methodology.title')}
              </h2>
              <ol
                style={{
                  paddingLeft: 0,
                  listStyle: 'none',
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: 'var(--ink-2)',
                  margin: 0,
                }}
              >
                {steps.map((step, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr',
                      gap: '16px',
                      padding: '12px 0',
                      borderTop: '1px solid var(--rule)',
                    }}
                  >
                    <div
                      className="mono"
                      style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ochre)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <strong>{step.title}.</strong> {step.body}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <Eyebrow num="04">{t('openSource.eyebrow')}</Eyebrow>
              <h2
                className="serif"
                style={{
                  fontSize: 'var(--fs-h2)',
                  fontWeight: 500,
                  margin: '0 0 20px',
                  letterSpacing: '-0.02em',
                }}
              >
                {t('openSource.title')}
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: 1.6,
                  color: 'var(--ink-2)',
                  margin: '0 0 20px',
                }}
              >
                {t('openSource.body')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  className="btn"
                  href="https://github.com/ibrinzila/buget-deschis"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ justifyContent: 'space-between' }}
                >
                  {t('openSource.github')} <span>↗</span>
                </a>
                <a
                  className="btn"
                  href="https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ justifyContent: 'space-between' }}
                >
                  {t('openSource.license')} <span>↗</span>
                </a>
                <a
                  className="btn"
                  href="https://github.com/ibrinzila/buget-deschis/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ justifyContent: 'space-between' }}
                >
                  {t('openSource.issues')} <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
