/* =========================================================
   MARKDOWN, LATEX MATH, SINGLE-PASS SYNTAX HIGHLIGHTER,
   CODE STUDIO, DIFF & STANDALONE BOOK HTML RENDERER
   ========================================================= */
(function (global) {
  "use strict";

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeUrl(url) {
    const trimmed = String(url || "").trim();
    if (/^(https?:|mailto:|#)/i.test(trimmed)) return trimmed;
    return "#";
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    return (bytes / 1024).toFixed(1) + " KB";
  }

  const LANG_COLORS = {
    javascript: "#facc15", typescript: "#38bdf8", python: "#3b82f6",
    html: "#f97316", svg: "#fb923c", css: "#a855f7", json: "#10b981",
    bash: "#22c55e", sql: "#06b6d4", rust: "#ea580c", go: "#0ea5e9",
    java: "#ef4444", cpp: "#6366f1", csharp: "#8b5cf6", php: "#818cf8",
    yaml: "#ec4899", markdown: "#94a3b8", plaintext: "#64748b"
  };

  /* ---------------------------------------------------------
     1. Bug-Free Single-Pass Syntax Tokenizer (Zero Tag Corruption)
     --------------------------------------------------------- */
  const KEYWORDS_BY_LANG = {
    javascript: /^(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|super|import|export|default|from|async|await|try|catch|finally|throw|typeof|instanceof|in|of|null|undefined|true|false|void|delete|yield)$/,
    typescript: /^(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|implements|interface|type|enum|namespace|public|private|protected|readonly|import|export|default|from|async|await|try|catch|finally|throw|typeof|keyof|as|null|undefined|true|false|string|number|boolean|any|unknown|void|never)$/,
    python: /^(?:def|class|return|if|elif|else|for|while|break|continue|pass|import|from|as|try|except|finally|raise|with|lambda|yield|global|nonlocal|assert|del|in|is|not|and|or|None|True|False|async|await|self)$/,
    sql: /^(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|JOIN|INNER|LEFT|RIGHT|OUTER|ON|GROUP|BY|ORDER|ASC|DESC|HAVING|LIMIT|OFFSET|AS|AND|OR|NOT|NULL|PRIMARY|KEY|FOREIGN|REFERENCES|DISTINCT|UNION|ALL|CASE|WHEN|THEN|ELSE|END|COUNT|SUM|AVG|MIN|MAX)$/i,
    bash: /^(?:if|then|else|elif|fi|for|in|do|done|while|case|esac|function|export|local|return|echo|cd|ls|mkdir|rm|cp|mv|cat|grep|sed|awk|curl|git|npm|npx|node|python|pip|docker|sudo|chmod|exit|true|false)$/,
    clike: /^(?:int|float|double|char|void|bool|boolean|byte|short|long|string|String|auto|const|static|final|public|private|protected|class|struct|enum|interface|extends|implements|new|this|super|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|using|namespace|package|import|include|fn|let|mut|pub|impl|trait|match|mod|use|func|defer|go|chan|map|range|nil|null|nullptr|true|false)$/
  };

  function highlightLine(rawLine, lang) {
    const norm = global.FixerParser ? global.FixerParser.normalizeLang(lang) : (lang || "plaintext");

    if (norm === "html" || norm === "xml" || norm === "svg") {
      return highlightMarkupLine(rawLine);
    }
    if (norm === "css" || norm === "scss") {
      return highlightCssLine(rawLine);
    }
    if (norm === "json") {
      return highlightJsonLine(rawLine);
    }

    const kwSet =
      KEYWORDS_BY_LANG[norm] ||
      (["java", "cpp", "c", "csharp", "rust", "go", "php"].includes(norm) ? KEYWORDS_BY_LANG.clike : KEYWORDS_BY_LANG.javascript);

    const hashComment = norm === "python" || norm === "bash" || norm === "yaml" || norm === "ruby";
    const dashComment = norm === "sql";

    let out = "";
    let i = 0;
    const len = rawLine.length;

    while (i < len) {
      const ch = rawLine[i];
      const two = rawLine.slice(i, i + 2);

      // Single-line comments
      if ((!hashComment && two === "//") || (hashComment && ch === "#") || (dashComment && two === "--")) {
        out += '<span class="syn-com">' + escapeHtml(rawLine.slice(i)) + "</span>";
        break;
      }

      // Block comment inline /* ... */
      if (two === "/*") {
        const end = rawLine.indexOf("*/", i + 2);
        const slice = end === -1 ? rawLine.slice(i) : rawLine.slice(i, end + 2);
        out += '<span class="syn-com">' + escapeHtml(slice) + "</span>";
        i += slice.length;
        continue;
      }

      // Strings ("...", '...', `...`)
      if (ch === '"' || ch === "'" || ch === "`") {
        let j = i + 1;
        while (j < len) {
          if (rawLine[j] === "\\") { j += 2; continue; }
          if (rawLine[j] === ch) { j++; break; }
          j++;
        }
        out += '<span class="syn-str">' + escapeHtml(rawLine.slice(i, j)) + "</span>";
        i = j;
        continue;
      }

      // Numbers
      if (/\d/.test(ch) && (i === 0 || !/[a-zA-Z0-9_$]/.test(rawLine[i - 1]))) {
        let j = i;
        while (j < len && /[0-9a-fA-FxXoObB._]/.test(rawLine[j])) j++;
        out += '<span class="syn-num">' + escapeHtml(rawLine.slice(i, j)) + "</span>";
        i = j;
        continue;
      }

      // Identifiers / Keywords / Function calls / Types
      if (/[a-zA-Z_$]/.test(ch)) {
        let j = i;
        while (j < len && /[a-zA-Z0-9_$]/.test(rawLine[j])) j++;
        const word = rawLine.slice(i, j);
        const nextNonSpace = rawLine.slice(j).match(/^\s*\(/);
        if (kwSet.test(word)) {
          out += '<span class="syn-kw">' + escapeHtml(word) + "</span>";
        } else if (nextNonSpace) {
          out += '<span class="syn-fn">' + escapeHtml(word) + "</span>";
        } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word) && word.length > 1) {
          out += '<span class="syn-type">' + escapeHtml(word) + "</span>";
        } else {
          out += escapeHtml(word);
        }
        i = j;
        continue;
      }

      out += escapeHtml(ch);
      i++;
    }

    return out || " ";
  }

  function highlightMarkupLine(line) {
    let out = "";
    let i = 0;
    const len = line.length;
    while (i < len) {
      if (line.startsWith("<!--", i)) {
        const end = line.indexOf("-->", i + 4);
        const slice = end === -1 ? line.slice(i) : line.slice(i, end + 3);
        out += '<span class="syn-com">' + escapeHtml(slice) + "</span>";
        i += slice.length;
        continue;
      }
      if (line[i] === "<") {
        const end = line.indexOf(">", i + 1);
        const slice = end === -1 ? line.slice(i) : line.slice(i, end + 1);
        out += highlightHtmlTag(slice);
        i += slice.length;
        continue;
      }
      const next = line.indexOf("<", i);
      const textChunk = next === -1 ? line.slice(i) : line.slice(i, next);
      out += escapeHtml(textChunk);
      i += textChunk.length;
    }
    return out || " ";
  }

  function highlightHtmlTag(tag) {
    // Parse single <tag attr="val"> safely
    let out = "";
    const m = tag.match(/^(<\/?[\w:!-]+)([\s\S]*?)(\/?>?)$/);
    if (!m) return escapeHtml(tag);
    out += '<span class="syn-tag">' + escapeHtml(m[1]) + "</span>";
    const attrs = m[2];
    let i = 0;
    while (i < attrs.length) {
      if (attrs[i] === '"' || attrs[i] === "'") {
        const q = attrs[i];
        let j = i + 1;
        while (j < attrs.length && attrs[j] !== q) j++;
        if (j < attrs.length) j++;
        out += '<span class="syn-str">' + escapeHtml(attrs.slice(i, j)) + "</span>";
        i = j;
        continue;
      }
      const am = attrs.slice(i).match(/^([a-zA-Z_:][\w:.-]*)(?=\s*=)/);
      if (am) {
        out += '<span class="syn-attr">' + escapeHtml(am[1]) + "</span>";
        i += am[1].length;
        continue;
      }
      out += escapeHtml(attrs[i]);
      i++;
    }
    out += '<span class="syn-tag">' + escapeHtml(m[3]) + "</span>";
    return out;
  }

  function highlightCssLine(line) {
    const trimmed = line.trim();
    if (trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return '<span class="syn-com">' + escapeHtml(line) + "</span>";
    }
    const propMatch = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.*)$/);
    if (propMatch && !line.includes("{")) {
      const val = propMatch[4].replace(/(#[0-9a-fA-F]{3,8}|\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|dvh|ch|s|ms|deg)?\b)/g, function (m) {
        return "\uE010" + m + "\uE011";
      });
      const escapedVal = escapeHtml(val)
        .replace(/\uE010(.*?)\uE011/g, '<span class="syn-num">$1</span>');
      return escapeHtml(propMatch[1]) +
        '<span class="syn-attr">' + escapeHtml(propMatch[2]) + "</span>" +
        escapeHtml(propMatch[3]) + escapedVal;
    }
    if (line.includes("{") || trimmed.startsWith("@")) {
      return '<span class="syn-tag">' + escapeHtml(line) + "</span>";
    }
    return escapeHtml(line) || " ";
  }

  function highlightJsonLine(line) {
    let out = "";
    let i = 0;
    const len = line.length;
    while (i < len) {
      if (line[i] === '"') {
        let j = i + 1;
        while (j < len) {
          if (line[j] === "\\") { j += 2; continue; }
          if (line[j] === '"') { j++; break; }
          j++;
        }
        const token = line.slice(i, j);
        const isKey = /^\s*:/.test(line.slice(j));
        out += '<span class="' + (isKey ? "syn-attr" : "syn-str") + '">' + escapeHtml(token) + "</span>";
        i = j;
        continue;
      }
      const nm = line.slice(i).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      if (nm) {
        out += '<span class="syn-num">' + escapeHtml(nm[0]) + "</span>";
        i += nm[0].length;
        continue;
      }
      const bm = line.slice(i).match(/^(?:true|false|null)\b/);
      if (bm) {
        out += '<span class="syn-kw">' + escapeHtml(bm[0]) + "</span>";
        i += bm[0].length;
        continue;
      }
      out += escapeHtml(line[i]);
      i++;
    }
    return out || " ";
  }

  /* ---------------------------------------------------------
     2. Interactive Code Card Builder
     --------------------------------------------------------- */
  function buildCodeCardHtml(block, options) {
    const opts = options || {};
    const showLines = opts.showLineNumbers !== false;
    const wrapAll = !!opts.wrapLines;
    const lines = (block.code || "").split("\n");
    const langColor = LANG_COLORS[block.lang] || "#3b82f6";
    const isPreviewable = ["html", "svg"].includes(block.lang);
    const isJson = block.lang === "json";

    const gutterHtml = lines.map(function (_, idx) {
      return '<span class="ln" data-line="' + (idx + 1) + '">' + (idx + 1) + "</span>";
    }).join("");

    const codeLinesHtml = lines.map(function (line, idx) {
      return '<span class="code-line" data-line="' + (idx + 1) + '">' + highlightLine(line, block.lang) + "</span>";
    }).join("");

    const cardIdAttr = opts.cardPrefix ? (opts.cardPrefix + block.index) : block.id;

    return (
      '<div class="code-card' + (wrapAll ? " wrap-lines" : "") + '" id="' + escapeHtml(cardIdAttr) + '" data-code-index="' + block.index + '">' +
        '<div class="code-card-header">' +
          '<div class="code-card-left">' +
            '<button class="code-collapse-btn" type="button" data-code-action="collapse" title="Lipat / Buka Blok">&#9662;</button>' +
            '<span class="code-lang-dot" style="background:' + langColor + '"></span>' +
            '<span class="code-lang">' + escapeHtml(block.lang) + "</span>" +
            '<span class="code-filename" title="' + escapeHtml(block.filename) + '">' + escapeHtml(block.filename) + "</span>" +
            '<span class="code-meta-badge">' + block.lines + " baris &bull; " + formatBytes(block.bytes) + "</span>" +
          "</div>" +
          '<div class="code-card-actions">' +
            (isPreviewable ? '<button class="btn btn-sm btn-accent-soft" type="button" data-code-action="preview" title="Jalankan Pratinjau Langsung (Sandbox)">Preview</button>' : "") +
            (isJson ? '<button class="btn btn-sm" type="button" data-code-action="format-json" title="Rapikan Format JSON">Beautify</button>' : "") +
            '<button class="btn btn-sm" type="button" data-code-action="wrap" title="Toggle Word Wrap">Wrap</button>' +
            (opts.showJump ? '<button class="btn btn-sm" type="button" data-code-action="jump" title="Lompat ke posisi di Preview">Jump</button>' : "") +
            '<button class="btn btn-sm" type="button" data-code-action="focus" title="Lihat Penuh (Zen Mode)">Focus</button>' +
            '<button class="btn btn-sm" type="button" data-code-action="download" title="Unduh File Kode">Save</button>' +
            '<button class="btn btn-sm btn-primary" type="button" data-code-action="copy">Copy</button>' +
          "</div>" +
        "</div>" +
        '<div class="code-body">' +
          '<div class="code-gutter' + (showLines ? "" : " hidden") + '">' + gutterHtml + "</div>" +
          "<pre><code>" + codeLinesHtml + "</code></pre>" +
        "</div>" +
      "</div>"
    );
  }

  /* ---------------------------------------------------------
     3. Offline LaTeX Math Renderer
     --------------------------------------------------------- */
  const LATEX_SYMBOLS = {
    "\\alpha": "α", "\\beta": "β", "\\gamma": "γ", "\\delta": "δ", "\\epsilon": "ε", "\\varepsilon": "ε",
    "\\zeta": "ζ", "\\eta": "η", "\\theta": "θ", "\\lambda": "λ", "\\mu": "μ", "\\nu": "ν", "\\xi": "ξ",
    "\\pi": "π", "\\rho": "ρ", "\\sigma": "σ", "\\tau": "τ", "\\phi": "φ", "\\varphi": "φ", "\\chi": "χ",
    "\\psi": "ψ", "\\omega": "ω", "\\Gamma": "Γ", "\\Delta": "Δ", "\\Theta": "Θ", "\\Lambda": "Λ",
    "\\Pi": "Π", "\\Sigma": "Σ", "\\Phi": "Φ", "\\Psi": "Ψ", "\\Omega": "Ω",
    "\\infty": "∞", "\\pm": "±", "\\mp": "∓", "\\times": "×", "\\cdot": "·", "\\div": "÷",
    "\\neq": "≠", "\\ne": "≠", "\\leq": "≤", "\\le": "≤", "\\geq": "≥", "\\ge": "≥",
    "\\approx": "≈", "\\equiv": "≡", "\\sim": "∼", "\\propto": "∝",
    "\\sum": "∑", "\\prod": "∏", "\\int": "∫", "\\oint": "∮", "\\partial": "∂", "\\nabla": "∇",
    "\\forall": "∀", "\\exists": "∃", "\\in": "∈", "\\notin": "∉", "\\subset": "⊂", "\\subseteq": "⊆",
    "\\cup": "∪", "\\cap": "∩", "\\emptyset": "∅", "\\rightarrow": "→", "\\to": "→", "\\leftarrow": "←",
    "\\Rightarrow": "⇒", "\\Leftarrow": "⇐", "\\Leftrightarrow": "⇔", "\\iff": "⇔",
    "\\mathbb{R}": "ℝ", "\\mathbb{N}": "ℕ", "\\mathbb{Z}": "ℤ", "\\mathbb{Q}": "ℚ", "\\mathbb{C}": "ℂ",
    "\\ldots": "…", "\\cdots": "⋯", "\\dots": "…", "\\degree": "°", "\\circ": "∘", "\\angle": "∠"
  };

  function renderMath(tex, displayMode) {
    let s = escapeHtml((tex || "").trim());

    // Handle \text{...}, \mathrm{...}, \mathbf{...}
    s = s.replace(/\\(?:text|mathrm)\{([^{}]+)\}/g, '<span style="font-style:normal">$1</span>');
    s = s.replace(/\\mathbf\{([^{}]+)\}/g, "<strong>$1</strong>");

    // Handle \frac{a}{b} (up to 3 nested passes)
    for (let p = 0; p < 3; p++) {
      s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="math-frac"><span class="math-frac-num">$1</span><span class="math-frac-den">$2</span></span>');
    }

    // Handle \sqrt{x}
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<span class="math-sqrt">&radic;<span class="math-sqrt-rad">$1</span></span>');

    // Superscripts & Subscripts
    s = s.replace(/\^\{([^{}]+)\}/g, "<sup>$1</sup>");
    s = s.replace(/\^([a-zA-Z0-9+-])/g, "<sup>$1</sup>");
    s = s.replace(/_\{([^{}]+)\}/g, "<sub>$1</sub>");
    s = s.replace(/_([a-zA-Z0-9+-])/g, "<sub>$1</sub>");

    // Replace known symbols (longest keys first)
    const keys = Object.keys(LATEX_SYMBOLS).sort(function (a, b) { return b.length - a.length; });
    for (let k = 0; k < keys.length; k++) {
      const sym = keys[k];
      if (s.includes(sym)) {
        s = s.split(sym).join(LATEX_SYMBOLS[sym]);
      }
    }

    // Clean spacing commands
    s = s.replace(/\\(?:left|right|quad|qquad|,|;|!)/g, " ");

    if (displayMode) {
      return '<div class="math-block">' + s + "</div>";
    }
    return '<span class="math-inline">' + s + "</span>";
  }

  /* ---------------------------------------------------------
     4. Full Block & Inline Markdown Renderer
     --------------------------------------------------------- */
  function renderInline(rawText) {
    const tokens = [];
    function stash(html) {
      tokens.push(html);
      return "\uE020" + (tokens.length - 1) + "\uE021";
    }

    let text = String(rawText || "");

    // 1. Inline code `...`
    text = text.replace(/`([^`\n]+)`/g, function (_, code) {
      return stash('<code class="inline-code">' + escapeHtml(code) + "</code>");
    });

    // 2. Inline Math $...$ (guard against currency like $5 and $10)
    text = text.replace(/\$(?!\s)([^$\n]+?)(?<!\s)\$(?!\d)/g, function (match, expr) {
      if (/^\d+(?:[.,]\d+)?\s+[a-zA-Z]/.test(expr) && !/[\\^_=+\-*/<>]/.test(expr)) {
        return match;
      }
      return stash(renderMath(expr, false));
    });

    // 3. Escape remaining HTML safely
    text = escapeHtml(text);

    // 4. Images ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, alt, url) {
      return stash('<img src="' + escapeHtml(sanitizeUrl(url)) + '" alt="' + alt + '" style="max-width:100%;border-radius:8px;">');
    });

    // 5. Links [label](url)
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, url) {
      const safe = sanitizeUrl(url);
      const ext = safe.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";
      return stash('<a href="' + escapeHtml(safe) + '"' + ext + ">" + label + "</a>");
    });

    // 6. Highlight ==text==
    text = text.replace(/==([^=\n]+)==/g, "<mark>$1</mark>");

    // 7. Strikethrough ~~text~~
    text = text.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");

    // 8. Bold + Italic ***text***
    text = text.replace(/\*\*\*([^*\n]+)\*\*\*/g, "<strong><em>$1</em></strong>");

    // 9. Bold **text** or __text__
    text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");

    // 10. Italic *text* or _text_
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    text = text.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");

    // Restore stashed tokens
    text = text.replace(/\uE020(\d+)\uE021/g, function (_, idx) {
      return tokens[Number(idx)];
    });

    return text;
  }

  function renderMarkdown(markdown, metadata, options) {
    const opts = options || {};
    const md = markdown || "";
    const meta = metadata || (global.FixerParser ? global.FixerParser.extractMetadata(md) : { headings: [], codeBlocks: [] });
    const lines = md.split("\n");
    const htmlParts = [];

    let headingCursor = 0;
    let codeCursor = 0;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Skip blank lines
      if (line.trim() === "") {
        i++;
        continue;
      }

      // 1. Fenced Code Block
      if (/^[ \t]{0,3}`{3,}/.test(line)) {
        i++;
        while (i < lines.length && !/^[ \t]{0,3}`{3,}\s*$/.test(lines[i])) {
          i++;
        }
        i++; // skip closing fence
        const block = meta.codeBlocks[codeCursor++];
        if (block) {
          htmlParts.push(buildCodeCardHtml(block, opts));
        }
        continue;
      }

      // 2. Collapsible Thinking Block (:::thought ... :::)
      if (/^:::thought\s*$/.test(line.trim())) {
        i++;
        const thoughtLines = [];
        while (i < lines.length && lines[i].trim() !== ":::") {
          thoughtLines.push(lines[i]);
          i++;
        }
        i++; // skip closing :::
        const innerHtml = thoughtLines.join("\n").split(/\n\n+/).map(function (p) {
          return "<p>" + renderInline(p.replace(/\n/g, "<br>")) + "</p>";
        }).join("");
        htmlParts.push(
          '<details class="thinking-block"><summary>AI Thinking / Reasoning Process</summary>' +
          '<div class="thinking-content">' + innerHtml + "</div></details>"
        );
        continue;
      }

      // 3. Display Math Block $$ ... $$
      if (/^\s*\$\$/.test(line)) {
        const singleLine = line.trim().match(/^\$\$(.+)\$\$$/);
        if (singleLine) {
          htmlParts.push(renderMath(singleLine[1], true));
          i++;
          continue;
        }
        i++;
        const mathLines = [];
        while (i < lines.length && !/^\s*\$\$\s*$/.test(lines[i])) {
          mathLines.push(lines[i]);
          i++;
        }
        i++;
        htmlParts.push(renderMath(mathLines.join("\n"), true));
        continue;
      }

      // 4. Headings
      const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (hMatch) {
        const lvl = hMatch[1].length;
        const hMeta = meta.headings[headingCursor++];
        const idAttr = hMeta ? ' id="' + escapeHtml((opts.headingPrefix || "") + hMeta.id) + '"' : "";
        htmlParts.push("<h" + lvl + idAttr + ">" + renderInline(hMatch[2].trim()) + "</h" + lvl + ">");
        i++;
        continue;
      }

      // 5. Scene Break / Horizontal Rule
      if (/^[ \t]*(?:[-*_][ \t]*){3,}$/.test(line)) {
        if (opts.bookMode) {
          htmlParts.push('<div class="scene-break" aria-hidden="true">&#10022; &nbsp; &#10022; &nbsp; &#10022;</div>');
        } else {
          htmlParts.push("<hr>");
        }
        i++;
        continue;
      }

      // 6. Table
      if (
        i + 1 < lines.length &&
        lines[i].includes("|") &&
        /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(lines[i + 1])
      ) {
        const headCells = splitTableRow(lines[i]);
        const aligns = splitTableRow(lines[i + 1]).map(function (c) {
          if (c.startsWith(":") && c.endsWith(":")) return "center";
          if (c.endsWith(":")) return "right";
          return "left";
        });
        i += 2;
        const bodyRows = [];
        while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
          bodyRows.push(splitTableRow(lines[i]));
          i++;
        }

        let tHtml = "<table><thead><tr>";
        headCells.forEach(function (cell, idx) {
          tHtml += '<th style="text-align:' + (aligns[idx] || "left") + '">' + renderInline(cell) + "</th>";
        });
        tHtml += "</tr></thead><tbody>";
        bodyRows.forEach(function (row) {
          tHtml += "<tr>";
          for (let c = 0; c < headCells.length; c++) {
            tHtml += '<td style="text-align:' + (aligns[c] || "left") + '">' + renderInline(row[c] || "") + "</td>";
          }
          tHtml += "</tr>";
        });
        tHtml += "</tbody></table>";
        htmlParts.push(tHtml);
        continue;
      }

      // 7. Blockquotes & GitHub-Style Callouts ([!NOTE], [!TIP], [!WARNING], [!CAUTION])
      if (/^\s*>\s?/.test(line)) {
        const bqLines = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          bqLines.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        const calloutMatch = bqLines[0].trim().match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]$/i);
        if (calloutMatch) {
          const kind = calloutMatch[1].toLowerCase();
          const cssKind = kind === "important" ? "note" : kind;
          const body = bqLines.slice(1).map(function (l) { return renderInline(l); }).join("<br>");
          htmlParts.push(
            '<div class="callout callout-' + cssKind + '">' +
              '<div class="callout-title">' + escapeHtml(calloutMatch[1].toUpperCase()) + "</div>" +
              "<div>" + body + "</div>" +
            "</div>"
          );
        } else {
          htmlParts.push("<blockquote><p>" + bqLines.map(renderInline).join("<br>") + "</p></blockquote>");
        }
        continue;
      }

      // 8. Unordered & Task Lists
      if (/^[ \t]*[-*+]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[ \t]*[-*+]\s+/.test(lines[i])) {
          const itemBody = lines[i].replace(/^[ \t]*[-*+]\s+/, "");
          const taskMatch = itemBody.match(/^\[( |x|X)\]\s+(.*)$/);
          if (taskMatch) {
            const checked = taskMatch[1].toLowerCase() === "x" ? " checked" : "";
            items.push('<li class="task-item"><input type="checkbox" disabled' + checked + "><span>" + renderInline(taskMatch[2]) + "</span></li>");
          } else {
            items.push("<li>" + renderInline(itemBody) + "</li>");
          }
          i++;
        }
        htmlParts.push("<ul>" + items.join("") + "</ul>");
        continue;
      }

      // 9. Ordered Lists
      if (/^[ \t]*\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[ \t]*\d+\.\s+/.test(lines[i])) {
          const itemBody = lines[i].replace(/^[ \t]*\d+\.\s+/, "");
          items.push("<li>" + renderInline(itemBody) + "</li>");
          i++;
        }
        htmlParts.push("<ol>" + items.join("") + "</ol>");
        continue;
      }

      // 10. Normal Paragraph
      const pLines = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !/^[ \t]{0,3}(`{3,}|#{1,6}\s+|>\s?|[-*+]\s+|\d+\.\s+|\$\$|:::thought|([-*_]\s*){3,}$)/.test(lines[i])
      ) {
        pLines.push(lines[i]);
        i++;
      }
      if (pLines.length > 0) {
        htmlParts.push("<p>" + pLines.map(renderInline).join("<br>") + "</p>");
      }
    }

    return htmlParts.join("\n");
  }

  function splitTableRow(row) {
    let r = row.trim();
    if (r.startsWith("|")) r = r.slice(1);
    if (r.endsWith("|")) r = r.slice(0, -1);
    return r.split("|").map(function (c) { return c.trim(); });
  }

  /* ---------------------------------------------------------
     5. Book View DOM Enhancements (Dialogue Highlight & Bionic)
     Applied ONLY to safe text nodes (never code or math!)
     --------------------------------------------------------- */
  function enhanceBookArticleDom(containerEl, opts) {
    if (!containerEl) return;
    if (!opts.dialogueHighlight && !opts.bionicReading) return;

    const blocks = containerEl.querySelectorAll("p, li, blockquote");
    blocks.forEach(function (blockEl) {
      const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.closest("code, pre, .code-card, .math-block, .math-inline, a, script, style")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const textNodes = [];
      let current;
      while ((current = walker.nextNode())) textNodes.push(current);

      textNodes.forEach(function (tNode) {
        let html = escapeHtml(tNode.nodeValue);

        if (opts.dialogueHighlight) {
          // Highlight straight "..." and curly “...” or «...» dialogue
          html = html.replace(/(&quot;[^&]+?&quot;|“[^”]+?”|«[^»]+?»)/g, '<span class="dialogue-hl">$1</span>');
        }

        if (opts.bionicReading) {
          // Bold the first ~40% of each word outside HTML tags
          html = html.replace(/(<[^>]+>)|([A-Za-z\u00C0-\u024F]{2,})/g, function (match, tag, word) {
            if (tag) return tag;
            const splitAt = word.length <= 3 ? 1 : Math.ceil(word.length * 0.42);
            return '<span class="bionic-b">' + word.slice(0, splitAt) + "</span>" + word.slice(splitAt);
          });
        }

        const span = document.createElement("span");
        span.innerHTML = html;
        tNode.parentNode.replaceChild(span, tNode);
      });
    });
  }

  /* ---------------------------------------------------------
     6. Diff View HTML Renderer
     --------------------------------------------------------- */
  function renderDiffHtml(ops, changesOnly) {
    if (!ops || ops.length === 0) {
      return '<div class="empty-state"><h3>Belum ada teks</h3><p>Masukkan teks mentah untuk melihat perbedaan sebelum &amp; sesudah perbaikan.</p></div>';
    }

    let added = 0;
    let removed = 0;
    ops.forEach(function (o) {
      if (o.type === "add") added++;
      if (o.type === "rem") removed++;
    });

    if (added === 0 && removed === 0) {
      return {
        html: '<div class="empty-state"><h3>Teks Sudah Bersih!</h3><p>Tidak ada perubahan antara teks input dan hasil perbaikan saat ini.</p></div>',
        added: 0,
        removed: 0
      };
    }

    const visibleIndices = new Set();
    if (changesOnly) {
      for (let i = 0; i < ops.length; i++) {
        if (ops[i].type !== "eq") {
          for (let k = Math.max(0, i - 2); k <= Math.min(ops.length - 1, i + 2); k++) {
            visibleIndices.add(k);
          }
        }
      }
    }

    const parts = [];
    let skipped = 0;

    for (let i = 0; i < ops.length; i++) {
      if (changesOnly && !visibleIndices.has(i)) {
        skipped++;
        continue;
      }
      if (skipped > 0) {
        parts.push('<div class="diff-line diff-sep">&bull;&bull;&bull; ' + skipped + " baris sama disembunyikan &bull;&bull;&bull;</div>");
        skipped = 0;
      }
      const op = ops[i];
      const cls = op.type === "add" ? "diff-add" : (op.type === "rem" ? "diff-rem" : "diff-eq");
      const sign = op.type === "add" ? "+" : (op.type === "rem" ? "-" : " ");
      const ln = op.newLine || op.oldLine || "";
      parts.push(
        '<div class="diff-line ' + cls + '">' +
          '<span class="diff-ln">' + ln + "</span>" +
          '<span class="diff-sign">' + sign + "</span>" +
          '<span class="diff-text">' + (escapeHtml(op.text) || "&nbsp;") + "</span>" +
        "</div>"
      );
    }

    if (skipped > 0) {
      parts.push('<div class="diff-line diff-sep">&bull;&bull;&bull; ' + skipped + " baris sama disembunyikan &bull;&bull;&bull;</div>");
    }

    return { html: parts.join(""), added: added, removed: removed };
  }

  /* ---------------------------------------------------------
     7. Combined Web Sandbox Builder (HTML + CSS + JS)
     --------------------------------------------------------- */
  function buildCombinedWebHtml(codeBlocks, singleBlock) {
    if (singleBlock) {
      if (singleBlock.lang === "svg") {
        return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;}</style></head><body>' + singleBlock.code + "</body></html>";
      }
      return singleBlock.code;
    }

    const htmlBlocks = codeBlocks.filter(function (b) { return b.lang === "html"; });
    const cssBlocks = codeBlocks.filter(function (b) { return b.lang === "css"; });
    const jsBlocks = codeBlocks.filter(function (b) { return b.lang === "javascript"; });

    const cssTag = cssBlocks.length ? "<style>\n" + cssBlocks.map(function (b) { return b.code; }).join("\n\n") + "\n</style>" : "";
    const jsTag = jsBlocks.length ? "<script>\n" + jsBlocks.map(function (b) { return b.code; }).join("\n\n") + "\n</" + "script>" : "";

    let baseHtml = htmlBlocks.length ? htmlBlocks[0].code : "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body><div id='app'></div></body></html>";

    if (cssTag) {
      baseHtml = /<\/head>/i.test(baseHtml)
        ? baseHtml.replace(/<\/head>/i, cssTag + "\n</head>")
        : cssTag + "\n" + baseHtml;
    }
    if (jsTag) {
      baseHtml = /<\/body>/i.test(baseHtml)
        ? baseHtml.replace(/<\/body>/i, jsTag + "\n</body>")
        : baseHtml + "\n" + jsTag;
    }
    return baseHtml;
  }

  /* ---------------------------------------------------------
     8. Standalone Interactive Offline Book HTML Exporter
     --------------------------------------------------------- */
  function generateStandaloneBookHtml(title, bodyHtml, headings, defaultTheme) {
    const safeTitle = escapeHtml(title || "AI Studio Fixed Document");
    const themeVal = defaultTheme || "sepia";
    const tocItems = (headings || []).map(function (h) {
      return '<a href="#' + escapeHtml(h.id) + '" class="toc-l' + Math.min(3, h.level) + '">' + escapeHtml(h.title) + "</a>";
    }).join("");

    return '<!DOCTYPE html>\n<html lang="id" data-theme="' + escapeHtml(themeVal) + '">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>' + safeTitle + '</title>\n<style>\n' +
      ':root{--bg:#e4dac5;--page:#f7f1e3;--fg:#2f2419;--muted:#786552;--border:#d5c7ab;--accent:#9a5523;--code:#ece3d1;}\n' +
      'html[data-theme="light"]{--bg:#eff3f9;--page:#ffffff;--fg:#0f172a;--muted:#64748b;--border:#d5dfec;--accent:#2563eb;--code:#f1f5f9;}\n' +
      'html[data-theme="dark"]{--bg:#090d16;--page:#121926;--fg:#e2e8f0;--muted:#94a3b8;--border:#25324a;--accent:#60a5fa;--code:#0b101b;}\n' +
      '*{box-sizing:border-box;}body{margin:0;background:var(--bg);color:var(--fg);font-family:Georgia,serif;line-height:1.85;font-size:18px;}\n' +
      '.bar{position:sticky;top:0;z-index:10;background:var(--page);border-bottom:1px solid var(--border);padding:10px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-family:system-ui,sans-serif;font-size:13px;}\n' +
      '.bar button{border:1px solid var(--border);background:transparent;color:var(--fg);padding:5px 10px;border-radius:6px;cursor:pointer;}\n' +
      '.wrap{max-width:74ch;margin:24px auto 64px;background:var(--page);border:1px solid var(--border);border-radius:10px;padding:38px 34px;box-shadow:0 12px 32px rgba(0,0,0,0.12);}\n' +
      'h1,h2,h3{line-height:1.3;margin-top:1.3em;}h1{border-bottom:1px solid var(--border);padding-bottom:8px;text-align:center;}\n' +
      'pre{background:var(--code);padding:14px;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:13.5px;border:1px solid var(--border);}\n' +
      'code.inline-code{background:var(--code);padding:2px 5px;border-radius:4px;font-family:monospace;font-size:0.86em;}\n' +
      'table{width:100%;border-collapse:collapse;margin:1em 0;font-size:0.9em;}th,td{border:1px solid var(--border);padding:8px 10px;}\n' +
      'blockquote{border-left:4px solid var(--accent);margin:1em 0;padding:8px 14px;background:rgba(128,128,128,0.08);}\n' +
      '.scene-break{text-align:center;margin:1.8em 0;letter-spacing:0.35em;color:var(--muted);}\n' +
      '.code-card-actions,.code-collapse-btn{display:none!important;}\n' +
      '.toc{margin-bottom:24px;padding:12px 16px;border:1px solid var(--border);border-radius:8px;font-family:system-ui,sans-serif;font-size:13.5px;}\n' +
      '.toc a{display:block;color:var(--accent);text-decoration:none;padding:3px 0;}.toc a.toc-l2{padding-left:14px;}.toc a.toc-l3{padding-left:28px;}\n' +
      '@media(max-width:640px){.wrap{margin:10px;padding:22px 16px;}}\n' +
      '</style>\n</head>\n<body>\n' +
      '<div class="bar"><strong>' + safeTitle + '</strong><div>' +
      '<button onclick="setFs(-2)">A-</button> <button onclick="setFs(2)">A+</button> ' +
      '<button onclick="cycleTheme()">Tema</button>' +
      '</div></div>\n' +
      '<main class="wrap">' +
      (tocItems ? '<details class="toc"><summary style="cursor:pointer;font-weight:700;">Daftar Isi</summary>' + tocItems + "</details>" : "") +
      bodyHtml +
      '</main>\n<script>\n' +
      'var fs=18,themes=["sepia","light","dark"],ti=Math.max(0,themes.indexOf(document.documentElement.dataset.theme));\n' +
      'function setFs(d){fs=Math.min(28,Math.max(13,fs+d));document.body.style.fontSize=fs+"px";}\n' +
      'function cycleTheme(){ti=(ti+1)%themes.length;document.documentElement.dataset.theme=themes[ti];}\n' +
      '</' + 'script>\n</body>\n</html>';
  }

  global.FixerRenderer = {
    escapeHtml: escapeHtml,
    formatBytes: formatBytes,
    highlightLine: highlightLine,
    buildCodeCardHtml: buildCodeCardHtml,
    renderMath: renderMath,
    renderMarkdown: renderMarkdown,
    enhanceBookArticleDom: enhanceBookArticleDom,
    renderDiffHtml: renderDiffHtml,
    buildCombinedWebHtml: buildCombinedWebHtml,
    generateStandaloneBookHtml: generateStandaloneBookHtml
  };
})(window);