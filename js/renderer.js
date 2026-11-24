(function (global) {
  'use strict';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Language color badges for Code Cards
  const LANG_COLORS = {
    javascript: '#f7df1e', js: '#f7df1e', jsx: '#61dafb',
    typescript: '#3178c6', ts: '#3178c6', tsx: '#3178c6',
    python: '#3776ab', py: '#3776ab',
    html: '#e34f26', xml: '#e34f26', svg: '#ffb13b',
    css: '#264de4', scss: '#cc6699',
    json: '#29b6f6', yaml: '#cb171e', yml: '#cb171e',
    sql: '#e38c00', bash: '#4eaa25', sh: '#4eaa25', shell: '#4eaa25',
    java: '#f89820', cpp: '#00599c', c: '#555555',
    go: '#00add8', rust: '#dea584', rs: '#dea584', php: '#777bb4',
    markdown: '#083fa1', md: '#083fa1'
  };

  // Single-pass language-aware syntax highlighter (never corrupts HTML entities or CSS hex colors)
  function highlightCode(code, lang) {
    const l = (lang || '').toLowerCase();
    if (!l || l === 'text' || l === 'txt' || l === 'plain' || l === 'code') {
      return escapeHtml(code);
    }

    const isHashComment = ['python', 'py', 'bash', 'sh', 'shell', 'yaml', 'yml', 'ruby', 'rb', 'perl', 'r', 'toml', 'dockerfile'].includes(l);
    const isSql = l === 'sql';
    const isMarkup = ['html', 'xml', 'svg'].includes(l);
    const isJson = l === 'json';

    if (isJson) {
      const re = /("(?:\\.|[^"\\])*")(\s*:)?|(\b(?:true|false|null)\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g;
      let out = '';
      let last = 0;
      let m;
      while ((m = re.exec(code)) !== null) {
        if (m.index > last) out += escapeHtml(code.slice(last, m.index));
        if (m[1]) {
          if (m[2]) {
            out += `<span class="syn-fn">${escapeHtml(m[1])}</span>${escapeHtml(m[2])}`;
          } else {
            out += `<span class="syn-str">${escapeHtml(m[1])}</span>`;
          }
        } else if (m[3]) {
          out += `<span class="syn-kw">${escapeHtml(m[3])}</span>`;
        } else if (m[4]) {
          out += `<span class="syn-num">${escapeHtml(m[4])}</span>`;
        }
        last = re.lastIndex;
      }
      if (last < code.length) out += escapeHtml(code.slice(last));
      return out;
    }

    if (isMarkup) {
      const re = /(<!--[\s\S]*?-->)|(<\/?[a-zA-Z][a-zA-Z0-9:-]*)|(\/?>)|(\s[a-zA-Z_:][\w:.-]*)(=)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
      let out = '';
      let last = 0;
      let m;
      while ((m = re.exec(code)) !== null) {
        if (m.index > last) out += escapeHtml(code.slice(last, m.index));
        if (m[1]) out += `<span class="syn-com">${escapeHtml(m[1])}</span>`;
        else if (m[2]) out += `<span class="syn-kw">${escapeHtml(m[2])}</span>`;
        else if (m[3]) out += `<span class="syn-kw">${escapeHtml(m[3])}</span>`;
        else if (m[4]) out += `<span class="syn-fn">${escapeHtml(m[4])}</span>${escapeHtml(m[5])}`;
        else if (m[6]) out += `<span class="syn-str">${escapeHtml(m[6])}</span>`;
        last = re.lastIndex;
      }
      if (last < code.length) out += escapeHtml(code.slice(last));
      return out;
    }

    const commentPart = isHashComment
      ? '#[^\\n]*'
      : isSql
        ? '--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/'
        : '\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*';

    const kwList = isSql
      ? 'SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|LIMIT|CREATE|TABLE|ALTER|DROP|INDEX|AS|AND|OR|NOT|NULL|IN|IS|DISTINCT|HAVING|UNION|CASE|WHEN|THEN|ELSE|END'
      : 'const|let|var|function|async|await|return|if|else|elif|for|while|do|switch|case|break|continue|import|from|export|default|class|extends|implements|interface|type|new|try|catch|finally|throw|def|pass|lambda|with|as|yield|None|True|False|null|undefined|true|false|public|private|protected|static|void|int|float|double|string|bool|boolean|struct|enum|fn|mut|pub|use|mod|impl|trait|match|package|func|defer|go|chan|typeof|instanceof|in|of|this|super|self';

    const tokenRe = new RegExp(
      `(${commentPart})|` +
      `(\`(?:\\\\.|[^\`\\\\])*\`|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*')|` +
      `(@[a-zA-Z_][\\w-]*)|` +
      `\\b(${kwList})\\b|` +
      `\\b(\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b|` +
      `\\b([a-zA-Z_]\\w*)(?=\\s*\\()`,
      isSql ? 'gi' : 'g'
    );

    let out = '';
    let last = 0;
    let m;
    while ((m = tokenRe.exec(code)) !== null) {
      if (m.index > last) out += escapeHtml(code.slice(last, m.index));
      if (m[1]) out += `<span class="syn-com">${escapeHtml(m[1])}</span>`;
      else if (m[2]) out += `<span class="syn-str">${escapeHtml(m[2])}</span>`;
      else if (m[3]) out += `<span class="syn-fn">${escapeHtml(m[3])}</span>`;
      else if (m[4]) out += `<span class="syn-kw">${escapeHtml(m[4])}</span>`;
      else if (m[5]) out += `<span class="syn-num">${escapeHtml(m[5])}</span>`;
      else if (m[6]) out += `<span class="syn-fn">${escapeHtml(m[6])}</span>`;
      last = tokenRe.lastIndex;
    }
    if (last < code.length) out += escapeHtml(code.slice(last));
    return out;
  }

  function formatLatexReadable(expr) {
    let s = escapeHtml(expr.trim());
    s = s.replace(/\\left\b|\\right\b/g, '');
    s = s.replace(/\\text\{([^{}]+)\}/g, '<span class="math-text">$1</span>');
    s = s.replace(/\\quad\b|\\qquad\b/g, '&nbsp;&nbsp;');

    const symbols = {
      '\\\\alpha': 'α', '\\\\beta': 'β', '\\\\gamma': 'γ', '\\\\delta': 'δ',
      '\\\\epsilon': 'ε', '\\\\varepsilon': 'ε', '\\\\theta': 'θ', '\\\\lambda': 'λ',
      '\\\\mu': 'μ', '\\\\nu': 'ν', '\\\\pi': 'π', '\\\\rho': 'ρ',
      '\\\\sigma': 'σ', '\\\\tau': 'τ', '\\\\phi': 'φ', '\\\\varphi': 'φ',
      '\\\\psi': 'ψ', '\\\\omega': 'ω',
      '\\\\Gamma': 'Γ', '\\\\Delta': 'Δ', '\\\\Theta': 'Θ', '\\\\Lambda': 'Λ',
      '\\\\Pi': 'Π', '\\\\Sigma': '∑', '\\\\Phi': 'Φ', '\\\\Psi': 'Ψ', '\\\\Omega': 'Ω',
      '\\\\sum': '∑', '\\\\prod': '∏', '\\\\int': '∫', '\\\\oint': '∮', '\\\\infty': '∞',
      '\\\\partial': '∂', '\\\\nabla': '∇', '\\\\forall': '∀', '\\\\exists': '∃',
      '\\\\in': '∈', '\\\\notin': '∉', '\\\\subset': '⊂', '\\\\subseteq': '⊆',
      '\\\\cup': '∪', '\\\\cap': '∩', '\\\\emptyset': '∅',
      '\\\\times': '×', '\\\\cdot': '·', '\\\\div': '÷', '\\\\pm': '±', '\\\\mp': '∓',
      '\\\\leq': '≤', '\\\\le': '≤', '\\\\geq': '≥', '\\\\ge': '≥',
      '\\\\neq': '≠', '\\\\ne': '≠', '\\\\approx': '≈', '\\\\equiv': '≡', '\\\\propto': '∝',
      '\\\\Rightarrow': '⇒', '\\\\Leftarrow': '⇐', '\\\\Leftrightarrow': '⇔',
      '\\\\rightarrow': '→', '\\\\to': '→', '\\\\leftarrow': '←', '\\\\leftrightarrow': '↔',
      '\\\\%': '%'
    };
    for (const [k, v] of Object.entries(symbols)) {
      s = s.replace(new RegExp(k + '(?![a-zA-Z])', 'g'), v);
    }

    // Apply frac twice to handle 1-level nested fractions
    for (let pass = 0; pass < 2; pass++) {
      s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
        '<span class="math-frac"><span class="math-frac-num">$1</span><span class="math-frac-den">$2</span></span>'
      );
    }
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
    s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    s = s.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');
    s = s.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');
    return s;
  }

  function applyBionicToPlainSegment(escapedText) {
    // Only operate on text outside HTML tags and entities
    return escapedText.replace(/(&[a-zA-Z0-9#]+;)|([A-Za-zÀ-ÖØ-öø-ÿ]{2,})/g, (m, entity, word) => {
      if (entity) return entity;
      const splitAt = word.length <= 3 ? 1 : Math.ceil(word.length * 0.42);
      return `<b class="bionic-lead">${word.slice(0, splitAt)}</b>${word.slice(splitAt)}`;
    });
  }

  function applyBionicToHtml(html) {
    // Split by HTML tags so we never touch tags, attributes, or code/math spans
    const parts = html.split(/(<[^>]+>)/g);
    let skipDepth = 0;
    return parts.map(part => {
      if (part.startsWith('<')) {
        if (/^<(code|pre|span class="math-)/i.test(part)) skipDepth++;
        else if (/^<\/(code|pre|span)>/i.test(part) && skipDepth > 0) skipDepth--;
        return part;
      }
      if (skipDepth > 0) return part;
      return applyBionicToPlainSegment(part);
    }).join('');
  }

  function renderInlineMarkdown(text, opts) {
    const inlineTokens = [];
    const hold = (html) => {
      const id = `\u0001INL${inlineTokens.length}\u0001`;
      inlineTokens.push(html);
      return id;
    };

    let s = text;
    // Protect inline code & math first
    s = s.replace(/`([^`]+)`/g, (_, code) => hold(`<code class="inline-code">${escapeHtml(code)}</code>`));
    s = s.replace(/\\\((.+?)\\\)/g, (_, m) => hold(`<span class="math-inline">${formatLatexReadable(m)}</span>`));
    s = s.replace(/\$([^$\n]+?)\$/g, (_, m) => hold(`<span class="math-inline">${formatLatexReadable(m)}</span>`));

    // Protect images & links BEFORE bold/italic so underscores in URLs never turn into <em>!
    s = s.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (_, alt, url) =>
      hold(`<img class="md-img" src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy">`)
    );
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) =>
      hold(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`)
    );

    s = escapeHtml(s);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
    s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
    s = s.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
    s = s.replace(/(^|[^a-zA-Z0-9])_([^_\n]+?)_(?=[^a-zA-Z0-9]|$)/g, '$1<em>$2</em>');
    s = s.replace(/\u0001INL(\d+)\u0001/g, (_, idx) => inlineTokens[Number(idx)]);

    if (opts && opts.bionic) {
      s = applyBionicToHtml(s);
    }
    return s;
  }

  function formatBytes(chars) {
    if (chars < 1024) return `${chars} B`;
    return `${(chars / 1024).toFixed(1)} KB`;
  }

  function buildCodeCardHtml(rawCode, lang, idx, codeOpts, idPrefix) {
    const opts = codeOpts || {};
    const linesArr = rawCode === '' ? [''] : rawCode.split('\n');
    const lineCount = rawCode === '' ? 0 : linesArr.length;
    const encoded = encodeURIComponent(rawCode);
    const l = (lang || 'code').toLowerCase();
    const dotColor = LANG_COLORS[l] || '#94a3b8';

    const gutterLines = Array.from({ length: Math.max(1, lineCount) }, (_, n) =>
      `<span class="code-line-num" data-line="${n + 1}" title="Klik untuk sorot baris ${n + 1}">${n + 1}</span>`
    ).join('');

    const cardClasses = [
      'code-card',
      opts.collapsedDefault ? 'collapsed' : '',
      opts.wrapLines ? 'wrap-lines' : ''
    ].filter(Boolean).join(' ');

    const gutterClass = opts.showLineNumbers === false ? 'code-gutter hidden' : 'code-gutter';
    const cardId = `${idPrefix || 'code-block-'}${idx}`;
    const wrapActive = opts.wrapLines ? ' btn-primary' : '';
    const isPreviewable = l === 'html' || l === 'svg';
    const isJson = l === 'json';

    const extraBtns =
      (isPreviewable ? `<button class="btn btn-sm preview-code-btn" type="button" data-code="${encoded}" data-lang="${escapeHtml(l)}" title="Live Preview HTML/SVG">Preview</button>` : '') +
      (isJson ? `<button class="btn btn-sm format-json-btn" type="button" title="Format / Validasi JSON">Format JSON</button>` : '');

    return (
      `<div class="${cardClasses}" id="${cardId}" data-code-idx="${idx}" data-lang="${escapeHtml(l)}">` +
      `<div class="code-card-header">` +
      `<div class="code-card-left">` +
      `<button class="code-collapse-btn" type="button" title="Collapse / Expand kode" aria-expanded="${!opts.collapsedDefault}">&#9662;</button>` +
      `<span class="code-lang-dot" style="background:${dotColor}" aria-hidden="true"></span>` +
      `<span class="code-lang">${escapeHtml(lang)}</span>` +
      `<span class="code-meta-badge">${lineCount} baris &bull; ${formatBytes(rawCode.length)}</span>` +
      `</div>` +
      `<div class="code-card-actions">` +
      extraBtns +
      `<button class="btn btn-sm search-code-btn" type="button" title="Cari di dalam blok kode">Find</button>` +
      `<button class="btn btn-sm focus-code-btn" type="button" data-lang="${escapeHtml(lang)}" data-code="${encoded}" title="Buka layar penuh">Focus</button>` +
      `<button class="btn btn-sm wrap-code-btn${wrapActive}" type="button" title="Toggle Word Wrap">Wrap</button>` +
      `<button class="btn btn-sm save-code-btn" type="button" data-lang="${escapeHtml(lang)}" data-code="${encoded}" title="Unduh potongan kode">Save</button>` +
      `<button class="btn btn-sm copy-code-btn" type="button" data-code="${encoded}">Copy</button>` +
      `</div>` +
      `</div>` +
      `<div class="code-search-bar">` +
      `<input type="text" class="code-search-input" placeholder="Cari di blok kode ini..." aria-label="Cari di kode">` +
      `<span class="code-search-count">0 cocok</span>` +
      `</div>` +
      `<div class="code-body">` +
      `<div class="${gutterClass}">${gutterLines}</div>` +
      `<pre><code>${highlightCode(rawCode, lang)}</code></pre>` +
      `</div>` +
      `</div>`
    );
  }

  function renderListBlock(lines, startIdx, opts) {
    let i = startIdx;
    const items = [];
    const firstMatch = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    const isOrdered = /\d+\./.test(firstMatch[2]);

    while (i < lines.length) {
      const m = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
      if (!m) break;
      const curOrdered = /\d+\./.test(m[2]);
      const indent = m[1].replace(/\t/g, '  ').length;
      if (indent === 0 && curOrdered !== isOrdered) break;
      items.push({ indent, ordered: curOrdered, text: m[3] });
      i++;
    }

    const baseIndent = items[0].indent;
    const tag = isOrdered ? 'ol' : 'ul';
    const hasTasks = items.some(it => /^\[[ xX]\]\s+/.test(it.text));
    let html = `<${tag}${hasTasks ? ' class="task-list"' : ''}>`;

    for (const it of items) {
      const level = Math.min(3, Math.floor(Math.max(0, it.indent - baseIndent) / 2));
      const padClass = level > 0 ? ` class="list-nested-${level}"` : '';
      const taskMatch = it.text.match(/^\[([ xX])\]\s+(.*)$/);
      if (taskMatch) {
        const checked = taskMatch[1].toLowerCase() === 'x';
        const liCls = level > 0 ? `list-nested-${level} task-item` : "task-item";
        html += `<li class="${liCls}"><span class="task-box${checked ? ' checked' : ''}" aria-hidden="true">${checked ? '&#10003;' : ''}</span><span>${renderInlineMarkdown(taskMatch[2], opts)}</span></li>`;
      } else {
        html += `<li${padClass}>${renderInlineMarkdown(it.text, opts)}</li>`;
      }
    }
    html += `</${tag}>`;
    return { html, nextIdx: i };
  }

  function renderMarkdownToHtml(md, options) {
    const opts = options || {};
    if (!md || !md.trim()) {
      return '<div class="empty-state"><p>Hasil perbaikan akan muncul di sini secara real-time...</p><small>Paste output Google AI Studio, drag &amp; drop file .md/.txt, atau klik Sample untuk mencoba.</small></div>';
    }

    const { isTableLine, parseTableCells, isSeparatorRow, parseTableAlignments } = global.FixerParser;
    const lines = md.split('\n');
    const htmlParts = [];
    let i = 0;
    let headingIdx = 0;
    let codeIdx = 0;
    let paraIdx = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) { i++; continue; }

      // Fenced code blocks (respect fence char & length)
      const fence = trimmed.match(/^(`{3,}|~{3,})(.*)$/);
      if (fence) {
        const fChar = fence[1][0];
        const fLen = fence[1].length;
        const lang = (fence[2].trim().split(/\s+/)[0]) || 'code';
        const codeLines = [];
        i++;
        while (i < lines.length) {
          const closeMatch = lines[i].trim().match(/^(`{3,}|~{3,})\s*$/);
          if (closeMatch && closeMatch[1][0] === fChar && closeMatch[1].length >= fLen) {
            i++;
            break;
          }
          codeLines.push(lines[i]);
          i++;
        }
        const rawCode = codeLines.join('\n');
        htmlParts.push(buildCodeCardHtml(rawCode, lang, codeIdx++, opts.codeOpts, opts.codeIdPrefix));
        continue;
      }

      // Display Math
      if (trimmed.startsWith('\\[') || trimmed.startsWith('$$')) {
        const isBracket = trimmed.startsWith('\\[');
        const endMarker = isBracket ? '\\]' : '$$';
        let mathBuf = [trimmed.slice(2)];
        if (trimmed.endsWith(endMarker) && trimmed.length > 4) {
          mathBuf = [trimmed.slice(2, -2)];
          i++;
        } else {
          i++;
          while (i < lines.length) {
            const lt = lines[i].trim();
            if (lt.endsWith(endMarker)) {
              mathBuf.push(lt.slice(0, -2));
              i++;
              break;
            }
            mathBuf.push(lines[i]);
            i++;
          }
        }
        htmlParts.push(`<div class="math-block">${formatLatexReadable(mathBuf.join(' '))}</div>`);
        continue;
      }

      // Horizontal rule / Scene break
      if (/^([-*_]){3,}\s*$/.test(trimmed)) {
        htmlParts.push(opts.bookOrnament ? '<div class="scene-break" aria-hidden="true">&#10022; &nbsp; &#10022; &nbsp; &#10022;</div>' : '<hr>');
        i++;
        continue;
      }

      // Headings
      const head = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (head) {
        const lvl = head[1].length;
        const idAttr = lvl <= 3 ? ` id="${opts.idPrefix || 'toc-h-'}${headingIdx++}"` : '';
        htmlParts.push(`<h${lvl}${idAttr} data-tts-idx="${paraIdx++}">${renderInlineMarkdown(head[2], opts)}</h${lvl}>`);
        i++;
        continue;
      }

      // Blockquotes & GitHub-style Callouts (> [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT], > [!CAUTION])
      if (trimmed.startsWith('>')) {
        const quoteLines = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        const calloutMatch = quoteLines[0] && quoteLines[0].match(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
        if (calloutMatch) {
          const kind = calloutMatch[1].toLowerCase();
          const title = calloutMatch[1].toUpperCase();
          const restFirst = calloutMatch[2] ? [calloutMatch[2]] : [];
          const bodyLines = [...restFirst, ...quoteLines.slice(1)];
          htmlParts.push(
            `<div class="callout callout-${kind}">` +
            `<div class="callout-title">${title}</div>` +
            `<div class="callout-body">${bodyLines.map(l => renderInlineMarkdown(l, opts)).join('<br>')}</div>` +
            `</div>`
          );
        } else {
          htmlParts.push(`<blockquote data-tts-idx="${paraIdx++}">${quoteLines.map(l => renderInlineMarkdown(l, opts)).join('<br>')}</blockquote>`);
        }
        continue;
      }

      // Tables with column alignment
      if (isTableLine(line) && i + 1 < lines.length && isTableLine(lines[i + 1])) {
        const tableRows = [];
        while (i < lines.length && isTableLine(lines[i])) {
          tableRows.push(parseTableCells(lines[i]));
          i++;
        }
        const hasSep = tableRows.length > 1 && isSeparatorRow(tableRows[1]);
        const aligns = hasSep ? parseTableAlignments(tableRows[1]) : [];
        let tbl = '<div class="table-wrap"><table><thead><tr>';
        tableRows[0].forEach((c, ci) => {
          const al = aligns[ci] ? ` style="text-align:${aligns[ci]}"` : '';
          tbl += `<th${al}>${renderInlineMarkdown(c, opts)}</th>`;
        });
        tbl += '</tr></thead><tbody>';
        const startRow = hasSep ? 2 : 1;
        for (let r = startRow; r < tableRows.length; r++) {
          tbl += '<tr>';
          tableRows[r].forEach((c, ci) => {
            const al = aligns[ci] ? ` style="text-align:${aligns[ci]}"` : '';
            tbl += `<td${al}>${renderInlineMarkdown(c, opts)}</td>`;
          });
          tbl += '</tr>';
        }
        tbl += '</tbody></table></div>';
        htmlParts.push(tbl);
        continue;
      }

      // Unordered & Ordered Lists (with nested indent & task boxes)
      if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
        const res = renderListBlock(lines, i, opts);
        htmlParts.push(res.html);
        i = res.nextIdx;
        continue;
      }

      // Paragraph
      const para = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^(`{3,}|~{3,}|#{1,6}\s|>|\s*[-*+]\s+|\s*\d+\.\s+|\\\[|\$\$|([-*_]){3,}\s*$)/.test(lines[i].trim()) &&
        !isTableLine(lines[i])
      ) {
        para.push(lines[i]);
        i++;
      }
      htmlParts.push(`<p data-tts-idx="${paraIdx++}">${para.map(l => renderInlineMarkdown(l, opts)).join('<br>')}</p>`);
    }

    return htmlParts.join('\n');
  }

  function renderDiffHtml(diffList, changesOnly) {
    if (!diffList.length) {
      return '<div class="empty-state"><p>Belum ada teks untuk dibandingkan.</p></div>';
    }
    const adds = diffList.filter(d => d.type === 'add').length;
    const rems = diffList.filter(d => d.type === 'rem').length;
    const filtered = changesOnly ? diffList.filter(d => d.type !== 'eq') : diffList;

    const summaryHtml =
      `<div class="diff-summary">` +
      `<span class="diff-stat-add">+${adds} ditambah</span>` +
      `<span class="diff-stat-rem">-${rems} dihapus</span>` +
      `<span class="diff-stat-eq">${diffList.length - adds - rems} tidak berubah</span>` +
      `</div>`;

    if (changesOnly && filtered.length === 0) {
      return summaryHtml + '<div class="empty-state"><p>Tidak ada perubahan antara input dan output.</p></div>';
    }

    const linesHtml = filtered.map(d => {
      const sign = d.type === 'add' ? '+' : d.type === 'rem' ? '-' : ' ';
      const ln = d.type === 'rem' ? (d.oldLine || '') : (d.newLine || '');
      return `<div class="diff-line diff-${d.type}"><span class="diff-ln">${ln}</span><span class="diff-sign">${sign}</span><span class="diff-text">${escapeHtml(d.text || ' ')}</span></div>`;
    }).join('');

    return summaryHtml + linesHtml;
  }

  global.FixerRenderer = {
    escapeHtml,
    highlightCode,
    buildCodeCardHtml,
    renderMarkdownToHtml,
    renderDiffHtml,
    LANG_COLORS
  };
})(window);
