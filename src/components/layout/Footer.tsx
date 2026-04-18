import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');

  const columns: Array<{ t: string; l: string[] }> = [
    { t: t('columns.explore'), l: [t('links.budget'), t('links.procurement'), t('links.sectors'), t('links.authorities')] },
    { t: t('columns.data'), l: ['API', 'CSV / JSON', 'OCDS', t('links.methodology')] },
    { t: t('columns.project'), l: [t('links.about'), 'Cohesion Lab', 'GitHub', 'Contact'] },
  ];

  return (
    <footer style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '56px 0 32px' }}>
      <style>{`
        @media (max-width: 900px) {
          .bd-footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .bd-footer-bottom { flex-direction: column; align-items: flex-start !important; gap: 8px; }
        }
      `}</style>
      <div className="wrap">
        <div
          className="bd-footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          <div>
            <div
              className="serif"
              style={{
                fontSize: '32px',
                fontStyle: 'italic',
                fontWeight: 400,
                marginBottom: '16px',
                lineHeight: 1.1,
              }}
            >
              {t('tagline')}
            </div>
            <p style={{ color: 'var(--paper-3)', fontSize: '14px', maxWidth: '380px', lineHeight: 1.6 }}>
              {t('description')}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
              <span
                className="tag"
                style={{ borderColor: 'var(--paper-3)', color: 'var(--paper)', background: 'transparent' }}
              >
                EUPL-1.2
              </span>
              <span
                className="tag"
                style={{ borderColor: 'var(--paper-3)', color: 'var(--paper)', background: 'transparent' }}
              >
                {t('legal.data')}
              </span>
              <span
                className="tag"
                style={{ borderColor: 'var(--paper-3)', color: 'var(--paper)', background: 'transparent' }}
              >
                OCDS 1.1
              </span>
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.t}>
              <div className="eyebrow" style={{ color: 'var(--paper-3)', marginBottom: '12px' }}>
                {col.t}
              </div>
              {col.l.map((l) => (
                <div
                  key={l}
                  style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--paper)' }}
                >
                  {l}
                </div>
              ))}
            </div>
          ))}
        </div>
        <hr style={{ border: 0, borderTop: '1px solid #333', margin: '24px 0' }} />
        <div
          className="bd-footer-bottom"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--paper-3)',
          }}
        >
          <div className="mono">{t('copyright')}</div>
          <div className="mono">{t('updatedAt')}</div>
        </div>
      </div>
    </footer>
  );
}
