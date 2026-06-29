export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background gradient — matches Nayan AI page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden bg-gradient-to-br from-gray-50 via-violet-50/25 to-indigo-50/20 dark:from-gray-950 dark:via-violet-950/30 dark:to-indigo-950/20 animate-gradient-bg z-0 motion-reduce:animate-none motion-reduce:bg-gray-50 motion-reduce:dark:bg-gray-950">
        {/* Ambient Radial Gradient Blobs */}
        <div className="absolute -left-32 top-10 h-[700px] w-[700px] rounded-full bg-violet-300/35 dark:bg-violet-500/15 blur-[140px] motion-reduce:hidden animate-float-1" />
        <div className="absolute -right-32 top-40 h-[700px] w-[700px] rounded-full bg-indigo-300/30 dark:bg-indigo-500/15 blur-[140px] motion-reduce:hidden animate-float-2" />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[500px] w-[800px] rounded-full bg-purple-200/25 dark:bg-purple-500/10 blur-[160px] motion-reduce:hidden animate-float-3" />

        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" 
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  )
}
