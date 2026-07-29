import { useEffect, useId, useRef, useState } from 'react';

/**
 * Mermaid 规范（德古拉深色页）：
 * - 直接画在深色底上，节点用 Current Line 底 + 彩色描边 + 浅色字
 * - 黄描边=起点 | 青=过程 | 绿=成功 | 红=收缩/否定 | 粉/紫=强调
 * - 特殊字符标签加双引号；渲染后按 viewBox 自适应宽度，避免巨图
 */

let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'ui-sans-serif, system-ui, "PingFang SC", "Microsoft YaHei", sans-serif',
        themeVariables: {
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
        },
        flowchart: {
          curve: 'basis',
          padding: 10,
          htmlLabels: true,
          nodeSpacing: 28,
          rankSpacing: 36,
          useMaxWidth: true,
        },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

/** Make SVG scale to container instead of fixed huge pixel size. */
function fitSvg(svg: SVGSVGElement) {
  svg.removeAttribute('height');
  svg.style.height = 'auto';
  svg.style.maxWidth = '100%';
  svg.style.width = '100%';
  svg.style.display = 'block';
  // Prefer viewBox-based scaling
  if (!svg.getAttribute('viewBox') && svg.getAttribute('width')) {
    const w = parseFloat(svg.getAttribute('width') || '0');
    const h = parseFloat(svg.getAttribute('height') || '0');
    if (w > 0 && h > 0) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }
  svg.setAttribute('width', '100%');
  svg.removeAttribute('height');
}

export function MermaidBlock({ chart }: { chart: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, '');
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = `mmd-${reactId}-${Math.random().toString(36).slice(2, 8)}`;
    void (async () => {
      try {
        const mermaid = await loadMermaid();
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
  }, [chart, reactId]);

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
