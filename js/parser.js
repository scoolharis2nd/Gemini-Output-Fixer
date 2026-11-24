(function (global) {
  'use strict';

  const DEFAULT_RULES = {
    sanitize: true,
    codeBlocks: true,
    tables: true,
    listsHeadings: true,
    math: true,
    inlineTags: true,
    htmlEntities: true,
    brokenLinks: true,
    storyDialogue: false,
    smartTypography: false
  };

  const RULE_PRESETS = {
    default: {
      sanitize: true,
      codeBlocks: true,
      tables: true,
      listsHeadings: true,
      math: true,
      inlineTags: true,
      htmlEntities: true,
      brokenLinks: true,
      storyDialogue: false,
      smartTypography: false
    },
    coding: {
      sanitize: true,
      codeBlocks: true,
      tables: true,
      listsHeadings: true,
      math: true,
      inlineTags: true,
      htmlEntities: false,
      brokenLinks: true,
      storyDialogue: false,
      smartTypography: false
    },
    book: {
      sanitize: true,
      codeBlocks: true,
      tables: true,
      listsHeadings: true,
      math: false,
      inlineTags: true,
      htmlEntities: true,
      brokenLinks: true,
      storyDialogue: true,
      smartTypography: true
    }
  };

  function splitUnescapedPipes(line) {
    const cells = [];
    let current = '';
    let inBacktick = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '`') {
        inBacktick = !inBacktick;
        current += ch;
      } else if (ch === '\\' && line[i + 1] === '|') {
        current += '\\|';
        i++;
      } else if (ch === '|' && !inBacktick) {
        cells.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current);
    return cells;
  }

  function isTableLine(line) {
    const t = line.trim();
    if (!t || !t.includes('|')) return false;
    const parts = splitUnescapedPipes(t);
    if (parts.length < 2) return false;
    // Avoid mistaking single-pipe prose unless framed by | or >= 2 pipes
    if (parts.length === 2 && !t.startsWith('|') && !t.endsWith('|')) {
      return false;
    }
    return true;
  }

  function parseTableCells(line) {
    let t = line.trim();
    if (t.startsWith('|')) t = t.slice(1);
    if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
    return splitUnescapedPipes(t).map(c => c.trim());
  }

  function isSeparatorRow(cells) {
    return cells.length > 0 && cells.every(c => /^:?-{2,}:?$/.test(c.replace(/\s+/g, '')));
  }

  function parseTableAlignments(sepCells) {
    return sepCells.map(c => {
      const s = c.replace(/\s+/g, '');
      const left = s.startsWith(':');
      const right = s.endsWith(':');
      if (left && right) return 'center';
      if (right) return 'right';
      if (left) return 'left';
      return '';
    });
  }

  function fixTableBlock(block, stats) {
    let modified = false;
    const parsed = block.map(line => {
      const t = line.trim();
      if (!t.startsWith('|') || !t.endsWith('|')) modified = true;
      return parseTableCells(line);
    });

    const maxCols = Math.max(...parsed.map(r => r.length));
    if (maxCols < 2) return block;

    if (parsed.length >= 2 && !isSeparatorRow(parsed[1])) {
      parsed.splice(1, 0, Array(maxCols).fill('---'));
      modified = true;
    }

    const formatted = parsed.map((cells, idx) => {
      const row = [...cells];
      if (row.length < maxCols) {
        modified = true;
        while (row.length < maxCols) row.push(idx === 1 ? '---' : '');
      }
      if (idx === 1) {
        for (let c = 0; c < row.length; c++) {
          const clean = row[c].replace(/\s+/g, '');
          if (!/^:?-{3,}:?$/.test(clean)) {
            const left = clean.startsWith(':') ? ':' : '';
            const right = clean.endsWith(':') ? ':' : '';
            row[c] = left + '---' + right;
            modified = true;
          } else {
            row[c] = clean;
          }
        }
      }
      return '| ' + row.join(' | ') + ' |';
    });

    if (modified) stats.tables++;
    return formatted;
  }

  function repairTables(lines, stats) {
    const out = [];
    let i = 0;
    while (i < lines.length) {
      if (isTableLine(lines[i]) && i + 1 < lines.length && isTableLine(lines[i + 1])) {
        const block = [];
        while (i < lines.length && isTableLine(lines[i])) {
          block.push(lines[i]);
          i++;
        }
        out.push(...fixTableBlock(block, stats));
      } else {
        out.push(lines[i]);
        i++;
      }
    }
    return out;
  }

  function repairListsAndHeadings(lines, stats) {
    const out = [];
    let orderedCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Headings missing space: #Title -> # Title (skip hex colors like #fff or #1a2b3c and #1)
      const headMatch = line.match(/^(\s{0,3})(#{1,6})([^\s#].*)$/);
      if (headMatch) {
        const rest = headMatch[3];
        const isHexOrTagNum = headMatch[2].length === 1 && (/^(?:fff|ffffff|(?=\S*\d)[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?)\b/i.test(rest) || /^\d+\b/.test(rest));
        if (!isHexOrTagNum) {
          line = headMatch[1] + headMatch[2] + ' ' + rest;
          stats.listsHeadings++;
          orderedCounter = 0;
          out.push(line);
          continue;
        }
      }

      // Unordered dash list missing space: -Item -> - Item (skip negative numbers -5, flags --opt, hr ---)
      const dashMatch = line.match(/^(\s*)-([^\s\d-].*)$/);
      if (dashMatch && !/^\s*[-*_]{3,}\s*$/.test(line)) {
        line = dashMatch[1] + '- ' + dashMatch[2];
        stats.listsHeadings++;
        orderedCounter = 0;
        out.push(line);
        continue;
      }

      // Unordered star list missing space: *Item -> * Item (only when no other * on line)
      const starMatch = line.match(/^(\s*)\*([^\s*].*)$/);
      if (starMatch && !starMatch[2].includes('*')) {
        const prevIsList = out.length > 0 && /^\s*[*+-]\s+/.test(out[out.length - 1]);
        const nextIsList = i + 1 < lines.length && /^\s*\*([^\s*]|\s+)/.test(lines[i + 1]);
        if (prevIsList || nextIsList || starMatch[2].length < 80) {
          line = starMatch[1] + '* ' + starMatch[2];
          stats.listsHeadings++;
          orderedCounter = 0;
          out.push(line);
          continue;
        }
      }

      // Ordered list: 1.Item -> 1. Item (never touch decimals 3.14 or versions 2.0.1)
      const ordMatch = line.match(/^(\s*)(\d+)\.(\s*)(.*)$/);
      if (ordMatch) {
        const indent = ordMatch[1];
        const num = parseInt(ordMatch[2], 10);
        const space = ordMatch[3];
        const rest = ordMatch[4];

        const looksLikeDecimalOrVersion = /^\d/.test(rest);
        const looksLikeYear = num >= 1900 && num <= 2100 && orderedCounter === 0;

        if (!looksLikeDecimalOrVersion && !looksLikeYear && rest.length > 0) {
          if (!space) stats.listsHeadings++;
          if (indent.length === 0) {
            if (orderedCounter > 0 || num === 1) {
              orderedCounter++;
              if (num !== orderedCounter) stats.listsHeadings++;
              line = orderedCounter + '. ' + rest;
            } else {
              line = num + '. ' + rest;
            }
          } else {
            line = indent + num + '. ' + rest;
          }
          out.push(line);
          continue;
        }
      }

      if (line.trim() !== '') orderedCounter = 0;
      out.push(line);
    }
    return out;
  }

  function formatStoryParagraphs(lines, stats) {
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const cur = lines[i];
      const prev = out[out.length - 1];
      if (
        prev && prev.trim() !== '' &&
        cur.trim() !== '' &&
        !/^(#{1,6}\s|>|\s*[-*+]\s+|\s*\d+\.\s+|\||[-*_]{3,}\s*$)/.test(cur.trim()) &&
        !/^(#{1,6}\s|>|\s*[-*+]\s+|\s*\d+\.\s+|\||[-*_]{3,}\s*$)/.test(prev.trim()) &&
        (/^["“”'‘’—«]/.test(cur.trim()) || /["“”»]$/.test(prev.trim()))
      ) {
        out.push('');
        stats.sanitized++;
      }
      out.push(cur);
    }
    return out;
  }

  function applySmartTypographyToLine(line, stats) {
    const trimmed = line.trim();
    if (!trimmed || /^\s*\|/.test(line) || /^\s*[-*_]{3,}\s*$/.test(line)) return line;

    const holders = [];
    const protect = (m) => {
      const id = `\u0003T${holders.length}\u0003`;
      holders.push(m);
      return id;
    };

    let out = line
      .replace(/`[^`]*`/g, protect)
      .replace(/(\\\(.+?\\\)|\$[^$\n]+?\$)/g, protect)
      .replace(/https?:\/\/[^\s)]+/g, protect);

    const before = out;
    // Ellipsis
    out = out.replace(/\.{3}/g, '…');
    // Em-dash (avoid touching list markers at start)
    out = out.replace(/(\S)\s*--\s*(\S)/g, '$1 — $2');
    // Curly double quotes
    out = out.replace(/(^|[\s(\[{—])"(?=\S)/g, '$1“');
    out = out.replace(/"/g, '”');

    if (out !== before) stats.sanitized++;
    out = out.replace(/\u0003T(\d+)\u0003/g, (_, idx) => holders[Number(idx)]);
    return out;
  }

  function decodeProseEntities(line, stats) {
    if (!/&(?:amp|lt|gt|quot|#39|nbsp);/.test(line)) return line;
    const holders = [];
    const protect = (m) => {
      const id = `\u0004E${holders.length}\u0004`;
      holders.push(m);
      return id;
    };
    let out = line.replace(/`[^`]*`/g, protect);
    const map = [
      [/&amp;/g, '&'],
      [/&quot;/g, '"'],
      [/&#39;/g, "'"],
      [/&nbsp;/g, ' ']
    ];
    for (const [re, rep] of map) {
      const m = out.match(re);
      if (m) {
        stats.sanitized += m.length;
        out = out.replace(re, rep);
      }
    }
    out = out.replace(/\u0004E(\d+)\u0004/g, (_, idx) => holders[Number(idx)]);
    return out;
  }

  function repairBrokenLinks(line, stats) {
    const re = /\[([^\]]+)\]\s+\((https?:\/\/[^\s)]+)\)/g;
    const matches = line.match(re);
    if (matches) {
      stats.inlineTags += matches.length;
      return line.replace(re, '[$1]($2)');
    }
    return line;
  }

  function repairMath(text, stats) {
    let out = text;

    const openDisplay = (out.match(/\\\[/g) || []).length;
    const closeDisplay = (out.match(/\\\]/g) || []).length;
    if (openDisplay > closeDisplay) {
      out += '\n\\]'.repeat(openDisplay - closeDisplay);
      stats.math += (openDisplay - closeDisplay);
    }

    const openInline = (out.match(/\\\(/g) || []).length;
    const closeInline = (out.match(/\\\)/g) || []).length;
    if (openInline > closeInline) {
      out += '\\)'.repeat(openInline - closeInline);
      stats.math += (openInline - closeInline);
    }

    const ddCount = (out.match(/\$\$/g) || []).length;
    if (ddCount % 2 === 1) {
      out += '\n$$';
      stats.math++;
    }

    return out;
  }

  function repairInlineFormatting(line, stats) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      /^\s*\|/.test(line) ||
      /^\s*[-*_]{3,}\s*$/.test(line) ||
      trimmed.startsWith('\\[') ||
      trimmed.startsWith('\\]') ||
      trimmed.startsWith('$$')
    ) {
      return line;
    }

    // Step 1: Close odd backticks first (ignoring escaped backticks)
    let out = line;
    const rawBackticks = out.match(/(?<!\\)`/g);
    if (rawBackticks && rawBackticks.length % 2 === 1) {
      out += '`';
      stats.inlineTags++;
    }

    // Step 2: Protect inline code, inline math, and URLs before counting *, **, __, ~~
    const holders = [];
    const protect = (m) => {
      const id = `\u0002P${holders.length}\u0002`;
      holders.push(m);
      return id;
    };

    out = out
      .replace(/`[^`]*`/g, protect)
      .replace(/(\\\(.+?\\\)|\$[^$\n]+?\$)/g, protect)
      .replace(/https?:\/\/[^\s)]+/g, protect);

    const boldStars = out.match(/\*\*/g);
    if (boldStars && boldStars.length % 2 === 1) {
      out += '**';
      stats.inlineTags++;
    }

    // Ignore snake_case double underscores like __init__? Only count __ not surrounded by word chars on both sides
    const boldUnder = out.match(/(?<![a-zA-Z0-9])__|__(?![a-zA-Z0-9])/g);
    if (boldUnder && boldUnder.length % 2 === 1) {
      out += '__';
      stats.inlineTags++;
    }

    const strikes = out.match(/~~/g);
    if (strikes && strikes.length % 2 === 1) {
      out += '~~';
      stats.inlineTags++;
    }

    const withoutBoldAndList = out
      .replace(/^\s*\*\s+/, '')
      .replace(/\*\*/g, '');
    const singleStars = withoutBoldAndList.match(/\*/g);
    if (singleStars && singleStars.length % 2 === 1) {
      out += '*';
      stats.inlineTags++;
    }

    out = out.replace(/\u0002P(\d+)\u0002/g, (_, idx) => holders[Number(idx)]);
    return out;
  }

  function autoHealMarkdown(raw, customRules) {
    const rules = Object.assign({}, DEFAULT_RULES, customRules || {});
    const stats = {
      sanitized: 0,
      codeBlocks: 0,
      tables: 0,
      listsHeadings: 0,
      math: 0,
      inlineTags: 0,
      truncated: false
    };

    if (!raw || !raw.trim()) {
      return { fixed: '', stats, codeBlocks: [], headings: [] };
    }

    let text = raw.replace(/\r\n?/g, '\n');

    // Step A: Sanitize invisible unicode & mojibake (safe globally)
    if (rules.sanitize) {
      const invisibleMatches = text.match(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g);
      if (invisibleMatches) {
        stats.sanitized += invisibleMatches.length;
        text = text.replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '');
      }

      text = text.replace(/\u00A0/g, ' ');

      const mojibakeMap = [
        [/â€™/g, "'"], [/â€˜/g, "'"], [/â€œ/g, '"'], [/â€/g, '"'],
        [/â€”/g, '—'], [/â€“/g, '–'], [/â€¦/g, '…'], [/Â /g, ' '], [/â€¢/g, '•']
      ];
      for (const [re, rep] of mojibakeMap) {
        const m = text.match(re);
        if (m) {
          stats.sanitized += m.length;
          text = text.replace(re, rep);
        }
      }
      const strayMoji = text.match(/â€[\u0080-\u009F]?/g);
      if (strayMoji) {
        stats.sanitized += strayMoji.length;
        text = text.replace(/â€[\u0080-\u009F]?/g, '"');
      }
    }

    // Step B: Parse & repair code fences with exact char & length matching
    const rawLines = text.split('\n');
    let inCode = false;
    let openFenceChar = '`';
    let openFenceLen = 3;
    let openFenceLang = '';
    const repairedLines = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      // Fix fused fence at end of prose line outside code block, e.g. "Berikut kodenya:```python"
      if (!inCode && rules.codeBlocks) {
        const fused = line.match(/^(.+?[^\s`~])(```+|~~~+)([a-zA-Z0-9_+-]*)\s*$/);
        if (fused && !line.includes('`', 0)) {
          repairedLines.push(fused[1]);
          repairedLines.push(fused[2] + fused[3]);
          inCode = true;
          openFenceChar = fused[2][0];
          openFenceLen = fused[2].length;
          openFenceLang = fused[3].toLowerCase();
          stats.codeBlocks++;
          continue;
        }
      }

      const fenceMatch = trimmed.match(/^(`{3,}|~{3,})(.*)$/);

      if (fenceMatch) {
        const marker = fenceMatch[1];
        const ch = marker[0];
        const len = marker.length;
        const info = fenceMatch[2].trim();

        if (!inCode) {
          inCode = true;
          openFenceChar = ch;
          openFenceLen = len;
          openFenceLang = info.split(/\s+/)[0].toLowerCase();
          repairedLines.push(line);
        } else {
          const isMatchingClose = ch === openFenceChar && len >= openFenceLen && info === '';
          const isMarkdownHost = openFenceLang === 'md' || openFenceLang === 'markdown';

          if (isMatchingClose) {
            inCode = false;
            repairedLines.push(line);
          } else if (
            rules.codeBlocks &&
            !isMarkdownHost &&
            openFenceLen === 3 &&
            ch === openFenceChar &&
            info &&
            /^[a-zA-Z][a-zA-Z0-9_+-]*$/.test(info)
          ) {
            // Unclosed previous block followed directly by a new ```lang block
            repairedLines.push(openFenceChar.repeat(openFenceLen));
            stats.codeBlocks++;
            repairedLines.push(line);
            openFenceChar = ch;
            openFenceLen = len;
            openFenceLang = info.toLowerCase();
          } else {
            // Treat as literal line inside code block (preserves nested fences!)
            repairedLines.push(line);
          }
        }
      } else {
        repairedLines.push(line);
      }
    }

    if (inCode && rules.codeBlocks) {
      repairedLines.push(openFenceChar.repeat(openFenceLen));
      stats.codeBlocks++;
      stats.truncated = true;
    }

    // Step C: Split into protected code segments vs text segments
    const segments = [];
    let buf = [];
    let inside = false;
    let segChar = '`';
    let segLen = 3;
    const extractedCode = [];

    for (let i = 0; i < repairedLines.length; i++) {
      const line = repairedLines[i];
      const trimmed = line.trim();
      const fm = trimmed.match(/^(`{3,}|~{3,})(.*)$/);

      if (!inside && fm) {
        if (buf.length) segments.push({ type: 'text', lines: buf });
        buf = [line];
        inside = true;
        segChar = fm[1][0];
        segLen = fm[1].length;
      } else if (inside && fm && fm[1][0] === segChar && fm[1].length >= segLen && fm[2].trim() === '') {
        buf.push(line);
        segments.push({ type: 'code', lines: buf });
        const openMatch = buf[0].trim().match(/^(?:`{3,}|~{3,})(.*)$/);
        const lang = (openMatch && openMatch[1] ? openMatch[1].trim().split(/\s+/)[0] : '') || 'code';
        const codeStr = buf.slice(1, -1).join('\n');
        extractedCode.push({
          lang,
          code: codeStr,
          lines: codeStr === '' ? 0 : codeStr.split('\n').length,
          chars: codeStr.length
        });
        buf = [];
        inside = false;
      } else {
        buf.push(line);
      }
    }
    if (buf.length) {
      segments.push({ type: inside ? 'code' : 'text', lines: buf });
      if (inside) {
        const openMatch = buf[0].trim().match(/^(?:`{3,}|~{3,})(.*)$/);
        const lang = (openMatch && openMatch[1] ? openMatch[1].trim().split(/\s+/)[0] : '') || 'code';
        const codeStr = buf.slice(1).join('\n');
        extractedCode.push({
          lang,
          code: codeStr,
          lines: codeStr === '' ? 0 : codeStr.split('\n').length,
          chars: codeStr.length
        });
      }
    }

    // Step D: Apply prose-only repairs (NEVER touch code segments!)
    const headings = [];
    for (const seg of segments) {
      if (seg.type !== 'text') continue;

      if (rules.sanitize) {
        let joined = seg.lines.join('\n');
        const extraNewlines = joined.match(/\n{4,}/g);
        if (extraNewlines) {
          stats.sanitized += extraNewlines.length;
          joined = joined.replace(/\n{4,}/g, '\n\n\n');
        }
        seg.lines = joined.split('\n');
      }

      if (rules.htmlEntities) {
        seg.lines = seg.lines.map(l => decodeProseEntities(l, stats));
      }
      if (rules.brokenLinks) {
        seg.lines = seg.lines.map(l => repairBrokenLinks(l, stats));
      }
      if (rules.tables) seg.lines = repairTables(seg.lines, stats);
      if (rules.listsHeadings) seg.lines = repairListsAndHeadings(seg.lines, stats);
      if (rules.storyDialogue) seg.lines = formatStoryParagraphs(seg.lines, stats);
      if (rules.smartTypography) {
        seg.lines = seg.lines.map(l => applySmartTypographyToLine(l, stats));
      }

      let segText = seg.lines.join('\n');
      if (rules.math) segText = repairMath(segText, stats);

      if (rules.inlineTags) {
        seg.lines = segText.split('\n').map(l => repairInlineFormatting(l, stats));
      } else {
        seg.lines = segText.split('\n');
      }

      seg.lines.forEach(l => {
        const hm = l.trim().match(/^(#{1,3})\s+(.+)$/);
        if (hm) headings.push({ level: hm[1].length, text: hm[2] });
      });
    }

    // Preserve code indentation: only strip leading/trailing blank lines
    const finalFixed = segments.map(s => s.lines.join('\n')).join('\n').replace(/^\n+|\n+$/g, '');

    if (!stats.truncated) {
      const trimmedRaw = text.trim();
      if (trimmedRaw.length > 25) {
        const lastLine = trimmedRaw.split('\n').pop().trim();
        const lastChar = lastLine.slice(-1);
        if (
          lastChar &&
          !/[.!?…"'”’`)\]}|:\n]/.test(lastChar) &&
          !/^#{1,6}\s/.test(lastLine) &&
          !/^[-*_]{3,}$/.test(lastLine)
        ) {
          stats.truncated = true;
        }
      }
    }

    return { fixed: finalFixed, stats, codeBlocks: extractedCode, headings };
  }

  // Real LCS Line Diff with common prefix/suffix trimming
  function computeLineDiff(beforeText, afterText) {
    const a = beforeText.replace(/\r\n?/g, '\n').split('\n');
    const b = afterText.replace(/\r\n?/g, '\n').split('\n');

    let start = 0;
    while (start < a.length && start < b.length && a[start] === b[start]) start++;

    let endA = a.length - 1;
    let endB = b.length - 1;
    while (endA >= start && endB >= start && a[endA] === b[endB]) {
      endA--;
      endB--;
    }

    const diff = [];
    for (let i = 0; i < start; i++) {
      diff.push({ type: 'eq', text: a[i], oldLine: i + 1, newLine: i + 1 });
    }

    const midA = a.slice(start, endA + 1);
    const midB = b.slice(start, endB + 1);
    const m = midA.length;
    const n = midB.length;

    if (m === 0 && n === 0) {
      // identical
    } else if (m * n <= 1200000) {
      // Standard DP LCS table
      const dp = new Array(m + 1);
      for (let i = 0; i <= m; i++) dp[i] = new Int32Array(n + 1);
      for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
          if (midA[i] === midB[j]) {
            dp[i][j] = dp[i + 1][j + 1] + 1;
          } else {
            dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
          }
        }
      }

      let i = 0;
      let j = 0;
      while (i < m && j < n) {
        if (midA[i] === midB[j]) {
          diff.push({ type: 'eq', text: midA[i], oldLine: start + i + 1, newLine: start + j + 1 });
          i++;
          j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
          diff.push({ type: 'rem', text: midA[i], oldLine: start + i + 1, newLine: null });
          i++;
        } else {
          diff.push({ type: 'add', text: midB[j], oldLine: null, newLine: start + j + 1 });
          j++;
        }
      }
      while (i < m) {
        diff.push({ type: 'rem', text: midA[i], oldLine: start + i + 1, newLine: null });
        i++;
      }
      while (j < n) {
        diff.push({ type: 'add', text: midB[j], oldLine: null, newLine: start + j + 1 });
        j++;
      }
    } else {
      // Fast fallback for huge inputs
      const maxLen = Math.max(m, n);
      for (let k = 0; k < maxLen; k++) {
        if (k < m && k < n && midA[k] === midB[k]) {
          diff.push({ type: 'eq', text: midA[k], oldLine: start + k + 1, newLine: start + k + 1 });
        } else {
          if (k < m) diff.push({ type: 'rem', text: midA[k], oldLine: start + k + 1, newLine: null });
          if (k < n) diff.push({ type: 'add', text: midB[k], oldLine: null, newLine: start + k + 1 });
        }
      }
    }

    const tailLen = a.length - 1 - endA;
    for (let t = 0; t < tailLen; t++) {
      const idxA = endA + 1 + t;
      const idxB = endB + 1 + t;
      diff.push({ type: 'eq', text: a[idxA], oldLine: idxA + 1, newLine: idxB + 1 });
    }

    return diff;
  }

  global.FixerParser = {
    DEFAULT_RULES,
    RULE_PRESETS,
    isTableLine,
    parseTableCells,
    isSeparatorRow,
    parseTableAlignments,
    autoHealMarkdown,
    computeLineDiff
  };
})(window);
