import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { ThemeId } from '../lib/theme';

/**
 * Mermaid：按当前主题初始化；节点深底+彩色描边在两种主题下都可读。
 */

type MermaidApi = typeof import('mermaid').default;

let mermaidModule: MermaidApi | null = null;
let initializedFor: ThemeId | null = null;

function themeVariables(theme: ThemeId) {
  if (theme === 'dracula') {
    return {
      darkMode: true,
      background: 'transparent',
      primaryColor: '#44475a',
      primaryTextColor: '#f8f8f2',
      primaryBorderColor: '#bd93f9',
      secondaryColor: '#383a4a',
      secondaryTextColor: '#f8f8f2',
      secondaryBorderColor: '#8be9fd',
      tertiaryColor: '#2d2f3b',
      tertiaryTextColor: '#f8f8f2',
      tertiaryBorderColor: '#6272a4',
      lineColor: '#6272a4',
      textColor: '#f8f8f2',
      mainBkg: '#44475a',
      nodeBorder: '#bd93f9',
      clusterBkg: '#21222c',
      clusterBorder: '#6272a4',
      titleColor: '#f8f8f2',
      edgeLabelBackground: '#282a36',
      fontSize: '14px',
    };
  }
  return {
    darkMode: false,
    background: 'transparent',
    primaryColor: '#3d3830',
    primaryTextColor: '#f4efe4',
    primaryBorderColor: '#4a6b5c',
    secondaryColor: '#4a5560',
    secondaryTextColor: '#f4efe4',
    secondaryBorderColor: '#3a6b7c',
    tertiaryColor: '#5a5248',
    tertiaryTextColor: '#f4efe4',
    tertiaryBorderColor: '#7a7268',
    lineColor: '#7a7268',
    textColor: '#2f2b26',
    mainBkg: '#3d3830',
    nodeBorder: '#4a6b5c',
    clusterBkg: '#ebe4d6',
    clusterBorder: '#d4cbb8',
    titleColor: '#2f2b26',
    edgeLabelBackground: '#f4efe4',
    fontSize: '14px',
  };
}

async function getMermaid(theme: ThemeId): Promise<MermaidApi> {
  if (!mermaidModule) {
    mermaidModule = (await import('mermaid')).default;
  }
  if (initializedFor !== theme) {
    mermaidModule.initialize({
      startOnLoad: false,
      theme: theme === 'dracula' ? 'dark' : 'base',
      securityLevel: 'loose',
      fontFamily: 'Outfit, "PingFang SC", "Microsoft YaHei", sans-serif',
      themeVariables: themeVariables(theme),
      flowchart: {
        curve: 'basis',
        padding: 10,
        htmlLabels: true,
        nodeSpacing: 28,
        rankSpacing: 36,
        useMaxWidth: true,
      },
    });
    initializedFor = theme;
  }
  return mermaidModule;
}

function fitSvg(svg: SVGSVGElement) {
  svg.removeAttribute('height');
  svg.style.height = 'auto';
  svg.style.maxWidth = '100%';
  svg.style.width = '100%';
  svg.style.display = 'block';
  if (!svg.getAttribute('viewBox') && svg.getAttribute('width')) {
    const w = parseFloat(svg.getAttribute('width') || '0');
    const h = parseFloat(svg.getAttribute('height') || '0');
    if (w > 0 && h > 0) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  svg.setAttribute('width', '100%');
  svg.removeAttribute('height');
}

export function MermaidBlock({ chart }: { chart: string }) {
  const { theme } = useTheme();
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, '');
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mmd-${reactId}-${Math.random().toString(36).slice(2, 8)}`;
    void (async () => {
      try {
        const mermaid = await getMermaid(theme);
        const { svg } = await mermaid.render(id, chart.trim());
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
          const svgEl = hostRef.current.querySelector('svg');
          if (svgEl) fitSvg(svgEl);
          setFailed(null);
        }
      } catch (err) {
        if (!cancelled) setFailed(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, reactId, theme]);

  if (failed) {
    return (
      <pre className="my-4 overflow-x-auto rounded-xl border border-dracula-red/40 bg-dracula-bg-dark p-4 text-xs text-dracula-orange whitespace-pre-wrap">
        Mermaid 渲染失败：{failed}
        {'\n\n'}
        {chart}
      </pre>
    );
  }

  return (
    <div className="mermaid-frame my-4 overflow-x-auto rounded-xl border border-dracula-current/60 bg-dracula-bg-dark/80 px-3 py-4">
      <div ref={hostRef} className="mermaid-host mx-auto w-full max-w-xl" />
    </div>
  );
}
