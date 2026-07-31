import { useTheme } from '../hooks/useTheme';

export function AuroraBackground() {
  const { theme } = useTheme();
  const parchment = theme === 'parchment';

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          opacity: parchment ? 0.35 : 0.25,
          backgroundImage: parchment
            ? `
            linear-gradient(rgb(212 203 184 / 0.45) 1px, transparent 1px),
            linear-gradient(90deg, rgb(212 203 184 / 0.45) 1px, transparent 1px)
          `
            : `
            linear-gradient(rgb(68 71 90 / 0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgb(68 71 90 / 0.35) 1px, transparent 1px)
          `,
          backgroundSize: parchment ? '48px 48px' : '40px 40px',
          maskImage: parchment
            ? 'radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 75%)'
            : undefined,
        }}
      />
      <div
        className="aurora-blob-a absolute -left-[12%] top-[0%] h-[520px] w-[520px] rounded-full blur-[100px]"
        style={{
          opacity: parchment ? 0.22 : 0.35,
          background: parchment
            ? 'radial-gradient(circle, #9bb5a4 0%, transparent 70%)'
            : 'radial-gradient(circle, #bd93f9 0%, transparent 70%)',
        }}
      />
      <div
        className="aurora-blob-b absolute right-[-5%] top-[15%] h-[480px] w-[480px] rounded-full blur-[100px]"
        style={{
          opacity: parchment ? 0.2 : 0.3,
          background: parchment
            ? 'radial-gradient(circle, #d4b896 0%, transparent 70%)'
            : 'radial-gradient(circle, #ff79c6 0%, transparent 70%)',
        }}
      />
      <div
        className="aurora-blob-c absolute bottom-[-5%] left-[25%] h-[420px] w-[420px] rounded-full blur-[110px]"
        style={{
          opacity: parchment ? 0.16 : 0.25,
          background: parchment
            ? 'radial-gradient(circle, #9db4bc 0%, transparent 70%)'
            : 'radial-gradient(circle, #8be9fd 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
