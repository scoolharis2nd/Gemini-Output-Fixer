(function (global) {
  'use strict';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function highlightCode(code, lang) {
    let html = escapeHtml(code);
    const l = (lang || '').toLowerCase();
    if (!l || l === 'text' || l === 'txt' || l === 'plain') return html;

    const tokens = [];
    const saveToken = (cls, text) => {
      const id = `\u0000TOK${tokens.length}\u0000`;
      tokens.push(`<span class="${cls}">${text}</span>`);
      return id;
    };

    html = html.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|'.*?'|`[^`]*`)/g, m => saveToken('syn-str', m));
    html = html.replace(/(\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*)/g, m => saveToken('syn-com', m));
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="syn-num">$1</span>');
    html = html.replace(
      /\b(const|let|var|function|async|await|return|if|else|for|while|switch|case|break|continue|import|from|export|default|class|extends|new|try|catch|finally|throw|def|elif|pass|None|True|False|SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|JOIN|ON|GROUP|BY|ORDER|LIMIT|CREATE|TABLE|null|undefined|true|false|public|private|static|void|int|string|bool)\b/g,
      '<span class="syn-kw">$1</span>'
    );
    html = html.replace(/\b([a-zA-Z_]\w*)(?=\s*\()/g, '<span class="syn-fn">$1</span>');
    html = html.replace(/\u0000TOK(\d+)\u0000/g, (_, idx) => tokens[Number(idx)]);
    return html;
  }

  function formatLatexReadable(expr) {
    let s = escapeHtml(expr.trim());
    const greek = {
      '\\\\alpha': 'α', '\\\\beta': 'β', '\\\\gamma': 'γ', '\\\\delta': 'δ',
      '\\\\epsilon': 'ε', '\\\\theta': 'θ', '\\\\lambda': 'λ', '\\\\mu': 'μ',
      '\\\\pi': 'π', '\\\\sigma': 'σ', '\\\\phi': 'φ', '\\\\omega': 'ω',
      '\\\\Delta': 'Δ', '\\\\Sigma': '∑', '\\\\Omega': 'Ω',
      '\\\\sum': '∑', '\\\\prod': '∏', '\\\\int': '∫', '\\\\infty': '∞',
      '\\\\times': '×', '\\\\cdot': '·', '\\\\div': '÷', '\\\\pm': '±',
      '\\\\le': '≤', '\\\\ge': '≥', '\\\\ne': '≠', '\\\\approx': '≈',
      '\\\\rightarrow': '→', '\\\\to': '→', '\\\\leftarrow': '←', '\\\\%': '%'
    };
    for (const [k, v] of Object.entries(greek)) {
      s = s.replace(new RegExp(k + '\\b', 'g'), v);
    }
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g,
      '<span class="math-frac"><span class="math-frac-num">$1</span><span class="math-frac-den">$2</span></span>'
    );
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
    s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    s = s.replace(/\^([a-zA-Z0-9])/g, '<sup>$1</sup>');
    s = s.replace(/_([a-zA-Z0-9])/g, '<sub>$1</sub>');
    return s;
  }

  function renderInlineMarkdown(text) {
    const inlineTokens = [];
    const hold = (html) => {
      const id = `\u0001INL${inlineTokens.length}\u0001`;
      inlineTokens.push(html);
      return id;
    };

    let s = text;
    s = s.replace(/`([^`]+)`/g, (_, code) => hold(`<code class="inline-code">${escapeHtml(code)}</code>`));
    s = s.replace(/\\\((.+?)\\\)/g, (_, m) => hold(`<span class="math-inline">${formatLatexReadable(m)}</span>`));
    s = s.replace(/\$([^$\n]+?)\$/g, (_, m) => hold(`<span class="math-inline">${formatLatexReadable(m)}</span>`));

    s = escapeHtml(s);
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
    s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');
    s = s.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
    s = s.replace(/(^|[^a-zA-Z0-9])_([^_\n]+?)_(?=[^a-zA-Z0-9]|$)/g, '$1<em>$2</em>');
    s = s.replace(/\u0001INL(\d+)\u0001/g, (_, idx) => inlineTokens[Number(idx)]);
    return s;
  }

  function renderMarkdownToHtml(md) {
    if (!md.trim()) {
      return '<p style="color:var(--text-muted);">Hasil perbaikan akan muncul di sini secara real-time...</p>';
    }

    const { isTableLine, parseTableCells, isSeparatorRow } = global.FixerParser;
    const lines = md.split('\n');
    const htmlParts = [];
    let i = 0;
    let headingIdx = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) { i++; continue; }

      const fence = trimmed.match(/^(```+|~~~+)(.*)$/);
      if (fence) {
        const lang = fence[2].trim() || 'code';
        const codeLines = [];
        i++;
        while (i < lines.length && !/^(```+|~~~+)/.test(lines[i].trim())) {
          codeLines.push(lines[i]);
          i++;
        }
        i++;
        const rawCode = codeLines.join('\n');
        const encoded = encodeURIComponent(rawCode);
        htmlParts.push(
          `<div class="code-card">` +
          `<div class="code-card-header">` +
          `<span class="code-lang">${escapeHtml(lang)}</span>` +
          `<button class="btn btn-sm copy-code-btn" type="button" data-code="${encoded}">Copy Code</button>` +
          `</div>` +
          `<pre><code>${highlightCode(rawCode, lang)}</code></pre>` +
          `</div>`
        );
        continue;
      }

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

      if (/^([-*_]){3,}\s*$/.test(trimmed)) {
        htmlParts.push('<hr>');
        i++;
        continue;
      }

      const head = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (head) {
        const lvl = head[1].length;
        const idAttr = lvl <= 3 ? ` id="toc-h-${headingIdx++}"` : '';
        htmlParts.push(`<h${lvl}${idAttr}>${renderInlineMarkdown(head[2])}</h${lvl}>`);
        i++;
        continue;
      }

      if (trimmed.startsWith('>')) {
        const quoteLines = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        htmlParts.push(`<blockquote>${quoteLines.map(renderInlineMarkdown).join('<br>')}</blockquote>`);
        continue;
      }

      if (isTableLine(line) && i + 1 < lines.length && isTableLine(lines[i + 1])) {
        const tableRows = [];
        while (i < lines.length && isTableLine(lines[i])) {
          tableRows.push(parseTableCells(lines[i]));
          i++;
        }
        let tbl = '<table><thead><tr>';
        tableRows[0].forEach(c => { tbl += `<th>${renderInlineMarkdown(c)}</th>`; });
        tbl += '</tr></thead><tbody>';
        const startRow = isSeparatorRow(tableRows[1]) ? 2 : 1;
        for (let r = startRow; r < tableRows.length; r++) {
          tbl += '<tr>';
          tableRows[r].forEach(c => { tbl += `<td>${renderInlineMarkdown(c)}</td>`; });
          tbl += '</tr>';
        }
        tbl += '</tbody></table>';
        htmlParts.push(tbl);
        continue;
      }

      if (/^\s*[-*+]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
          i++;
        }
        htmlParts.push('<ul>' + items.map(it => `<li>${renderInlineMarkdown(it)}</li>`).join('') + '</ul>');
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        htmlParts.push('<ol>' + items.map(it => `<li>${renderInlineMarkdown(it)}</li>`).join('') + '</ol>');
        continue;
      }

      const para = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^(```+|~~~+|#{1,6}\s|>|\s*[-*+]\s+|\s*\d+\.\s+|\\\[|\$\$)/.test(lines[i].trim()) &&
        !isTableLine(lines[i])
      ) {
        para.push(lines[i]);
        i++;
      }
      htmlParts.push(`<p>${para.map(renderInlineMarkdown).join('<br>')}</p>`);
    }

    return htmlParts.join('\n');
  }

  function renderDiffHtml(diffList) {
    if (!diffList.length) {
      return '<div style="color:var(--text-muted);">Belum ada teks untuk dibandingkan.</div>';
    }
    return diffList.map(d => {
      const sign = d.type === 'add' ? '+' : d.type === 'rem' ? '-' : ' ';
      return `<div class="diff-line diff-${d.type}"><span class="diff-sign">${sign}</span><span>${escapeHtml(d.text || ' ')}</span></div>`;
    }).join('');
  }

  global.FixerRenderer = {
    escapeHtml,
    renderMarkdownToHtml,
    renderDiffHtml
  };
})(window);
