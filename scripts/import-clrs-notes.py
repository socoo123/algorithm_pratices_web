#!/usr/bin/env python3
"""Copy CLRS 4e notes into content/clrs and adapt Mermaid + math for the site."""

from __future__ import annotations

import re
from pathlib import Path

SRC_DIR = Path("/Users/zy/ai_learn/book_reading/IntroductionToAlgorithms")
DST_DIR = Path("/Users/zy/ai_web_page/algorithm_pratices_web/content/clrs")

CHAPTERS: list[tuple[str, str, bool]] = [
    ("01-role-of-algorithms", "Chapter01_算法基础概念_深度版.md", True),
    ("02-getting-started", "Chapter02_排序算法基础_深度版.md", True),
    ("03-characterizing-running-times", "Chapter03_函数的增长_深度版.md", True),
    ("04-divide-and-conquer", "Chapter04_分治策略_深度版.md", True),
    ("05-probabilistic-analysis", "Chapter05_概率分析和随机算法_深度版.md", True),
    ("06-heapsort", "Chapter06_堆排序_深度版.md", False),  # already optimized on site
    ("07-quicksort", "Chapter07_快速排序_深度版.md", True),
    ("08-sorting-in-linear-time", "Chapter08_线性时间排序_深度版.md", True),
    ("09-medians-and-order-statistics", "Chapter09_中位数和顺序统计量_深度版.md", True),
    ("10-elementary-data-structures", "Chapter10_基本数据结构_深度版.md", True),
    ("11-hash-tables", "Chapter11_哈希表_深度版.md", True),
    ("12-binary-search-trees", "Chapter12_二叉搜索树_深度版.md", True),
    ("13-red-black-trees", "Chapter13_红黑树_深度版.md", True),
    ("14-dynamic-programming", "Chapter14_动态规划_深度版.md", True),
    ("15-greedy-algorithms", "Chapter15_贪心算法_深度版.md", True),
    ("16-amortized-analysis", "Chapter16_摊还分析_深度版.md", True),
    ("17-augmenting-data-structures", "Chapter17_扩充数据结构_深度版.md", True),
    ("18-b-trees", "Chapter18_B树_深度版.md", True),
    ("19-disjoint-sets", "Chapter19_不相交集合_深度版.md", True),
    ("20-elementary-graph-algorithms", "Chapter20_基本图算法_深度版.md", True),
    ("21-minimum-spanning-trees", "Chapter21_最小生成树_深度版.md", True),
    ("22-single-source-shortest-paths", "Chapter22_单源最短路径_深度版.md", True),
    ("23-all-pairs-shortest-paths", "Chapter23_所有结点对最短路径_深度版.md", True),
    ("24-maximum-flow", "Chapter24_最大流_深度版.md", True),
    ("25-maximum-bipartite-matching", "Chapter25_二分图匹配_深度版.md", True),
    ("26-parallel-algorithms", "Chapter26_并行算法_深度版.md", True),
    ("27-online-algorithms", "Chapter27_在线算法_深度版.md", True),
    ("28-matrix-operations", "Chapter28_矩阵运算_深度版.md", True),
    ("29-linear-programming", "Chapter29_线性规划_深度版.md", True),
    ("30-polynomials-and-fft", "Chapter30_多项式与FFT_深度版.md", True),
    ("31-number-theoretic-algorithms", "Chapter31_数论算法_深度版.md", True),
    ("32-string-matching", "Chapter32_字符串匹配_深度版.md", True),
    ("33-machine-learning-algorithms", "Chapter33_机器学习算法_深度版.md", True),
    ("34-np-completeness", "Chapter34_NP完全性_深度版.md", True),
    ("35-approximation-algorithms", "Chapter35_近似算法_深度版.md", True),
]

# light fill → (dark fill, dark stroke)
FILL_STROKE = {
    "#FFE082": ("#2b2d3a", "#f1fa8c"),
    "#FFD54F": ("#2b2d3a", "#f1fa8c"),
    "#FFF59D": ("#2b2d3a", "#f1fa8c"),
    "#FFCC80": ("#2b2d3a", "#f1fa8c"),
    "#FFB74D": ("#2b2d3a", "#f1fa8c"),
    "#80DEEA": ("#2b2d3a", "#8be9fd"),
    "#4DD0E1": ("#2b2d3a", "#8be9fd"),
    "#90CAF9": ("#2b2d3a", "#8be9fd"),
    "#64B5F6": ("#2b2d3a", "#8be9fd"),
    "#BBDEFB": ("#2b2d3a", "#8be9fd"),
    "#A5D6A7": ("#2b2d3a", "#50fa7b"),
    "#C8E6C9": ("#2b2d3a", "#50fa7b"),
    "#81C784": ("#2b2d3a", "#50fa7b"),
    "#EF9A9A": ("#2b2d3a", "#ff5555"),
    "#FFCDD2": ("#2b2d3a", "#ff5555"),
    "#E57373": ("#2b2d3a", "#ff5555"),
    "#CE93D8": ("#2b2d3a", "#ff79c6"),
    "#E1BEE7": ("#2b2d3a", "#ff79c6"),
    "#BA68C8": ("#2b2d3a", "#ff79c6"),
    "#F48FB1": ("#2b2d3a", "#ff79c6"),
    "#E3F2FD": ("#161722", "#8be9fd"),
    "#E8F5E9": ("#161722", "#50fa7b"),
    "#FFF8E1": ("#161722", "#f1fa8c"),
    "#FFFDE7": ("#161722", "#f1fa8c"),
    "#E0F7FA": ("#161722", "#8be9fd"),
    "#FFEBEE": ("#161722", "#ff5555"),
    "#F3E5F5": ("#161722", "#ff79c6"),
    "#FFF3E0": ("#161722", "#f1fa8c"),
    "#F5F5F5": ("#161722", "#8be9fd"),
    "#FAFAFA": ("#161722", "#8be9fd"),
    "#FFFFFF": ("#2b2d3a", "#8be9fd"),
    "#FFF": ("#2b2d3a", "#8be9fd"),
}

STROKE_MAP = {
    "#F9A825": "#f1fa8c",
    "#FF8F00": "#f1fa8c",
    "#F57C00": "#f1fa8c",
    "#0097A7": "#8be9fd",
    "#1976D2": "#8be9fd",
    "#1565C0": "#8be9fd",
    "#388E3C": "#50fa7b",
    "#2E7D32": "#50fa7b",
    "#C62828": "#ff5555",
    "#D32F2F": "#ff5555",
    "#B71C1C": "#ff5555",
    "#7B1FA2": "#ff79c6",
    "#6A1B9A": "#ff79c6",
    "#000": "#6272a4",
    "#000000": "#6272a4",
    "#1F1F1F": "#f8f8f2",
}

NOARG = {
    "Theta": "Θ",
    "theta": "θ",
    "Omega": "Ω",
    "omega": "ω",
    "alpha": "α",
    "beta": "β",
    "gamma": "γ",
    "Gamma": "Γ",
    "delta": "δ",
    "Delta": "Δ",
    "epsilon": "ε",
    "varepsilon": "ε",
    "zeta": "ζ",
    "eta": "η",
    "iota": "ι",
    "kappa": "κ",
    "lambda": "λ",
    "Lambda": "Λ",
    "mu": "μ",
    "nu": "ν",
    "xi": "ξ",
    "pi": "π",
    "Pi": "Π",
    "rho": "ρ",
    "sigma": "σ",
    "Sigma": "Σ",
    "tau": "τ",
    "phi": "φ",
    "varphi": "φ",
    "Phi": "Φ",
    "chi": "χ",
    "psi": "ψ",
    "Psi": "Ψ",
    "ell": "ℓ",
    "infty": "∞",
    "emptyset": "∅",
    "varnothing": "∅",
    "partial": "∂",
    "nabla": "∇",
    "forall": "∀",
    "exists": "∃",
    "neg": "¬",
    "land": "∧",
    "lor": "∨",
    "cap": "∩",
    "cup": "∪",
    "sqcap": "⊓",
    "sqcup": "⊔",
    "in": "∈",
    "notin": "∉",
    "ni": "∋",
    "subset": "⊂",
    "subseteq": "⊆",
    "supset": "⊃",
    "supseteq": "⊇",
    "leq": "≤",
    "le": "≤",
    "geq": "≥",
    "ge": "≥",
    "neq": "≠",
    "ne": "≠",
    "approx": "≈",
    "sim": "~",
    "simeq": "≃",
    "equiv": "≡",
    "cong": "≅",
    "propto": "∝",
    "prec": "≺",
    "preceq": "≼",
    "succ": "≻",
    "ll": "≪",
    "gg": "≫",
    "times": "×",
    "cdot": "·",
    "ast": "*",
    "star": "★",
    "circ": "∘",
    "bullet": "•",
    "oplus": "⊕",
    "ominus": "⊖",
    "otimes": "⊗",
    "oslash": "⊘",
    "pm": "±",
    "mp": "∓",
    "div": "÷",
    "to": "→",
    "rightarrow": "→",
    "leftarrow": "←",
    "leftrightarrow": "↔",
    "Rightarrow": "⇒",
    "Leftarrow": "⇐",
    "Leftrightarrow": "⇔",
    "mapsto": "↦",
    "uparrow": "↑",
    "downarrow": "↓",
    "ldots": "…",
    "cdots": "⋯",
    "vdots": "⋮",
    "ddots": "⋱",
    "dots": "…",
    "langle": "⟨",
    "rangle": "⟩",
    "vert": "|",
    "mid": "∣",
    "parallel": "∥",
    "perp": "⊥",
    "angle": "∠",
    "triangle": "△",
    "square": "□",
    "diamond": "◇",
    "wp": "℘",
    "hbar": "ℏ",
    "ell": "ℓ",
    "top": "⊤",
    "bot": "⊥",
    "lfloor": "⌊",
    "rfloor": "⌋",
    "lceil": "⌈",
    "rceil": "⌉",
    "lVert": "‖",
    "rVert": "‖",
    "Vert": "‖",
    "lbrace": "{",
    "rbrace": "}",
    "lbrack": "[",
    "rbrack": "]",
    "lnot": "¬",
    "wedge": "∧",
    "vee": "∨",
    "setminus": "∖",
    "backslash": "\\",
    "colon": ":",
    "gets": "←",
    "iff": "⇔",
    "implies": "⇒",
    "because": "∵",
    "therefore": "∴",
    "sum": "Σ",
    "prod": "Π",
    "int": "∫",
    "oint": "∮",
    "lg": "lg",
    "log": "log",
    "ln": "ln",
    "sin": "sin",
    "cos": "cos",
    "tan": "tan",
    "exp": "exp",
    "min": "min",
    "max": "max",
    "sup": "sup",
    "inf": "inf",
    "lim": "lim",
    "det": "det",
    "dim": "dim",
    "ker": "ker",
    "arg": "arg",
    "deg": "deg",
    "gcd": "gcd",
    "Pr": "Pr",
    "mod": "mod",
    "bmod": "mod",
    "quad": " ",
    "qquad": "  ",
    " ": " ",
    ",": " ",
    ";": " ",
    ":": " ",
    "!": "",
    "quad": " ",
}

SUP_MAP = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "n": "ⁿ", "i": "ⁱ",
}
SUB_MAP = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
    "+": "₊", "-": "₋", "a": "ₐ", "e": "ₑ", "h": "ₕ",
    "i": "ᵢ", "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ",
    "o": "ₒ", "p": "ₚ", "s": "ₛ", "t": "ₜ", "x": "ₓ",
}


def restyle_mermaid(block: str) -> str:
    def repl_fill(m: re.Match[str]) -> str:
        prefix, color = m.group(1), m.group(2)
        key = color.upper() if color.startswith("#") else color
        mapped = FILL_STROKE.get(key)
        if mapped:
            return f"{prefix}{mapped[0]}"
        return m.group(0)

    def repl_stroke(m: re.Match[str]) -> str:
        prefix, color = m.group(1), m.group(2)
        key = color.upper() if color.startswith("#") else color
        mapped = STROKE_MAP.get(key)
        if mapped:
            return f"{prefix}{mapped}"
        fill_mapped = FILL_STROKE.get(key)
        if fill_mapped:
            return f"{prefix}{fill_mapped[1]}"
        return m.group(0)

    out = re.sub(r"(fill:)(#[0-9A-Fa-f]{3,8})", repl_fill, block)
    out = re.sub(r"(stroke:)(#[0-9A-Fa-f]{3,8})", repl_stroke, out)
    out = re.sub(r"color:#1f1f1f", "color:#f8f8f2", out, flags=re.I)
    out = re.sub(r"color:#fff\b", "color:#f8f8f2", out, flags=re.I)
    out = re.sub(r"color:#ffffff", "color:#f8f8f2", out, flags=re.I)
    return out


def skip_space(s: str, i: int) -> int:
    while i < len(s) and s[i] in " \t":
        i += 1
    return i


def take_atom(s: str, i: int) -> tuple[str, int]:
    """Parse one TeX atom (braced group, command, or single char)."""
    n = len(s)
    i = skip_space(s, i)
    if i >= n:
        return "", i
    if s[i] == "{":
        inner, i = take_braced(s, i)
        return latex_to_plain(inner), i
    if s[i] == "\\":
        start = i
        j = i + 1
        if j < n and s[j].isalpha():
            while j < n and s[j].isalpha():
                j += 1
            k = j
            for _ in range(4):
                kk = skip_space(s, k)
                if kk < n and s[kk] == "{":
                    _, k = take_braced(s, kk)
                elif kk < n and s[kk] == "[":
                    _, k = take_bracket(s, kk)
                else:
                    break
            return latex_to_plain(s[start:k]), k
        if j < n:
            return latex_to_plain(s[start : j + 1]), j + 1
        return "", j
    return s[i], i + 1



    while i < len(s) and s[i] in " \t":
        i += 1
    return i


def take_braced(s: str, i: int) -> tuple[str, int]:
    i = skip_space(s, i)
    if i >= len(s) or s[i] != "{":
        return "", i
    i += 1
    depth = 1
    start = i
    while i < len(s) and depth:
        if s[i] == "\\":
            i += 2
            continue
        if s[i] == "{":
            depth += 1
        elif s[i] == "}":
            depth -= 1
        i += 1
    return s[start : i - 1], i


def take_bracket(s: str, i: int) -> tuple[str | None, int]:
    i = skip_space(s, i)
    if i >= len(s) or s[i] != "[":
        return None, i
    i += 1
    start = i
    depth = 1
    while i < len(s) and depth:
        if s[i] == "\\":
            i += 2
            continue
        if s[i] == "[":
            depth += 1
        elif s[i] == "]":
            depth -= 1
        i += 1
    return s[start : i - 1], i


def split_tex_rows(body: str) -> list[str]:
    rows: list[str] = []
    buf: list[str] = []
    i = 0
    depth = 0
    while i < len(body):
        ch = body[i]
        if ch == "\\":
            if i + 1 < len(body) and body[i + 1] == "\\" and depth == 0:
                rows.append("".join(buf))
                buf = []
                i += 2
                continue
            buf.append(ch)
            if i + 1 < len(body):
                buf.append(body[i + 1])
                i += 2
                continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        buf.append(ch)
        i += 1
    if buf:
        rows.append("".join(buf))
    return rows


def split_tex_cols(row: str) -> list[str]:
    cols: list[str] = []
    buf: list[str] = []
    depth = 0
    i = 0
    while i < len(row):
        ch = row[i]
        if ch == "\\":
            buf.append(ch)
            if i + 1 < len(row):
                buf.append(row[i + 1])
                i += 2
                continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
        elif ch == "&" and depth == 0:
            cols.append("".join(buf))
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    cols.append("".join(buf))
    return cols


def script_chars(text: str, mapping: dict[str, str]) -> str | None:
    if not text:
        return ""
    out = []
    for ch in text:
        if ch in mapping:
            out.append(mapping[ch])
        elif ch in " ":
            continue
        else:
            return None
    return "".join(out)


def latex_to_plain(s: str) -> str:
    out: list[str] = []
    i = 0
    n = len(s)
    while i < n:
        ch = s[i]
        if ch == "\\":
            if i + 1 < n and s[i + 1] in r"\{}$%&_#~^":
                out.append(s[i + 1])
                i += 2
                continue
            if i + 1 < n and s[i + 1] == "|":
                out.append("‖")
                i += 2
                continue
            j = i + 1
            if j < n and s[j].isalpha():
                while j < n and s[j].isalpha():
                    j += 1
                name = s[i + 1 : j]
                i = j
                if name in ("left", "right", "big", "Big", "bigg", "Bigg", "bigl", "bigr", "Bigl", "Bigr"):
                    i = skip_space(s, i)
                    if i < n and s[i] == "\\":
                        continue  # following command (lfloor, Vert, …)
                    if i < n:
                        if s[i] != ".":
                            out.append(s[i])
                        i += 1
                    continue
                if name == "frac" or name == "dfrac" or name == "tfrac":
                    a, i = take_braced(s, i)
                    b, i = take_braced(s, i)
                    pa, pb = latex_to_plain(a), latex_to_plain(b)
                    out.append(f"({pa})/({pb})" if any(c in pa + pb for c in "+- ") else f"{pa}/{pb}")
                    continue
                if name == "sqrt":
                    opt, i = take_bracket(s, i)
                    inner, i = take_braced(s, i)
                    body = latex_to_plain(inner)
                    out.append(f"{opt}√({body})" if opt else f"√({body})")
                    continue
                if name in (
                    "text",
                    "mathrm",
                    "mathbf",
                    "mathit",
                    "mathsf",
                    "mathtt",
                    "textrm",
                    "textbf",
                    "textit",
                    "operatorname",
                    "boldsymbol",
                    "mathbb",
                    "mathcal",
                    "mathfrak",
                    "overline",
                    "underline",
                    "widehat",
                    "widetilde",
                    "vec",
                    "bar",
                    "hat",
                    "tilde",
                    "dot",
                    "ddot",
                    "textbf",
                ):
                    inner, i2 = take_braced(s, i)
                    if i2 != i:
                        body = latex_to_plain(inner)
                        if name == "mathbb":
                            trans = str.maketrans("RZNQC", "ℝℤℕℚℂ")
                            out.append(body.translate(trans))
                        elif name in ("overline", "bar"):
                            out.append(f"{body}̄" if len(body) == 1 else f"¯({body})")
                        elif name in ("hat", "widehat"):
                            out.append(f"{body}̂" if len(body) == 1 else f"hat({body})")
                        elif name in ("tilde", "widetilde"):
                            out.append(f"{body}̃" if len(body) == 1 else f"tilde({body})")
                        elif name == "vec":
                            out.append(f"{body}⃗" if len(body) == 1 else f"vec({body})")
                        else:
                            out.append(body)
                        i = i2
                        continue
                if name == "begin":
                    env, i = take_braced(s, i)
                    end = rf"\end{{{env}}}"
                    k = s.find(end, i)
                    body = s[i:k] if k >= 0 else s[i:]
                    i = (k + len(end)) if k >= 0 else n
                    env_name = env.strip()
                    if env_name in ("pmatrix", "bmatrix", "matrix", "vmatrix", "smallmatrix"):
                        rows = split_tex_rows(body.strip())
                        pretty = []
                        for row in rows:
                            cells = [latex_to_plain(c.strip()) for c in split_tex_cols(row)]
                            pretty.append("[ " + "  ".join(cells) + " ]")
                        out.append("\n".join(pretty) if pretty else "")
                    elif env_name in ("cases", "array", "aligned", "align", "align*", "equation", "equation*"):
                        rows = split_tex_rows(body.strip())
                        lines = []
                        for row in rows:
                            cells = [latex_to_plain(c.strip()) for c in split_tex_cols(row)]
                            lines.append("  ".join(x for x in cells if x))
                        out.append("\n".join(lines))
                    else:
                        out.append(latex_to_plain(body))
                    continue
                if name == "end":
                    _, i = take_braced(s, i)
                    continue
                if name in NOARG:
                    out.append(NOARG[name])
                    continue
                # unknown command: drop slash, keep name
                out.append(name)
                continue
            # lone backslash
            i += 1
            continue
        if ch == "^":
            i += 1
            body, i = take_atom(s, i)
            if body in ("⊤", "T", "t", "top"):
                out.append("ᵀ")
                continue
            if body in ("★", "*"):
                out.append("*")
                continue
            mapped = script_chars(body, SUP_MAP)
            out.append(mapped if mapped is not None else f"^({body})")
            continue
        if ch == "_":
            i += 1
            body, i = take_atom(s, i)
            mapped = script_chars(body, SUB_MAP)
            out.append(mapped if mapped is not None else f"_{body}")
            continue
        if ch == "{":
            inner, i = take_braced(s, i)
            out.append(latex_to_plain(inner))
            continue
        if ch == "}":
            i += 1
            continue
        if ch == "~":
            out.append(" ")
            i += 1
            continue
        if ch == "&":
            out.append(" ")
            i += 1
            continue
        out.append(ch)
        i += 1
    text = "".join(out)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = text.replace("\\,", " ").replace("\\;", " ")
    text = text.strip() if "\n" not in text else text.strip("\n")
    text = text.replace("nlog", "n log").replace("nlg", "n lg")
    return text


def convert_inline_math(inner: str) -> str:
    plain = latex_to_plain(inner)
    plain = plain.replace("\n", " ").strip()
    if not plain:
        return ""
    # keep as inline code so it won't be eaten by markdown emphasis
    if "`" in plain:
        return plain
    return f"`{plain}`"


def convert_display_math(inner: str) -> str:
    plain = latex_to_plain(inner).strip()
    if not plain:
        return ""
    if "\n" in plain or "[" in plain:
        return "\n```\n" + plain + "\n```\n"
    return f"\n```\n{plain}\n```\n"


def convert_math_in_markdown(text: str) -> str:
    # protect already-escaped dollars (\$60 gym example)
    text = text.replace("\\$", "\x00DOLLAR\x00")
    # TeX thousands: $1{,}000  is money, not math
    text = re.sub(
        r"\$(\d+(?:\{,\}\d+)+)",
        lambda m: m.group(1).replace("{,}", ","),
        text,
    )

    def disp(m: re.Match[str]) -> str:
        return convert_display_math(m.group(1))

    text = re.sub(r"\$\$(.+?)\$\$", disp, text, flags=re.S)

    def inline(m: re.Match[str]) -> str:
        return convert_inline_math(m.group(1))

    # inline math stays on one line — DOTALL would swallow currency like $1,000
    text = re.sub(r"(?<!\\)\$(.+?)\$", inline, text)
    text = text.replace("\x00DOLLAR\x00", "$")
    text = text.replace(r"\Theta", "Θ").replace(r"\Omega", "Ω").replace(r"\lg ", "lg ")
    text = text.replace(r"\lg", "lg")
    return text


def convert_document(src: str) -> str:
    parts = re.split(r"(```[\w+-]*\n[\s\S]*?```)", src)
    out: list[str] = []
    for part in parts:
        if part.startswith("```mermaid"):
            inner = part[len("```mermaid") :]
            if inner.endswith("```"):
                inner = inner[:-3]
            out.append("```mermaid" + restyle_mermaid(inner) + "```")
        elif part.startswith("```"):
            out.append(part)
        else:
            out.append(convert_math_in_markdown(part))
    return "".join(out)


def leftover_report(path: Path, text: str) -> list[str]:
    hits = []
    for pat, label in [
        (r"\$\$", "$$"),
        (r"\\Theta", r"\Theta"),
        (r"\\lg", r"\lg"),
        (r"\\\(", r"\("),
        (r"\\\[", r"\["),
        (r"#FFE082", "#FFE082"),
        (r"#90CAF9", "#90CAF9"),
        (r"color:#1f1f1f", "color:#1f1f1f"),
    ]:
        if re.search(pat, text):
            hits.append(label)
    # leftover $ that isn't currency-like digits
    if re.search(r"(?<![\\`])\$(?![\d])", text):
        hits.append("bare-$")
    return hits


def main() -> None:
    DST_DIR.mkdir(parents=True, exist_ok=True)
    problems: list[str] = []
    for slug, fname, do_write in CHAPTERS:
        src_path = SRC_DIR / fname
        dst_path = DST_DIR / f"{slug}.md"
        if not src_path.exists():
            problems.append(f"MISSING source {fname}")
            continue
        if not do_write:
            print(f"skip  {slug} (keep existing site file)")
            continue
        raw = src_path.read_text(encoding="utf-8")
        converted = convert_document(raw)
        dst_path.write_text(converted, encoding="utf-8")
        hits = leftover_report(dst_path, converted)
        status = "OK" if not hits else "CHECK " + ",".join(hits)
        print(f"write {slug:42} {status}")
        if hits:
            problems.append(f"{slug}: {hits}")
    if problems:
        print("\nleftovers:")
        for p in problems:
            print(" ", p)


if __name__ == "__main__":
    main()
