import { useEffect, useId, useRef, useState } from 'react';

/**
 * Mermaid 画布与页面主题解耦：固定深底 + 浅字。
 * 护眼主题下正文是深色，HTML 标签会继承导致「深字叠深底」看不清，
 * 因此渲染后强制改写 foreignObject / 文本颜色。
 */

type MermaidApi = typeof import('mermaid').default;

let mermaidModule: MermaidApi | null = null;

const FRAME_BG = '#1e1f29';
const LABEL_FG = '#f8f8f2';

const INK_CARD_THEME = {
  darkMode: true,
  background: FRAME_BG,
  primaryColor: '#2b2d3a',
  primaryTextColor: LABEL_FG,
  primaryBorderColor: '#8be9fd',
  secondaryColor: '#343746',
  secondaryTextColor: LABEL_FG,
  secondaryBorderColor: '#50fa7b',
  tertiaryColor: '#3d4052',
  tertiaryTextColor: LABEL_FG,
  tertiaryBorderColor: '#6272a4',
  lineColor: '#c0c4d4',
  textColor: LABEL_FG,
  mainBkg: '#2b2d3a',
  nodeBorder: '#8be9fd',
  clusterBkg: '#161722',
  clusterBorder: '#8be9fd',
  titleColor: LABEL_FG,
  edgeLabelBackground: FRAME_BG,
  fontSize: '15px',
} as const;

async function getMermaid(): Promise<MermaidApi> {
  if (!mermaidModule) {
    mermaidModule = (await import('mermaid')).default;
  }
  // 每次 initialize，避免 HMR / 旧主题变量残留
  mermaidModule.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Outfit, "PingFang SC", "Microsoft YaHei", sans-serif',
    themeVariables: { ...INK_CARD_THEME },
    flowchart: {
      curve: 'basis',
      padding: 12,
      htmlLabels: true,
      nodeSpacing: 32,
      rankSpacing: 40,
      useMaxWidth: true,
    },
  });
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

/** 打断护眼主题的深色字继承，保证图内文字始终浅色 */
function forceReadableLabels(root: HTMLElement) {
  root.style.color = LABEL_FG;
  root.querySelectorAll('foreignObject').forEach((fo) => {
    fo.setAttribute('color', LABEL_FG);
    fo.querySelectorAll('*').forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.setProperty('color', LABEL_FG, 'important');
      htmlEl.style.setProperty('-webkit-text-fill-color', LABEL_FG, 'important');
    });
  });
  root.querySelectorAll('text, tspan').forEach((el) => {
    el.setAttribute('fill', LABEL_FG);
    (el as SVGElement).style.setProperty('fill', LABEL_FG, 'important');
  });
  // 边标签底
  root.querySelectorAll('.edgeLabel rect, .labelBkg').forEach((el) => {
    el.setAttribute('fill', FRAME_BG);
  });
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
        const mermaid = await getMermaid();
        const { svg } = await mermaid.render(id, chart.trim());
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
          const svgEl = hostRef.current.querySelector('svg');
          if (svgEl) {
            fitSvg(svgEl);
            forceReadableLabels(hostRef.current);
          }
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
      <pre className="my-4 overflow-x-auto rounded-xl border border-dracula-red/40 bg-[#1e1f29] p-4 text-xs text-dracula-orange whitespace-pre-wrap">
        Mermaid 渲染失败：{failed}
        {'\n\n'}
        {chart}
      </pre>
    );
  }

  return (
    <div className="mermaid-frame my-4 overflow-x-auto rounded-xl border border-[#44475a] bg-[#1e1f29] px-3 py-4 text-[#f8f8f2]">
      <div ref={hostRef} className="mermaid-host mx-auto w-full max-w-3xl text-[#f8f8f2]" />
    </div>
  );
}
