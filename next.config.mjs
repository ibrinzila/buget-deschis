import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // For Docker/self-hosted: re-add output: 'standalone'
  // For Vercel: leave as-is
};

export default withNextIntl(nextConfig);
