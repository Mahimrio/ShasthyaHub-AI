import { Footer } from '@/components/layout/Footer'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Animated brand-gradient background (sky → cyan → emerald) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50/40 to-emerald-50 dark:from-gray-950 dark:via-sky-950/25 dark:to-emerald-950/20 animate-gradient-bg z-0 motion-reduce:animate-none motion-reduce:bg-gray-50 motion-reduce:dark:bg-gray-950">
        {/* Ambient Radial Gradient Blobs */}
        <div className="absolute -left-32 -top-24 h-[700px] w-[700px] rounded-full bg-sky-300/50 dark:bg-sky-500/12 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 top-1/3 h-[700px] w-[700px] rounded-full bg-cyan-300/40 dark:bg-cyan-500/10 blur-[140px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-44 h-[600px] w-[900px] rounded-full bg-emerald-200/50 dark:bg-emerald-500/10 blur-[160px] motion-reduce:hidden animate-float-3" />

        {/* Soft spotlight behind the card */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[560px] w-[560px] rounded-full bg-white/50 dark:bg-sky-400/[0.04] blur-[110px]" />

        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" 
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
        />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">{children}</div>
      <Footer variant="minimal" />
    </div>
  )
}
