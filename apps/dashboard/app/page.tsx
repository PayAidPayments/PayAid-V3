import dynamic from 'next/dynamic'

const LandingPage = dynamic(
  () => import('@/components/landing/LandingPage').then((m) => ({ default: m.default })),
  {
    // In dev, SSR of this ~2k-line page + framer-motion makes Turbopack/webpack sit on
    // `Compiling / ...` forever from the browser’s perspective. Client-only in development;
    // keep SSR in production for SEO on the public home page.
    ssr: process.env.NODE_ENV === 'production',
    loading: () => (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Loading page…</p>
      </div>
    ),
  }
)

export default function Page() {
  return <LandingPage />
}
