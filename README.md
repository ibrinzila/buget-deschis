# Buget Deschis Moldova

**Platformă de transparență bugetară pentru Moldova.**  
Open Budget Moldova — built by [Cohesion Lab](https://cohesionlab.org).

> Explorați bugetul de stat, achizițiile publice și contractele guvernamentale — toate într-un singur loc.

---

## Rulare locală

```bash
git clone https://github.com/ibrinzila/CohesionSite
cd CohesionSite
git checkout buget-deschis
npm install
npm run dev
```

Deschideți [http://localhost:3000](http://localhost:3000) — se redirecționează automat la `/ro/`.

Nu sunt necesare variabile de mediu — toate datele sunt incluse în aplicație.

---

## Pagini

| Pagină | URL | Descriere |
|--------|-----|-----------|
| Acasă | `/ro/` | Hero, statistici cheie, tendința bugetară |
| Buget | `/ro/budget` | Treemap pe sectoare COFOG, grafic temporal, tabel detaliat |
| Achiziții | `/ro/procurement` | Căutare MTender, filtre, tabel licitații |
| Despre | `/ro/about` | Misiune, surse de date, metodologie |

Disponibil în: **Română** `/ro/` · **Русский** `/ru/` · **English** `/en/`

---

## API

```
GET /api/budget?year=2024&format=json     # date bugetare structurate FDP
GET /api/budget?year=2024&format=csv      # export CSV
GET /api/procurement?q=sanatate&status=active  # licitații filtrate (OCDS 1.1)
GET /api/procurement?format=csv           # export complet CSV
```

---

## Stack tehnic

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Recharts** — treemap, grafice temporale, bar chart
- **next-intl** — i18n (RO / RU / EN)
- **Licență cod**: EUPL-1.2 · **Licență date**: CC0

---

## Deployment

### Vercel (recomandat)
1. Conectați repo-ul la [vercel.com](https://vercel.com)
2. Framework detectat automat: Next.js
3. Adăugați domeniu custom `buget.cohesionlab.org`

### Docker / VPS (producție)
Re-adăugați `output: 'standalone'` în `next.config.mjs`, apoi:

```bash
npm run build
docker build -t buget-deschis .
docker run -p 3000:3000 buget-deschis
```

---

## Structura proiectului

```
src/
├── app/[locale]/          # Pagini (home, budget, procurement, about)
├── app/api/               # API routes (budget, procurement)
├── components/
│   ├── charts/            # BudgetTreemap, BudgetTimeSeries, ProcurementBarChart
│   ├── layout/            # Header, Footer
│   └── ui/                # StatCard, Badge
├── i18n/                  # next-intl routing + request config
└── lib/                   # Date Moldova (budget-data.ts, procurement-data.ts)
messages/
├── ro.json                # Română
├── ru.json                # Русский
└── en.json                # English
```

---

*Cohesion Lab — Laboratorul de Tehnologie Civică și Coeziune Socială*  
[cohesionlab.org](https://cohesionlab.org) · [contact@cohesionlab.org](mailto:contact@cohesionlab.org)
