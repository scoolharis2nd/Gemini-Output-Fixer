/**
 * Google AI Studio Output Fixer — Masterpiece Markdown, Code & Book Renderer
 * Architecture:
 * - XSS-safe escaping on all user content
 * - Single-Pass Tokenized Syntax Highlighter (eliminates corrupted HTML tag bugs)
 * - IDE-grade Interactive Code Cards with line numbers, wrap, download & live preview support
 * - Literary Book Mode with ornamental scene breaks, drop caps & safe dialogue highlighting
 */
(function (global) {
  'use strict';

  const LANG_META = {
    javascript: { label: 'JavaScript', ext: 'js', color: '#f7df1e', previewable: false },
    typescript: { label: 'TypeScript', ext: 'ts', color: '#3178c6', previewable: false },
    python:     { label: 'Python',     ext: 'py', color: '#3776ab', previewable: false },
    html:       { label: 'HTML',       ext: 'html', color: '#e34f26', previewable: true },
    svg:        { label: 'SVG',        ext: 'svg', color: '#ffb13b', previewable: true },
    xml:        { label: 'XML',        ext: 'xml', color: '#f97316', previewable: false },
    css:        { label: 'CSS',        ext: 'css', color: '#38bdf8', previewable: false },
    scss:       { label: 'SCSS',       ext: 'scss', color: '#ec4899', previewable: false },
    json:       { label: 'JSON',       ext: 'json', color: '#10b981', previewable: false },
    sql:        { label: 'SQL',        ext: 'sql', color: '#a855f7', previewable: false },
    bash:       { label: 'Bash',       ext: 'sh', color: '#4ade80', previewable: false },
    java:       { label: 'Java',       ext: 'java', color: '#f89820', previewable: false },
    cpp:        { label: 'C++',        ext: 'cpp', color: '#60a5fa', previewable: false },
    c:          { label: 'C',          ext: 'c', color: '#60a5fa', previewable: false },
    csharp:     { label: 'C#',         ext: 'cs', color: '#9b4f96', previewable: false },
    go:         { label: 'Go',         ext: 'go', color: '#00add8', previewable: false },
    rust:       { label: 'Rust',       ext: 'rs', color: '#dea584', previewable: false },
    php:        { label: 'PHP',        ext: 'php', color: '#777bb4', previewable: false },
    ruby:       { label: 'Ruby',       ext: 'rb', color: '#cc342d', previewable: false },
    yaml:       { label: 'YAML',       ext: 'yml', color: '#f43f5e', previewable: false },
    markdown:   { label: 'Markdown',   ext: 'md', color: '#94a3b8', previewable: false },
    text:       { label: 'Plain Text', ext: 'txt', color: '#64748b', previewable: false }
  };

  function getLanguageMeta(lang) {
    const key = (lang || 'text').toLowerCase();
    return LANG_META[key] || { label: key.toUpperCase(), ext: 'txt', color: '#64748b', previewable: false };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeUrl(url) {
    const trimmed = (url || '').trim();
    if (/^(https?:|mailto:|#|\/)/i.test(trimmed)) return trimmed;
    return '#';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  /* =========================================================
     SINGLE-PASS SYNTAX HIGHLIGHTER (ZERO HTML CORRUPTION)
     ========================================================= */
  const KEYWORDS_BY_LANG = {
    js: new Set(['async','await','break','case','catch','class','const','continue','debugger','default','delete','do','else','export','extends','false','finally','for','from','function','if','import','in','instanceof','let','new','null','of','return','static','super','switch','this','throw','true','try','typeof','undefined','var','void','while','yield','interface','type','enum','implements','private','public','protected','readonly']),
    py: new Set(['False','None','True','and','as','assert','async','await','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield','match','case']),
    sql: new Set(['SELECT','FROM','WHERE','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','ALTER','DROP','JOIN','INNER','LEFT','RIGHT','OUTER','ON','GROUP','BY','ORDER','ASC','DESC','LIMIT','OFFSET','AS','AND','OR','NOT','NULL','IS','IN','LIKE','DISTINCT','HAVING','UNION','ALL','CASE','WHEN','THEN','ELSE','END','PRIMARY','KEY','FOREIGN','REFERENCES','INDEX','WITH']),
    bash: new Set(['if','then','else','elif','fi','for','in','do','done','while','case','esac','function','return','export','local','echo','printf','cd','ls','grep','awk','sed','curl','git','npm','yarn','pnpm','python','python3','pip','docker','sudo','chmod','mkdir','rm','cp','mv','cat','exit']),
    c: new Set(['auto','break','case','char','const','continue','default','do','double','else','enum','extern','float','for','goto','if','int','long','register','return','short','signed','sizeof','static','struct','switch','typedef','union','unsigned','void','volatile','while','class','public','private','protected','namespace','using','template','typename','virtual','override','bool','true','false','nullptr','new','delete','try','catch','throw','fn','let','mut','pub','impl','trait','match','use','mod','func','package','go','defer','chan','range','var','string','interface','extends','implements','final','abstract','synchronized','echo','foreach','require','include'])
  };

  function wrapToken(cls, text) {
    if (!cls) return escapeHtml(text);
    return `<span class="syn-${cls}">${escapeHtml(text)}</span>`;
  }

  function highlightLineOrCode(code, lang) {
    const l = (lang || 'text').toLowerCase();
    if (!code || l === 'text') return escapeHtml(code || '');
    if (l === 'html' || l === 'xml' || l === 'svg') return tokenizeHtml(code);
    if (l === 'css' || l === 'scss') return tokenizeCss(code);
    if (l === 'json') return tokenizeJson(code);
    if (l === 'sql') return tokenizeSql(code);
    if (l === 'bash' || l === 'sh' || l === 'shell') return tokenizeBash(code);
    if (l === 'python') return tokenizePython(code);
    if (l === 'yaml') return tokenizeYaml(code);
    return tokenizeCFamily(code, l);
  }

  function tokenizeHtml(src) {
    const re = /(<!--[\s\S]*?-->)|(<!DOCTYPE[^>]*>)|(<\/?[a-zA-Z][\w:-]*)|(\/?>)|(\s+[a-zA-Z_:][\w:.-]*(?=\s*=))|("[^"]*"|'[^']*')/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out += escapeHtml(src.slice(last, m.index));
      if (m[1]) out += wrapToken('com', m[1]);
      else if (m[2]) out += wrapToken('kw', m[2]);
      else if (m[3]) out += wrapToken('tag', m[3]);
      else if (m[4]) out += wrapToken('tag', m[4]);
      else if (m[5]) out += wrapToken('attr', m[5]);
      else if (m[6]) out += wrapToken('str', m[6]);
      last = re.lastIndex;
    }
    if (last < src.length) out += escapeHtml(src.slice(last));
    return out;
  }

  function tokenizeCss(src) {
    const re = /(\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[a-zA-Z-]+)|(--[a-zA-Z0-9-]+)|([a-zA-Z-]+(?=\s*:))|(#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|dvh|%|s|ms|deg|ch)?\b)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out += escapeHtml(src.slice(last, m.index));
      if (m[1]) out += wrapToken('com', m[1]);
      else if (m[2]) out += wrapToken('str', m[2]);
      else if (m[3]) out += wrapToken('kw', m[3]);
      else if (m[4]) out += wrapToken('type', m[4]);
      else if (m[5]) out += wrapToken('attr', m[5]);
      else if (m[6]) out += wrapToken('num', m[6]);
      last = re.lastIndex;
    }
    if (last < src.length) out += escapeHtml(src.slice(last));
    return out;
  }

  function tokenizeJson(src) {
    const re = /("(?:\\.|[^"\\])*")(\s*:)|("(?:\\.|[^"\\])*")|(\b(?:true|false|null)\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out += escapeHtml(src.slice(last, m.index));
      if (m[1]) out += wrapToken('attr', m[1]) + escapeHtml(m[2]);
      else if (m[3]) out += wrapToken('str', m[3]);
      else if (m[4]) out += wrapToken('kw', m[4]);
      else if (m[5]) out += wrapToken('num', m[5]);
      last = re.lastIndex;
    }
    if (last < src.length) out += escapeHtml(src.slice(last));
    return out;
  }

  function tokenizeSql(src) {
    const re = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|[^'])*'|"(?:\\.|[^"\\])*")|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out += escapeHtml(src.slice(last, m.index));
      if (m[1]) out += wrapToken('com', m[1]);
      else if (m[2]) out += wrapToken('str', m[2]);
      else if (m[3]) out += wrapToken('num', m[3]);
      else if (m[4]) {
        const up = m[4].toUpperCase();
        out += KEYWORDS_BY_LANG.sql.has(up) ? wrapToken('kw', m[4]) : escapeHtml(m[4]);
      }
      last = re.lastIndex;
    }
    if (last < src.length) out += escapeHtml(src.slice(last));
    return out;
  }

  function tokenizeBash(src) {
    const re = /(#[^\n]*)|("(?:\\.|[^"\\])*"|'[^']*')|(\$\{?[\w@*#?-]+\}?)|(\s--?[a-zA-Z0-9-]+)|(\b[a-zA-Z_][\w-]*\b)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out += escapeHtml(src.slice(last, m.index));
      if (m[1]) out += wrapToken('com', m[1]);
      else if (m[2]) out += wrapToken('str', m[2]);
      else if (m[3]) out += wrapToken('type', m[3]);
      else if (m[4]) out += wrapToken('attr', m[4]);
      else if (m[5]) {
        out += KEYWORDS_BY_LANG.bash.has(m[5]) ? wrapToken('kw', m[5]) : escapeHtml(m[5]);
      }
      last = re.lastIndex;
    }
    if (last < src.length) out += escapeHtml(src.slice(last));
    return out;
  }

  function tokenizePython(src) {
    const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|f?"(?:\\.|[^"\\])*"|f?'(?:\\.|[^'\\])*')|(@[a-zA-Z_][\w.]*)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)(?=\s*\()|(\b[A-Za-z_]\w*\b)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out += escapeHtml(src.slice(last, m.index));
      if (m[1]) out += wrapToken('com', m[1]);
      else if (m[2]) out += wrapToken('str', m[2]);
      else if (m[3]) out += wrapToken('attr', m[3]);
      else if (m[4]) out += wrapToken('num', m[4]);
      else if (m[5]) {
        out += KEYWORDS_BY_LANG.py.has(m[5]) ? wrapToken('kw', m[5]) : wrapToken('fn', m[5]);
      } else if (m[6]) {
        if (KEYWORDS_BY_LANG.py.has(m[6])) out += wrapToken('kw', m[6]);
        else if (/^[A-Z][A-Za-z0-9_]*$/.test(m[6])) out += wrapToken('type', m[6]);
        else out += escapeHtml(m[6]);
      }
      last = re.lastIndex;
    }
    if (last < src.length) out += escapeHtml(src.slice(last));
    return out;
  }

  function tokenizeYaml(src) {
    const re = /(#[^\n]*)|^(\s*[\w.-]+)(:)|("(?:\\.|[^"\\])*"|'[^']*')|(\b(?:true|false|null|yes|no)\b)|(\b\d+(?:\.\d+)?\b)/gm;
    let out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out += escapeHtml(src.slice(last, m.index));
      if (m[1]) out += wrapToken('com', m[1]);
      else if (m[2]) out += wrapToken('attr', m[2]) + escapeHtml(m[3]);
      else if (m[4]) out += wrapToken('str', m[4]);
      else if (m[5]) out += wrapToken('kw', m[5]);
      else if (m[6]) out += wrapToken('num', m[6]);
      last = re.lastIndex;
    }
    if (last < src.length) out += escapeHtml(src.slice(last));
    return out;
  }

  function tokenizeCFamily(src, lang) {
    const kwSet = (lang === 'javascript' || lang === 'typescript') ? KEYWORDS_BY_LANG.js : KEYWORDS_BY_LANG.c;
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)(?=\s*\()|(\b[A-Za-z_$][\w$]*\b)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out += escapeHtml(src.slice(last, m.index));
      if (m[1]) out += wrapToken('com', m[1]);
      else if (m[2]) out += wrapToken('str', m[2]);
      else if (m[3]) out += wrapToken('num', m[3]);
      else if (m[4]) {
        out += kwSet.has(m[4]) ? wrapToken('kw', m[4]) : wrapToken('fn', m[4]);
      } else if (m[5]) {
        if (kwSet.has(m[5])) out += wrapToken('kw', m[5]);
        else if (/^[A-Z][A-Za-z0-9_]*$/.test(m[5]) && m[5].length > 1) out += wrapToken('type', m[5]);
        else out += escapeHtml(m[5]);
      }
      last = re.lastIndex;
    }
    if (last < src.length) out += escapeHtml(src.slice(last));
    return out;
  }

  /**
   * Split highlighted HTML cleanly by newline while balancing open <span> tags across multiline tokens (e.g., /* comments *\/)
   */
  function splitHighlightedLines(highlightedHtml) {
    const rawLines = highlightedHtml.split('\n');
    const result = [];
    let openSpanClass = null;

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];
      if (openSpanClass) {
        line = `<span class="${openSpanClass}">` + line;
      }

      // Track open/close spans on this line
      const tagRe = /<span class="([^"]+)">|<\/span>/g;
      let m;
      let depth = openSpanClass ? 1 : 0;
      let currentCls = openSpanClass;
      while ((m = tagRe.exec(rawLines[i])) !== null) {
        if (m[1]) {
          depth++;
          currentCls = m[1];
        } else {
          depth = Math.max(0, depth - 1);
          if (depth === 0) currentCls = null;
        }
      }

      if (depth > 0 && currentCls) {
        line += '</span>';
        openSpanClass = currentCls;
      } else {
        openSpanClass = null;
      }
      result.push(line || ' ');
    }
    return result;
  }

  /* =========================================================
     IDE CODE CARD COMPONENT
     ========================================================= */
  function renderCodeCard(block, options) {
    const opts = Object.assign({
      showLineNumbers: true,
      wrapLines: false,
      collapsed: false,
      showJump: false,
      inFocusModal: false
    }, options || {});

    const meta = getLanguageMeta(block.lang);
    const highlighted = highlightLineOrCode(block.code, block.lang);
    const linesHtml = splitHighlightedLines(highlighted);

    const cardClasses = [
      'code-card',
      opts.collapsed ? 'collapsed' : '',
      opts.wrapLines ? 'wrap-lines' : '',
      !opts.showLineNumbers ? 'hide-line-nums' : ''
    ].filter(Boolean).join(' ');

    const rowsHtml = linesHtml.map((lineHtml, idx) => {
      const ln = idx + 1;
      return `<tr class="code-line-row" data-line="${ln}"><td class="code-ln-cell" data-action="highlight-line" data-line="${ln}" title="Klik untuk sorot baris ${ln}">${ln}</td><td class="code-src-cell">${lineHtml}</td></tr>`;
    }).join('');

    const filenameBadge = block.filename
      ? `<span class="code-filename" title="File terdeteksi">${escapeHtml(block.filename)}</span>`
      : '';

    const autoCloseBadge = block.autoClosed
      ? `<span class="code-meta-badge auto-closed" title="Fence ditutup otomatis karena terpotong">Auto-Closed</span>`
      : '';

    const previewBtn = meta.previewable && !opts.inFocusModal
      ? `<button type="button" class="btn btn-xs btn-accent-soft" data-action="live-code" data-code-idx="${block.index}" title="Jalankan Live Preview di Sandbox">Live Preview</button>`
      : '';

    const focusBtn = !opts.inFocusModal
      ? `<button type="button" class="btn btn-xs" data-action="focus-code" data-code-idx="${block.index}" title="Buka di Code Focus Fullscreen">Focus</button>`
      : '';

    const jumpBtn = opts.showJump
      ? `<button type="button" class="btn btn-xs" data-action="jump-code" data-code-idx="${block.index}" title="Lompat ke posisi di Preview">Jump</button>`
      : '';

    const headerHtml = opts.inFocusModal ? '' : `
      <div class="code-card-header">
        <div class="code-card-left">
          <button type="button" class="code-collapse-btn" data-action="toggle-collapse" data-code-idx="${block.index}" title="Expand / Collapse">&#9662;</button>
          <span class="lang-dot" style="background:${meta.color}"></span>
          <span class="code-lang">${escapeHtml(meta.label)}</span>
          ${filenameBadge}
          <span class="code-meta-badge">${block.lines} baris &middot; ${formatBytes(block.bytes)}</span>
          ${autoCloseBadge}
        </div>
        <div class="code-card-actions">
          ${previewBtn}
          ${jumpBtn}
          <button type="button" class="btn btn-xs ${opts.wrapLines ? 'active-toggle' : ''}" data-action="toggle-wrap" title="Wrap baris panjang">Wrap</button>
          ${focusBtn}
          <button type="button" class="btn btn-xs" data-action="download-code" data-code-idx="${block.index}" title="Unduh sebagai .${meta.ext}">.${meta.ext}</button>
          <button type="button" class="btn btn-xs btn-primary" data-action="copy-code" data-code-idx="${block.index}">Copy</button>
        </div>
      </div>`;

    return `
      <div class="${cardClasses}" data-code-card="${block.index}" id="code-block-${block.index}">
        ${headerHtml}
        <div class="code-body">
          <table class="code-lines-table"><tbody>${rowsHtml}</tbody></table>
        </div>
      </div>`;
  }

  /* =========================================================
     OFFLINE LATEX MATH RENDERER
     ========================================================= */
  const GREEK_AND_SYMBOLS = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε', '\\varepsilon': 'ε',
    '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ',
    '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ', '\\sigma': 'σ',
    '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ', '\\varphi': 'φ', '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ', '\\Xi': 'Ξ', '\\Pi': 'Π',
    '\\Sigma': 'Σ', '\\Phi': 'Φ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
    '\\pm': '±', '\\mp': '∓', '\\times': '×', '\\div': '÷', '\\cdot': '·', '\\ast': '∗',
    '\\leq': '≤', '\\le': '≤', '\\geq': '≥', '\\ge': '≥', '\\neq': '≠', '\\ne': '≠',
    '\\approx': '≈', '\\equiv': '≡', '\\sim': '∼', '\\propto': '∝', '\\infty': '∞',
    '\\to': '→', '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
    '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
    '\\sum': '∑', '\\prod': '∏', '\\int': '∫', '\\oint': '∮', '\\partial': '∂', '\\nabla': '∇',
    '\\forall': '∀', '\\exists': '∃', '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\subseteq': '⊆',
    '\\cup': '∪', '\\cap': '∩', '\\emptyset': '∅', '\\degree': '°', '\\dots': '…', '\\ldots': '…', '\\cdots': '⋯'
  };

  function renderMath(tex, isBlock) {
    let s = escapeHtml((tex || '').trim());

    // Handle \text{...}, \mathrm{...}, \mathbf{...}
    s = s.replace(/\\text\{([^{}]+)\}/g, '<span style="font-family:var(--font-sans)">$1</span>');
    s = s.replace(/\\mathbf\{([^{}]+)\}/g, '<strong>$1</strong>');

    // Handle \frac{a}{b} (iteratively up to 3 nesting depths)
    for (let pass = 0; pass < 3; pass++) {
      s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
        '<span class="math-frac"><span class="math-frac-num">$1</span><span class="math-frac-den">$2</span></span>'
      );
    }

    // Handle \sqrt{x}
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<span class="math-sqrt">&radic;<span class="math-sqrt-rad">$1</span></span>');

    // Replace Greek letters & operators
    s = s.replace(/\\[a-zA-Z]+/g, m => GREEK_AND_SYMBOLS[m] || m);

    // Superscripts & subscripts
    s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    s = s.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');
    s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    s = s.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');

    // Cleanup leftover layout commands
    s = s.replace(/\\left|\\right|\\,|\\;|\\!/g, ' ');

    return isBlock
      ? `<div class="math-block">${s}</div>`
      : `<span class="math-inline">${s}</span>`;
  }

  /* =========================================================
     SAFE INLINE MARKDOWN PARSER
     ========================================================= */
  function renderInline(rawText, options) {
    const opts = options || {};
    const stashed = [];
    const stash = (html) => {
      const k = `\u0000STASH${stashed.length}\u0000`;
      stashed.push(html);
      return k;
    };

    let s = rawText || '';

    // 1. Stash inline code spans (multi-backtick safe) BEFORE HTML escaping
    s = s.replace(/(`+)([^\n`]+?)\1/g, (_, ticks, code) => {
      return stash(`<code class="inline-code">${escapeHtml(code)}</code>`);
    });

    // 2. Stash inline LaTeX math $...$
    s = s.replace(/(?<!\$)\$(?!\s)([^\n$]+?)(?<!\s)\$(?!\d)/g, (_, tex) => {
      return stash(renderMath(tex, false));
    });

    // 3. Escape all HTML safely
    s = escapeHtml(s);

    // 4. Images ![alt](url)
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, alt, url) => {
      return stash(`<img src="${escapeHtml(sanitizeUrl(url))}" alt="${alt}" loading="lazy">`);
    });

    // 5. Links [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (_, label, url) => {
      const safe = sanitizeUrl(url);
      const extAttr = safe.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : '';
      return stash(`<a href="${escapeHtml(safe)}"${extAttr}>${label}</a>`);
    });

    // 6. Bare URLs
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, pre, url) => {
      return pre + stash(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    });

    // 7. Bold + Italic ***text***
    s = s.replace(/\*\*\*([^*\n]+?)\*\*\*/g, '<strong><em>$1</em></strong>');

    // 8. Bold **text** and __text__ (safe with quotes & punctuation)
    s = s.replace(/\*\*([^\n]+?)\*\*/g, (m, inner) => {
      if (!inner.trim()) return m;
      return `<strong>${inner}</strong>`;
    });
    s = s.replace(/(^|[^\w])__([^\n_]+?)__(?=[^\w]|$)/g, '$1<strong>$2</strong>');

    // 9. Italic *text* and boundary-safe _text_ (never corrupts snake_case_identifiers!)
    s = s.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, (m, inner) => {
      if (!inner.trim()) return m;
      return `<em>${inner}</em>`;
    });
    s = s.replace(/(^|[^\w])_([^_\n]+?)_(?=[^\w]|$)/g, '$1<em>$2</em>');

    // 10. Strikethrough ~~text~~ & Highlight ==text==
    s = s.replace(/~~([^~\n]+?)~~/g, '<del>$1</del>');
    s = s.replace(/==([^=\n]+?)==/g, '<mark>$1</mark>');

    // 11. Optional Literary Dialogue Highlighting (strictly walks text OUTSIDE HTML tags!)
    if (opts.highlightDialogue) {
      s = highlightDialogueOutsideTags(s);
    }

    // 12. Restore stashed tokens
    for (let i = stashed.length - 1; i >= 0; i--) {
      s = s.split(`\u0000STASH${i}\u0000`).join(stashed[i]);
    }
    return s;
  }

  function highlightDialogueOutsideTags(html) {
    // Splits into HTML tags vs pure text nodes so HTML attributes are NEVER touched
    return html.split(/(<[^>]+>)/g).map(part => {
      if (part.startsWith('<')) return part;
      return part.replace(/(“[^”]+”|&quot;[^&]+?&quot;)/g, '<span class="dialogue-span">$1</span>');
    }).join('');
  }

  /* =========================================================
     BLOCK-LEVEL MARKDOWN RENDERER
     ========================================================= */
  function renderMarkdown(markdown, options) {
    const opts = Object.assign({
      mode: 'preview',
      showLineNumbers: true,
      wrapLines: false,
      collapsedSet: new Set(),
      sceneBreakStyle: '✦  ✦  ✦',
      highlightDialogue: false,
      codeBlocksMeta: []
    }, options || {});

    if (!markdown || !markdown.trim()) {
      return {
        html: `<div class="empty-state"><h3>Belum ada output</h3><p>Tempel hasil Google AI Studio, drag &amp; drop file, atau pilih <strong>Sample</strong> untuk langsung melihat keajaiban Auto-Heal.</p></div>`,
        headings: []
      };
    }

    // Step 1: Isolate fenced code blocks line-by-line (CommonMark nested fence safe)
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const tokens = [];
    const extractedBlocks = [];
    let inFence = null;
    let blockIdx = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!inFence) {
        const openMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
        if (openMatch && !(openMatch[2][0] === '`' && openMatch[3].includes('`'))) {
          inFence = {
            char: openMatch[2][0],
            len: openMatch[2].length,
            lang: (openMatch[3].trim().split(/\s+/)[0] || 'text').toLowerCase(),
            lines: []
          };
          continue;
        }
        tokens.push(line);
      } else {
        const closeRe = new RegExp(`^\\s*${inFence.char}{${inFence.len},}\\s*$`);
        if (closeRe.test(line)) {
          const metaFromParser = opts.codeBlocksMeta[blockIdx];
          const codeStr = inFence.lines.join('\n');
          const blockObj = metaFromParser || {
            index: blockIdx,
            lang: inFence.lang || 'text',
            filename: '',
            code: codeStr,
            lines: codeStr === '' ? 0 : inFence.lines.length,
            bytes: new Blob([codeStr]).size,
            autoClosed: false
          };
          extractedBlocks.push(blockObj);
          tokens.push(`@@RENDER_CODE_${blockIdx}@@`);
          blockIdx++;
          inFence = null;
        } else {
          inFence.lines.push(line);
        }
      }
    }
    if (inFence) {
      const metaFromParser = opts.codeBlocksMeta[blockIdx];
      const codeStr = inFence.lines.join('\n');
      extractedBlocks.push(metaFromParser || {
        index: blockIdx,
        lang: inFence.lang || 'text',
        filename: '',
        code: codeStr,
        lines: inFence.lines.length,
        bytes: new Blob([codeStr]).size,
        autoClosed: true
      });
      tokens.push(`@@RENDER_CODE_${blockIdx}@@`);
    }

    // Step 2: Block-level walk
    const htmlParts = [];
    const headings = [];
    const slugCounts = {};
    let idx = 0;

    while (idx < tokens.length) {
      const line = tokens[idx];
      const trimmed = line.trim();

      // Blank line
      if (!trimmed) {
        idx++;
        continue;
      }

      // Code Block placeholder
      const cbMatch = trimmed.match(/^@@RENDER_CODE_(\d+)@@$/);
      if (cbMatch) {
        const b = extractedBlocks[Number(cbMatch[1])];
        if (b) {
          htmlParts.push(renderCodeCard(b, {
            showLineNumbers: opts.showLineNumbers,
            wrapLines: opts.wrapLines,
            collapsed: opts.collapsedSet && opts.collapsedSet.has(b.index)
          }));
        }
        idx++;
        continue;
      }

      // Display Math Block $$...$$ (single-line or multi-line)
      if (trimmed.startsWith('$$')) {
        if (trimmed.length > 4 && trimmed.endsWith('$$')) {
          htmlParts.push(renderMath(trimmed.slice(2, -2), true));
          idx++;
          continue;
        }
        const mathLines = [trimmed.slice(2)];
        idx++;
        while (idx < tokens.length && !tokens[idx].trim().endsWith('$$')) {
          mathLines.push(tokens[idx]);
          idx++;
        }
        if (idx < tokens.length) {
          mathLines.push(tokens[idx].trim().slice(0, -2));
          idx++;
        }
        htmlParts.push(renderMath(mathLines.join('\n'), true));
        continue;
      }

      // Headings H1-H6
      const hMatch = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
      if (hMatch) {
        const level = hMatch[1].length;
        const rawText = hMatch[2];
        const plainTitle = rawText.replace(/[*_`~]/g, '').trim();
        const baseSlug = plainTitle.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F]+/g, '-').replace(/^-|-$/g, '') || 'section';
        slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
        const id = slugCounts[baseSlug] === 1 ? `h-${baseSlug}` : `h-${baseSlug}-${slugCounts[baseSlug]}`;
        if (level <= 4) headings.push({ level, text: plainTitle, id });
        htmlParts.push(`<h${level} id="${id}">${renderInline(rawText, opts)}</h${level}>`);
        idx++;
        continue;
      }

      // Scene Break / Horizontal Rule
      if (/^(\*{3,}|-{3,}|_{3,}|(\*\s+){2,}\*|✦\s*✦\s*✦)$/.test(trimmed)) {
        if (opts.mode === 'book') {
          htmlParts.push(`<div class="scene-break" aria-hidden="true">${escapeHtml(opts.sceneBreakStyle)}</div>`);
        } else {
          htmlParts.push('<hr>');
        }
        idx++;
        continue;
      }

      // Blockquote & GitHub/Obsidian Admonitions/Callouts (> [!NOTE], > [!TIP], etc.)
      if (/^>\s?/.test(trimmed)) {
        const bqLines = [];
        while (idx < tokens.length && /^>\s?/.test(tokens[idx].trim())) {
          bqLines.push(tokens[idx].trim().replace(/^>\s?/, ''));
          idx++;
        }
        const calloutMatch = bqLines[0].match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i);
        if (calloutMatch) {
          const cType = calloutMatch[1].toLowerCase();
          const cLabel = calloutMatch[2] || calloutMatch[1].toUpperCase();
          const bodyLines = bqLines.slice(1).join('\n');
          const innerHtml = bodyLines.trim()
            ? bodyLines.split(/\n\s*\n/).map(p => `<p>${renderInline(p.replace(/\n/g, '<br>'), opts)}</p>`).join('')
            : '';
          htmlParts.push(`<div class="callout callout-${cType}"><div class="callout-title">${escapeHtml(cLabel)}</div>${innerHtml}</div>`);
        } else {
          const innerHtml = bqLines.join('\n').split(/\n\s*\n/).map(p =>
            `<p>${p.split('\n').map(l => renderInline(l, opts)).join('<br>')}</p>`
          ).join('');
          htmlParts.push(`<blockquote>${innerHtml}</blockquote>`);
        }
        continue;
      }

      // GFM Pipe Table
      if (isTableStart(tokens, idx)) {
        const headerCells = splitPipeRow(tokens[idx]);
        const sepCells = splitPipeRow(tokens[idx + 1]);
        const alignments = sepCells.map(c => {
          const t = c.trim();
          if (t.startsWith(':') && t.endsWith(':')) return 'center';
          if (t.endsWith(':')) return 'right';
          return 'left';
        });
        idx += 2;
        const bodyRows = [];
        while (idx < tokens.length && tokens[idx].includes('|') && tokens[idx].trim() && !tokens[idx].trim().startsWith('@@RENDER_CODE_')) {
          bodyRows.push(splitPipeRow(tokens[idx]));
          idx++;
        }
        const thHtml = headerCells.map((cell, ci) =>
          `<th style="text-align:${alignments[ci] || 'left'}">${renderInline(cell.trim(), opts)}</th>`
        ).join('');
        const tbHtml = bodyRows.map(row => {
          const tds = headerCells.map((_, ci) =>
            `<td style="text-align:${alignments[ci] || 'left'}">${renderInline((row[ci] || '').trim(), opts)}</td>`
          ).join('');
          return `<tr>${tds}</tr>`;
        }).join('');
        htmlParts.push(`<div class="table-wrap"><table><thead><tr>${thHtml}</tr></thead><tbody>${tbHtml}</tbody></table></div>`);
        continue;
      }

      // Lists (Unordered, Ordered & Task Checkboxes)
      if (/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(line)) {
        const listRes = parseListBlock(tokens, idx, opts);
        htmlParts.push(listRes.html);
        idx = listRes.nextIdx;
        continue;
      }

      // Paragraph (stops cleanly at block triggers)
      const paraLines = [];
      while (
        idx < tokens.length &&
        tokens[idx].trim() !== '' &&
        !/^@@RENDER_CODE_\d+@@$/.test(tokens[idx].trim()) &&
        !/^#{1,6}\s+/.test(tokens[idx]) &&
        !/^>\s?/.test(tokens[idx].trim()) &&
        !/^\$\$/.test(tokens[idx].trim()) &&
        !/^(\*{3,}|-{3,}|_{3,}|(\*\s+){2,}\*)$/.test(tokens[idx].trim()) &&
        !/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(tokens[idx]) &&
        !isTableStart(tokens, idx)
      ) {
        paraLines.push(tokens[idx]);
        idx++;
      }
      if (paraLines.length) {
        const content = paraLines.map(l => renderInline(l, opts)).join('<br>');
        htmlParts.push(`<p>${content}</p>`);
      }
    }

    return {
      html: htmlParts.join('\n'),
      headings
    };
  }

  function isTableStart(lines, idx) {
    if (idx + 1 >= lines.length) return false;
    const row1 = lines[idx].trim();
    const row2 = lines[idx + 1].trim();
    if (!row1.includes('|') || !row2.includes('|')) return false;
    const sepCells = splitPipeRow(row2);
    return sepCells.length >= 2 && sepCells.every(c => /^:?-+:?$/.test(c.trim()));
  }

  function splitPipeRow(line) {
    let t = line.trim();
    if (t.startsWith('|')) t = t.slice(1);
    if (t.endsWith('|')) t = t.slice(0, -1);
    return t.split('|');
  }

  function parseListBlock(lines, startIdx, opts) {
    const isOrdered = /^\s*\d+\.\s+/.test(lines[startIdx]);
    const tag = isOrdered ? 'ol' : 'ul';
    const items = [];
    let i = startIdx;

    while (i < lines.length) {
      const l = lines[i];
      const match = isOrdered ? l.match(/^\s*\d+\.\s+(.*)$/) : l.match(/^\s*[-*+]\s+(.*)$/);
      if (!match) break;

      let content = match[1];
      const taskMatch = !isOrdered && content.match(/^\[( |x|X)\]\s+(.*)$/);
      if (taskMatch) {
        const checked = taskMatch[1].toLowerCase() === 'x' ? 'checked' : '';
        items.push(`<li class="task-item"><input type="checkbox" ${checked} disabled><span>${renderInline(taskMatch[2], opts)}</span></li>`);
      } else {
        items.push(`<li>${renderInline(content, opts)}</li>`);
      }
      i++;
    }

    return { html: `<${tag}>${items.join('')}</${tag}>`, nextIdx: i };
  }

  /* =========================================================
     DIFF RENDERER
     ========================================================= */
  function renderDiff(diffResult, onlyChanges) {
    if (!diffResult || !diffResult.lines.length) {
      return '<div class="empty-state"><p>Tidak ada teks untuk dibandingkan.</p></div>';
    }
    if (diffResult.added === 0 && diffResult.removed === 0) {
      return '<div class="empty-state"><h3>Teks Sudah Bersih!</h3><p>Tidak ada perbedaan antara teks Input dan hasil Output dengan aturan aktif saat ini.</p></div>';
    }

    const lines = diffResult.lines;
    const out = [];
    let skipped = 0;

    for (let i = 0; i < lines.length; i++) {
      const item = lines[i];
      if (onlyChanges && item.type === 'eq') {
        // Keep 1 line of surrounding context around changes
        const prevChanged = i > 0 && lines[i - 1].type !== 'eq';
        const nextChanged = i + 1 < lines.length && lines[i + 1].type !== 'eq';
        if (!prevChanged && !nextChanged) {
          skipped++;
          continue;
        }
      }

      if (skipped > 0) {
        out.push(`<div class="diff-sep">... ${skipped} baris sama disembunyikan ...</div>`);
        skipped = 0;
      }

      const cls = item.type === 'add' ? 'diff-add' : item.type === 'rem' ? 'diff-rem' : 'diff-eq';
      const sign = item.type === 'add' ? '+' : item.type === 'rem' ? '−' : ' ';
      const ln = item.newLine || item.oldLine || '';
      out.push(
        `<div class="diff-line ${cls}"><span class="diff-lnum">${ln}</span><span class="diff-sign">${sign}</span><span>${escapeHtml(item.text || ' ')}</span></div>`
      );
    }

    if (skipped > 0) {
      out.push(`<div class="diff-sep">... ${skipped} baris sama disembunyikan ...</div>`);
    }

    return out.join('');
  }

  /* =========================================================
     STANDALONE OFFLINE BOOK HTML EXPORTER / POPOUT BUILDER
     ========================================================= */
  function buildStandaloneHtml(title, fixedMarkdown, defaultTheme, codeBlocksMeta) {
    const rendered = renderMarkdown(fixedMarkdown, {
      mode: 'book',
      showLineNumbers: true,
      wrapLines: false,
      sceneBreakStyle: '✦  ✦  ✦',
      codeBlocksMeta: codeBlocksMeta || []
    });

    const safeTitle = escapeHtml(title || 'AI Studio Fixed Document');
    const tocHtml = rendered.headings.length
      ? `<nav class="toc"><strong>Daftar Isi</strong><ul>${rendered.headings.map(h => `<li class="l${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('')}</ul></nav>`
      : '';

    return `<!DOCTYPE html>
<html lang="id" data-theme="${escapeHtml(defaultTheme || 'sepia')}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle}</title>
<style>
  :root { --outer:#e4dac5; --page:#f7f1e3; --fg:#2c221a; --muted:#7a6652; --border:#d5c6a8; --accent:#9a5523; --code:#ede3cf; --syn-kw:#8a2be2; --syn-str:#166534; --syn-com:#78716c; --syn-num:#b45309; --syn-fn:#9a5523; --syn-type:#0f766e; --syn-tag:#9d174d; --syn-attr:#c2410c; }
  html[data-theme="light"] { --outer:#eef2f8; --page:#ffffff; --fg:#0f172a; --muted:#64748b; --border:#d5dfec; --accent:#2563eb; --code:#f5f8fc; --syn-kw:#9333ea; --syn-str:#059669; --syn-com:#64748b; --syn-num:#d97706; --syn-fn:#2563eb; --syn-type:#0284c7; --syn-tag:#db2777; --syn-attr:#ea580c; }
  html[data-theme="dark"] { --outer:#090d16; --page:#121826; --fg:#e6edf7; --muted:#8b9bb4; --border:#263147; --accent:#60a5fa; --code:#0a0f1a; --syn-kw:#c084fc; --syn-str:#34d399; --syn-com:#64748b; --syn-num:#fbbf24; --syn-fn:#60a5fa; --syn-type:#38bdf8; --syn-tag:#f472b6; --syn-attr:#fb923c; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--outer); color: var(--fg); font-family: Georgia, "Palatino Linotype", serif; line-height: 1.85; padding: 20px 14px 64px; }
  .bar { max-width: 780px; margin: 0 auto 14px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; font-family: system-ui, sans-serif; font-size: 13px; }
  .bar button { background: var(--page); color: var(--fg); border: 1px solid var(--border); padding: 6px 12px; border-radius: 7px; cursor: pointer; font-weight: 600; }
  .page { max-width: 780px; margin: 0 auto; background: var(--page); border: 1px solid var(--border); border-radius: 10px; padding: 38px 36px 52px; box-shadow: 0 12px 32px rgba(0,0,0,.12); font-size: 18px; }
  .toc { font-family: system-ui, sans-serif; font-size: 13.5px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 24px; }
  .toc ul { list-style: none; padding: 0; margin: 8px 0 0; }
  .toc li { margin: 4px 0; }
  .toc li.l2 { padding-left: 14px; }
  .toc li.l3 { padding-left: 28px; }
  .toc a { color: var(--accent); text-decoration: none; }
  h1,h2,h3 { line-height: 1.3; margin: 1.4em 0 0.55em; }
  h1 { border-bottom: 1px solid var(--border); padding-bottom: 0.3em; text-align: center; }
  p { margin: 0 0 1.1em; }
  blockquote, .callout { border-left: 4px solid var(--accent); padding: 10px 15px; margin: 1em 0; background: rgba(128,128,128,0.07); border-radius: 0 8px 8px 0; }
  .scene-break { text-align: center; margin: 2em 0; color: var(--muted); letter-spacing: 0.25em; }
  code.inline-code { font-family: ui-monospace, monospace; font-size: 0.85em; background: var(--code); padding: 2px 6px; border-radius: 5px; border: 1px solid var(--border); }
  .code-card { border: 1px solid var(--border); border-radius: 9px; overflow: hidden; margin: 1.1em 0; background: var(--code); font-family: ui-monospace, monospace; font-size: 13.5px; line-height: 1.55; }
  .code-card-header { padding: 7px 12px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-family: system-ui, sans-serif; font-size: 12px; }
  .code-card-actions, .code-collapse-btn { display: none; }
  .code-body { overflow-x: auto; }
  .code-lines-table { width: 100%; border-collapse: collapse; }
  .code-ln-cell { padding: 0 10px; color: var(--muted); border-right: 1px solid var(--border); user-select: none; text-align: right; width: 1%; }
  .code-src-cell { padding: 0 12px; white-space: pre; }
  .table-wrap { overflow-x: auto; margin: 1em 0; }
  table:not(.code-lines-table) { width: 100%; border-collapse: collapse; font-size: 0.9em; }
  table:not(.code-lines-table) th, table:not(.code-lines-table) td { border: 1px solid var(--border); padding: 8px 11px; }
  .math-block { text-align: center; padding: 12px; border: 1px solid var(--border); border-radius: 8px; margin: 1em 0; }
  .math-frac { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; font-size: 0.85em; }
  .math-frac-num { border-bottom: 1px solid currentColor; padding: 0 3px; }
  .syn-kw{color:var(--syn-kw);font-weight:600}.syn-str{color:var(--syn-str)}.syn-com{color:var(--syn-com);font-style:italic}.syn-num{color:var(--syn-num)}.syn-fn{color:var(--syn-fn)}.syn-type{color:var(--syn-type)}.syn-tag{color:var(--syn-tag)}.syn-attr{color:var(--syn-attr)}
  @media (max-width:640px){ .page { padding: 22px 16px 36px; font-size: 16.5px; } }
  @media print { .bar { display: none; } body { background: #fff; padding: 0; } .page { border: none; box-shadow: none; max-width: 100%; } }
</style>
</head>
<body>
  <div class="bar">
    <strong>${safeTitle}</strong>
    <div>
      <button onclick="document.documentElement.setAttribute('data-theme','sepia')">Sepia</button>
      <button onclick="document.documentElement.setAttribute('data-theme','light')">Light</button>
      <button onclick="document.documentElement.setAttribute('data-theme','dark')">Dark</button>
      <button onclick="window.print()">Print / PDF</button>
    </div>
  </div>
  <main class="page">
    ${tocHtml}
    ${rendered.html}
  </main>
</body>
</html>`;
  }

  global.OutputRenderer = {
    getLanguageMeta,
    escapeHtml,
    highlightCode: highlightLineOrCode,
    renderCodeCard,
    renderMath,
    renderMarkdown,
    renderDiff,
    buildStandaloneHtml
  };
})(window);