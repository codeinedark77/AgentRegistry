'use client'

export function SceneBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* ── Deepspace base ───────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,_#0d1a2a_0%,_#020207_65%)]" />

      {/* ── Mesh grid ────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-mesh-grid bg-[size:56px_56px] opacity-100" />

      {/* ── Floating orbs ─────────────────────────────────────────────
          Using raw style props for the unique keyframe names from config  */}
      <div
        className="absolute -left-[15%] top-[15%] h-[700px] w-[700px] rounded-full blur-[130px]"
        style={{
          background: 'radial-gradient(circle, rgba(0,180,255,0.07) 0%, transparent 70%)',
          animation: 'orbDrift1 22s ease-in-out infinite',
        }}
      />
      <div
        className="absolute -right-[10%] top-[35%] h-[800px] w-[800px] rounded-full blur-[150px]"
        style={{
          background: 'radial-gradient(circle, rgba(160,0,255,0.06) 0%, transparent 70%)',
          animation: 'orbDrift2 28s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[5%] left-[30%] h-[500px] w-[500px] rounded-full blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,120,0.04) 0%, transparent 70%)',
          animation: 'orbDrift3 18s ease-in-out infinite alternate',
        }}
      />

      {/* ── Top + bottom vignette ─────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-0    h-36 bg-gradient-to-b  from-black/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t  from-black/50 to-transparent" />
    </div>
  )
}