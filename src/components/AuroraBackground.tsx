export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `
            linear-gradient(rgb(68 71 90 / 0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgb(68 71 90 / 0.35) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Dracula purple */}
      <div
        className="aurora-blob-a absolute -left-[10%] top-[5%] h-[480px] w-[480px] rounded-full opacity-35 blur-[80px]"
        style={{ background: 'radial-gradient(circle, #bd93f9 0%, transparent 70%)' }}
      />
      {/* Dracula pink */}
      <div
        className="aurora-blob-b absolute right-[0%] top-[20%] h-[520px] w-[520px] rounded-full opacity-30 blur-[80px]"
        style={{ background: 'radial-gradient(circle, #ff79c6 0%, transparent 70%)' }}
      />
      {/* Dracula cyan */}
      <div
        className="aurora-blob-c absolute bottom-[0%] left-[30%] h-[440px] w-[440px] rounded-full opacity-25 blur-[80px]"
        style={{ background: 'radial-gradient(circle, #8be9fd 0%, transparent 70%)' }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
