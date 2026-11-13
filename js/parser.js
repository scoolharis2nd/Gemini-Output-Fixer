(function (global) {
  'use strict';

  const DEFAULT_RULES = {
    sanitize: true,
    codeBlocks: true,
    tables: true,
    listsHeadings: true,
    math: true,
    inlineTags: true,
    storyDialogue: false
  };

  function isTableLine(line) {
    const t = line.trim();
    if (!t) return false;
    return t.includes('|') && t.split('|').length >= 2;
  }

  function parseTableCells(line) {
    let t = line.trim();
    if (t.startsWith('|')) t = t.slice(1);
    if (t.endsWith('|')) t = t.slice(0, -1);
    return t.split('|').map(c => c.trim());
  }

  function isSeparatorRow(cells) {
    return cells.length > 0 && cells.every(c => /^:?-{2,}:?$/.test(c.replace(/\s+/g, '')));
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
        while (row.length < maxCols) {
          row.push(idx === 1 ? '---' : '');
        }
      }
      if (idx === 1) {
        for (let c = 0; c < row.length; c++) {
          if (!/^:?-{3,}:?$/.test(row[c])) {
            const left = row[c].startsWith(':') ? ':' : '';
            const right = row[c].endsWith(':') ? ':' : '';
            row[c] = left + '---' + right;
            modified = true;
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

      const headMatch = line.match(/^(\s{0,3})(#{1,6})([^\s#].*)$/);
      if (headMatch) {
        line = headMatch[1] + headMatch[2] + ' ' + headMatch[3];
        stats.listsHeadings++;
        orderedCounter = 0;
        out.push(line);
        continue;
      }

      const dashMatch = line.match(/^(\s*)-([^\s-].*)$/);
      if (dashMatch) {
        line = dashMatch[1] + '- ' + dashMatch[2];
        stats.listsHeadings++;
        orderedCounter = 0;
        out.push(line);
        continue;
      }

      const starMatch = line.match(/^(\s*)\*([^\s*].*)$/);
      if (starMatch && !starMatch[2].includes('*')) {
        line = starMatch[1] + '* ' + starMatch[2];
        stats.listsHeadings++;
        orderedCounter = 0;
        out.push(line);
        continue;
      }

      const ordMatch = line.match(/^(\s*)(\d+)\.(\s*)(.*)$/);
      if (ordMatch) {
        const indent = ordMatch[1];
        const num = parseInt(ordMatch[2], 10);
        const space = ordMatch[3];
        const rest = ordMatch[4];

        if (!space && rest) stats.listsHeadings++;
        if (indent.length === 0) {
          orderedCounter++;
          if (num !== orderedCounter) stats.listsHeadings++;
          line = orderedCounter + '. ' + rest;
        } else {
          line = indent + num + '. ' + rest;
        }
        out.push(line);
        continue;
      }

      if (line.trim() !== '') orderedCounter = 0;
      out.push(line);
    }
    return out;
  }

  function formatStoryParagraphs(lines, stats) {
    // Ensure dialogue lines starting with quotes or em-dash have clean paragraph spacing
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const cur = lines[i];
      const prev = out[out.length - 1];
      if (
        prev && prev.trim() !== '' &&
        cur.trim() !== '' &&
        !/^(#{1,6}\s|>|\s*[-*+]\s+|\s*\d+\.\s+|\|)/.test(cur) &&
        (/^[""'—]/.test(cur.trim()) || /[""]$/.test(prev.trim()))
      ) {
        out.push('');
        stats.sanitized++;
      }
      out.push(cur);
    }
    return out;
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
    if (!line.trim() || /^\s*\|/.test(line) || /^\s*[-*_]{3,}\s*$/.test(line)) {
      return line;
    }
    let out = line;

    const backticks = out.match(/`/g);
    if (backticks && backticks.length % 2 === 1) {
      out += '`';
      stats.inlineTags++;
    }

    const boldStars = out.match(/\*\*/g);
    if (boldStars && boldStars.length % 2 === 1) {
      out += '**';
      stats.inlineTags++;
    }

    const boldUnder = out.match(/__/g);
    if (boldUnder && boldUnder.length % 2 === 1) {
      out += '__';
      stats.inlineTags++;
    }

    const withoutBoldAndList = out
      .replace(/^\s*\*\s+/, '')
      .replace(/\*\*/g, '')
      .replace(/`[^`]*`/g, '');
    const singleStars = withoutBoldAndList.match(/\*/g);
    if (singleStars && singleStars.length % 2 === 1) {
      out += '*';
      stats.inlineTags++;
    }

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

      const extraNewlines = text.match(/\n{4,}/g);
      if (extraNewlines) {
        stats.sanitized += extraNewlines.length;
        text = text.replace(/\n{4,}/g, '\n\n\n');
      }
    }

    let lines = text.split('\n');
    let inCode = false;
    let fenceChar = '```';
    const repairedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const fenceMatch = trimmed.match(/^(```+|~~~+)(.*)$/);

      if (fenceMatch) {
        const ticks = fenceMatch[1].slice(0, 3);
        const lang = fenceMatch[2].trim();

        if (!inCode) {
          inCode = true;
          fenceChar = ticks;
          repairedLines.push(line);
        } else if (rules.codeBlocks && lang && /^[a-zA-Z0-9_+-]+$/.test(lang)) {
          repairedLines.push(fenceChar);
          stats.codeBlocks++;
          repairedLines.push(line);
          fenceChar = ticks;
        } else {
          inCode = false;
          repairedLines.push(line);
        }
      } else {
        repairedLines.push(line);
      }
    }

    if (inCode && rules.codeBlocks) {
      repairedLines.push(fenceChar);
      stats.codeBlocks++;
      stats.truncated = true;
    }

    lines = repairedLines;
    const segments = [];
    let buf = [];
    let inside = false;
    const extractedCode = [];

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (/^(```+|~~~+)/.test(trimmed)) {
        if (!inside) {
          if (buf.length) segments.push({ type: 'text', lines: buf });
          buf = [lines[i]];
          inside = true;
        } else {
          buf.push(lines[i]);
          segments.push({ type: 'code', lines: buf });
          const lang = (buf[0].trim().match(/^(?:```+|~~~+)(.*)$/) || ['', 'code'])[1].trim() || 'code';
          extractedCode.push({ lang, code: buf.slice(1, -1).join('\n') });
          buf = [];
          inside = false;
        }
      } else {
        buf.push(lines[i]);
      }
    }
    if (buf.length) {
      segments.push({ type: inside ? 'code' : 'text', lines: buf });
    }

    const headings = [];
    for (const seg of segments) {
      if (seg.type !== 'text') continue;

      if (rules.tables) seg.lines = repairTables(seg.lines, stats);
      if (rules.listsHeadings) seg.lines = repairListsAndHeadings(seg.lines, stats);
      if (rules.storyDialogue) seg.lines = formatStoryParagraphs(seg.lines, stats);

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

    const finalFixed = segments.map(s => s.lines.join('\n')).join('\n').trim();

    if (!stats.truncated) {
      const trimmedRaw = text.trim();
      if (trimmedRaw.length > 25) {
        const lastChar = trimmedRaw.slice(-1);
        if (!/[.!?…"'`)\]}|:\n]/.test(lastChar) && !/^#{1,6}\s/.test(trimmedRaw.split('\n').pop())) {
          stats.truncated = true;
        }
      }
    }

    return { fixed: finalFixed, stats, codeBlocks: extractedCode, headings };
  }

  function computeLineDiff(beforeText, afterText) {
    const a = beforeText.replace(/\r\n?/g, '\n').split('\n');
    const b = afterText.replace(/\r\n?/g, '\n').split('\n');
    const diff = [];
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const la = a[i];
      const lb = b[i];
      if (la === lb) {
        diff.push({ type: 'eq', text: lb });
      } else {
        if (la !== undefined) diff.push({ type: 'rem', text: la });
        if (lb !== undefined) diff.push({ type: 'add', text: lb });
      }
    }
    return diff;
  }

  global.FixerParser = {
    DEFAULT_RULES,
    isTableLine,
    parseTableCells,
    isSeparatorRow,
    autoHealMarkdown,
    computeLineDiff
  };
})(window);
