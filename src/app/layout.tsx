import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Buget Deschis Moldova',
    template: '%s | Buget Deschis Moldova',
  },
  description:
    'Platformă de transparență bugetară pentru Moldova. Explorați bugetul de stat, achizițiile publice și contractele guvernamentale.',
  keywords: ['buget Moldova', 'transparență bugetară', 'achiziții publice', 'MTender', 'open data'],
  openGraph: {
    title: 'Buget Deschis Moldova',
    description: 'Transparență bugetară pentru cetățenii Moldovei',
    locale: 'ro_MD',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
