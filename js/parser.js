/**
 * Google AI Studio Output Fixer — Bulletproof Auto-Heal Engine
 * Architecture: Tokenized Isolation Pipeline
 * Guarantees: Fenced code blocks, inline code, URLs, and math blocks are strictly isolated
 * before prose/literary formatting rules execute—preventing coding OR writing format corruption.
 */
(function (global) {
  'use strict';

  const DEFAULT_RULES = {
    fixArtifacts: true,
    fixJsonEscape: true,
    fixCodeFences: true,
    autoDetectLang: true,
    fixHeadings: true,
    fixEmphasis: true,
    fixListsAndTables: true,
    fixMath: true,
    fixSpacing: true,
    fixTypography: false,
    fixDialogue: false,
    stripCitations: false,
    stripAiChatter: false
  };

  const RULE_METADATA = [
    { key: 'fixArtifacts', label: 'Bersihkan Karakter Tak Terlihat', desc: 'Hapus zero-width space, BOM, NBSP & normalisasi line endings', category: 'Core' },
    { key: 'fixJsonEscape', label: 'Unescape Raw JSON String', desc: 'Ubah string \\n literal dari raw API JSON dump secara aman', category: 'Core' },
    { key: 'fixCodeFences', label: 'Perbaiki Code Fence Rusak', desc: 'Tutup blok ``` tak tertutup, pisah fence menempel & spasi backtick', category: 'Coding' },
    { key: 'autoDetectLang', label: 'Auto-Deteksi Bahasa Kode', desc: 'Isi label bahasa otomatis (JS, Python, HTML, SQL, dll) tanpa mengubah kode', category: 'Coding' },
    { key: 'fixHeadings', label: 'Perbaiki Heading Markdown', desc: 'Tambah spasi hilang setelah ## tanpa merusak hashtag #tag', category: 'Markdown' },
    { key: 'fixEmphasis', label: 'Perbaiki Bold & Italic Patah', desc: 'Rapikan ** teks **, ****teks**** & spasi label **Catatan:**teks', category: 'Markdown' },
    { key: 'fixListsAndTables', label: 'Perbaiki List & Tabel Rusak', desc: 'Normalisasi bullet •, 1.Teks & tambahkan baris pemisah tabel |---|', category: 'Markdown' },
    { key: 'fixMath', label: 'Normalisasi LaTeX Math', desc: 'Konversi \\(...\\) & \\[...\\] ke $...$ / $$...$$ di luar kode', category: 'Markdown' },
    { key: 'fixSpacing', label: 'Rapikan Spasi & Paragraf', desc: 'Ringkas baris kosong berlebih (>3) tanpa merusak kode/puisi', category: 'Writing' },
    { key: 'fixTypography', label: 'Tipografi Novel Pintar', desc: 'Ubah tanda kutip lurus ke “...”, em-dash (—) & elipsis (…) di luar kode', category: 'Writing' },
    { key: 'fixDialogue', label: 'Pisahkan Paragraf Dialog', desc: 'Beri jarak paragraf otomatis antar dialog rapat untuk fanfiksi/novel', category: 'Writing' },
    { key: 'stripCitations', label: 'Hapus Marker Sitasi AI', desc: 'Bersihkan tag seperti  atau 【1†source】', category: 'Cleanup' },
    { key: 'stripAiChatter', label: 'Hapus Basa-Basi Pembuka AI', desc: 'Hapus kalimat pembuka generik seperti "Tentu, berikut ini..."', category: 'Cleanup' }
  ];

  const PRESETS = {
    balanced: {
      fixArtifacts: true,
      fixJsonEscape: true,
      fixCodeFences: true,
      autoDetectLang: true,
      fixHeadings: true,
      fixEmphasis: true,
      fixListsAndTables: true,
      fixMath: true,
      fixSpacing: true,
      fixTypography: false,
      fixDialogue: false,
      stripCitations: false,
      stripAiChatter: false
    },
    coding: {
      fixArtifacts: true,
      fixJsonEscape: true,
      fixCodeFences: true,
      autoDetectLang: true,
      fixHeadings: true,
      fixEmphasis: true,
      fixListsAndTables: true,
      fixMath: false,
      fixSpacing: true,
      fixTypography: false,
      fixDialogue: false,
      stripCitations: false,
      stripAiChatter: false
    },
    book: {
      fixArtifacts: true,
      fixJsonEscape: true,
      fixCodeFences: true,
      autoDetectLang: false,
      fixHeadings: true,
      fixEmphasis: true,
      fixListsAndTables: true,
      fixMath: true,
      fixSpacing: true,
      fixTypography: true,
      fixDialogue: true,
      stripCitations: true,
      stripAiChatter: false
    },
    minimal: {
      fixArtifacts: true,
      fixJsonEscape: false,
      fixCodeFences: true,
      autoDetectLang: false,
      fixHeadings: false,
      fixEmphasis: false,
      fixListsAndTables: false,
      fixMath: false,
      fixSpacing: false,
      fixTypography: false,
      fixDialogue: false,
      stripCitations: false,
      stripAiChatter: false
    }
  };

  /**
   * Heuristically detect programming language for unlabeled fenced blocks
   */
  function detectLanguage(code) {
    const src = (code || '').trim();
    if (!src) return 'text';

    // JSON check (strict valid parse)
    if ((src.startsWith('{') && src.endsWith('}')) || (src.startsWith('[') && src.endsWith(']'))) {
      try {
        JSON.parse(src);
        return 'json';
      } catch (_) {}
    }

    if (/^<!DOCTYPE\s+html/i.test(src) || /<(html|head|body|div|section|script|style|main)\b/i.test(src)) {
      return 'html';
    }
    if (/^<svg\b/i.test(src) && /<\/svg>\s*$/i.test(src)) {
      return 'svg';
    }
    if (/^<\?xml\b/i.test(src)) {
      return 'xml';
    }
    if (/^\s*<\?php\b/.test(src)) {
      return 'php';
    }
    if (/^\s*(SELECT|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|WITH\s+\w+\s+AS)\b/i.test(src)) {
      return 'sql';
    }
    if (/^\s*#!\/.*(bash|sh|zsh)|^\s*(npm|yarn|pnpm|pip|git|docker|curl|sudo|chmod|apt-get|brew)\s+/m.test(src)) {
      return 'bash';
    }
    if (/\b(def\s+\w+\s*\(|import\s+\w+|from\s+[\w.]+\s+import|elif\s+.+:|if\s+__name__\s*==\s*['"]__main__['"])/.test(src) && !/[;{}]\s*$/m.test(src)) {
      return 'python';
    }
    if (/\b(interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|Record<|Promise<|Array<))/.test(src) && /\b(const|let|function|export|import)\b/.test(src)) {
      return 'typescript';
    }
    if (/\b(const|let|var|function|async\s+function|export\s+default|document\.|window\.|console\.log|=>)\b/.test(src)) {
      return 'javascript';
    }
    if (/(^|\n)\s*([.#]?[\w-]+|\*|:root|@media|@keyframes)\s*\{[\s\S]*?:[\s\S]*?;/.test(src) && !/\b(function|const|let|class\s+\w+\s+extends)\b/.test(src)) {
      return 'css';
    }
    if (/\b(fn\s+\w+|let\s+mut\s+|println!|impl\s+\w+|pub\s+struct)\b/.test(src)) {
      return 'rust';
    }
    if (/\b(package\s+main|func\s+\w+\s*\(|fmt\.Print|:=)\b/.test(src)) {
      return 'go';
    }
    if (/\b(public\s+class\s+\w+|System\.out\.print|private\s+static\s+void)\b/.test(src)) {
      return 'java';
    }
    if (/\b(#include\s*<|std::|int\s+main\s*\(|printf\s*\()/.test(src)) {
      return 'cpp';
    }
    if (/^[\w-]+:\s+.+\n([\w-]+:\s+.+|\s+-\s+.+)/m.test(src) && !/[;{}]/.test(src)) {
      return 'yaml';
    }
    return 'text';
  }

  /**
   * Extract optional filename from first comment line or preceding Markdown label
   */
  function extractFilename(code, prevLine) {
    const firstLine = ((code || '').split('\n')[0] || '').trim();
    const commentMatch = firstLine.match(/^(?:\/\/|#|\/\*|<!--|--)\s*(?:file(?:name)?:\s*)?([a-zA-Z0-9_.\-\/]+\.[a-zA-Z0-9]{1,8})\b/i);
    if (commentMatch) return commentMatch[1];

    if (prevLine) {
      const cleanedPrev = prevLine.trim();
      const mdMatch = cleanedPrev.match(/(?:\*\*|`|###?\s+)([a-zA-Z0-9_.\-\/]+\.[a-zA-Z0-9]{1,8})(?:\*\*|`|:)?\s*$/);
      if (mdMatch) return mdMatch[1];
    }
    return '';
  }

  /**
   * Known language normalization map
   */
  function normalizeLangTag(rawLang) {
    const cleaned = (rawLang || '').trim().split(/\s+/)[0].toLowerCase();
    const map = {
      js: 'javascript',
      mjs: 'javascript',
      cjs: 'javascript',
      ts: 'typescript',
      py: 'python',
      py3: 'python',
      sh: 'bash',
      shell: 'bash',
      zsh: 'bash',
      yml: 'yaml',
      md: 'markdown',
      htm: 'html',
      'c++': 'cpp',
      'c#': 'csharp',
      cs: 'csharp',
      rb: 'ruby',
      rs: 'rust',
      kt: 'kotlin'
    };
    return map[cleaned] || cleaned || 'text';
  }

  /**
   * Safely unescape raw JSON string payloads without ever touching valid code
   */
  function tryUnescapeJsonPayload(text) {
    const trimmed = text.trim();
    if (!trimmed) return { text, count: 0 };

    // Case 1: Exact JSON-encoded string literal wrapped in double quotes
    if (trimmed.length > 20 && trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.includes('\\n')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === 'string' && parsed.includes('\n')) {
          return { text: parsed, count: 1 };
        }
      } catch (_) {}
    }

    // Case 2: Unquoted raw Gemini JSON dump with zero real newlines and multiple \n\n breaks
    const realNewlines = (text.match(/\n/g) || []).length;
    const escapedNewlines = (text.match(/\\n/g) || []).length;
    const looksLikeSingleLineCode = /^(const|let|var|function|import|export|def|class|SELECT|CREATE|<!DOCTYPE|<html|\{)/i.test(trimmed);

    if (realNewlines === 0 && escapedNewlines >= 4 && trimmed.includes('\\n\\n') && !looksLikeSingleLineCode) {
      const unescaped = text
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"');
      return { text: unescaped, count: escapedNewlines };
    }

    return { text, count: 0 };
  }

  /**
   * Line-by-line CommonMark-compliant fenced code block extractor & repairer.
   * Properly supports nested fences (e.g., ````markdown containing ```js).
   */
  function extractAndHealCodeBlocks(text, rules, fixes) {
    const rawLines = text.split('\n');
    const outLines = [];
    const codeBlocks = [];

    let inFence = null;
    let lastNonEmptyProse = '';

    const gluedLangRegex = /^(`{3,}|~{3,})(python|javascript|typescript|json|html|xml|svg|css|sql|bash|java|rust|go|php|ruby|yaml|cpp)(.*)$/i;

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];

      if (!inFence) {
        // Fix spaced backticks like "` ` `python" on its own line
        if (rules.fixCodeFences && /^\s*`\s+`\s+`/.test(line)) {
          line = line.replace(/^(\s*)`\s+`\s+`/, '$1```');
          fixes.codeFences++;
        }

        // Fix opening fence where language tag is directly glued to code (strict unmistakable patterns only)
        if (rules.fixCodeFences) {
          const gMatch = line.match(gluedLangRegex);
          if (gMatch) {
            const fenceStr = gMatch[1];
            const langWord = gMatch[2].toLowerCase();
            const rest = gMatch[3];
            const gluedTrigger =
              (langWord === 'json' && /^[\[{]/.test(rest)) ||
              ((langWord === 'html' || langWord === 'xml' || langWord === 'svg') && /^</.test(rest)) ||
              (/^(import |from |def |class |const |let |var |function |export |SELECT |CREATE |package |public |#include|body\s*\{|\.[a-zA-Z])/.test(rest));

            if (gluedTrigger) {
              rawLines.splice(i, 1, fenceStr + langWord, rest);
              line = rawLines[i];
              fixes.codeFences++;
            }
          }
        }

        // Check for standard opening fence (up to 3 leading spaces, or inside list)
        const openMatch = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
        if (openMatch) {
          const indent = openMatch[1];
          const fenceSeq = openMatch[2];
          const fenceChar = fenceSeq[0];
          const infoStr = openMatch[3].trim();

          // CommonMark rule: backtick fence info string cannot contain backticks
          // (avoids mistaking inline ````code```` on a single line for an opening fence)
          if (fenceChar === '`' && infoStr.includes('`')) {
            outLines.push(line);
            if (line.trim()) lastNonEmptyProse = line;
            continue;
          }

          inFence = {
            indent,
            char: fenceChar,
            len: fenceSeq.length,
            rawInfo: infoStr,
            lang: infoStr ? normalizeLangTag(infoStr) : '',
            lines: [],
            prevProse: lastNonEmptyProse,
            autoClosed: false
          };
          continue;
        }

        outLines.push(line);
        if (line.trim()) lastNonEmptyProse = line;
      } else {
        // Inside a fenced code block: check for exact matching closing fence
        const closeRe = new RegExp(`^\\s*${inFence.char}{${inFence.len},}\\s*$`);
        if (closeRe.test(line)) {
          finalizeFence(inFence, false);
          inFence = null;
          continue;
        }

        // Repair closing fence glued to end of a code line (never inside markdown meta-blocks)
        if (rules.fixCodeFences && inFence.lang !== 'markdown' && inFence.lang !== 'md') {
          const gluedCloseRe = new RegExp(`^(.+?)(${inFence.char}{${inFence.len},})\\s*$`);
          const gcMatch = line.match(gluedCloseRe);
          if (gcMatch && !gcMatch[1].includes(inFence.char.repeat(3))) {
            inFence.lines.push(gcMatch[1]);
            fixes.codeFences++;
            finalizeFence(inFence, false);
            inFence = null;
            continue;
          }
        }

        // Preserve exact indentation and characters inside code block
        inFence.lines.push(line);
      }
    }

    // Handle unclosed fence at EOF
    let hadUnclosedFence = false;
    let unclosedLang = '';
    if (inFence) {
      hadUnclosedFence = true;
      unclosedLang = inFence.lang || 'text';
      if (rules.fixCodeFences) {
        fixes.codeFences++;
        finalizeFence(inFence, true);
      } else {
        // Keep raw unclosed fence if rule is disabled
        outLines.push(inFence.indent + inFence.char.repeat(inFence.len) + inFence.rawInfo);
        outLines.push(...inFence.lines);
      }
    }

    function finalizeFence(fenceObj, wasAutoClosed) {
      const codeContent = fenceObj.lines.join('\n');
      let finalLang = fenceObj.lang;
      let autoDetectedLang = false;

      if (!finalLang) {
        if (rules.autoDetectLang) {
          finalLang = detectLanguage(codeContent);
          if (finalLang !== 'text') {
            fixes.langDetected++;
            autoDetectedLang = true;
          }
        } else {
          finalLang = 'text';
        }
      }

      const filename = extractFilename(codeContent, fenceObj.prevProse);
      const idx = codeBlocks.length;
      const lineCount = codeContent === '' ? 0 : fenceObj.lines.length;

      // Preserve fence length (at least 3, or longer if content contains backticks)
      let safeFenceLen = fenceObj.len;
      if (fenceObj.char === '`') {
        const innerTicks = codeContent.match(/`{3,}/g);
        if (innerTicks) {
          const maxInner = Math.max(...innerTicks.map(t => t.length));
          if (safeFenceLen <= maxInner) safeFenceLen = maxInner + 1;
        }
      }

      const fenceMarker = fenceObj.char.repeat(safeFenceLen);
      const displayLang = finalLang === 'text' && !fenceObj.rawInfo ? '' : finalLang;
      const renderedFence = `${fenceObj.indent}${fenceMarker}${displayLang}\n${codeContent}\n${fenceObj.indent}${fenceMarker}`;

      codeBlocks.push({
        index: idx,
        lang: finalLang,
        filename,
        code: codeContent,
        lines: lineCount,
        bytes: new Blob([codeContent]).size,
        autoClosed: wasAutoClosed,
        autoDetectedLang,
        renderedFence
      });

      outLines.push(`@@CODEBLOCK_${idx}@@`);
    }

    return {
      textWithTokens: outLines.join('\n'),
      codeBlocks,
      hadUnclosedFence,
      unclosedLang
    };
  }

  /**
   * Repair broken Markdown pipe tables safely outside code blocks
   */
  function healMarkdownTables(text, fixes) {
    const lines = text.split('\n');
    const result = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Detect collapsed single-line table like "| A | B | | --- | --- | | 1 | 2 |"
      if (/^\|.+\|\s+\|\s*:?-{2,}:?\s*\|/.test(line.trim())) {
        const splitRows = line.trim().replace(/\|\s+\|/g, '|\n|').split('\n');
        lines.splice(i, 1, ...splitRows);
        fixes.listsAndTables++;
        continue;
      }

      // Check start of a pipe table block (>= 2 pipes on line, not a code placeholder)
      if (isTableRowCandidate(line)) {
        const tableRows = [];
        while (i < lines.length && isTableRowCandidate(lines[i])) {
          tableRows.push(lines[i]);
          i++;
        }

        if (tableRows.length >= 2) {
          const parsedRows = tableRows.map(parseTableCells);
          const colCount = Math.max(...parsedRows.map(r => r.length));

          if (colCount >= 2) {
            const normalized = [];
            const secondIsSep = isSeparatorRow(parsedRows[1]);

            for (let r = 0; r < parsedRows.length; r++) {
              const cells = parsedRows[r].slice();
              const origLen = cells.length;
              while (cells.length < colCount) cells.push('');

              if (r === 1 && secondIsSep) {
                const sepCells = cells.map(c => {
                  const t = c.trim();
                  if (/^:-+:$/.test(t)) return ':---:';
                  if (/^:-+$/.test(t)) return ':---';
                  if (/^-+:$/.test(t)) return '---:';
                  return '---';
                });
                const formattedSep = `| ${sepCells.join(' | ')} |`;
                if (origLen !== colCount || tableRows[r].trim() !== formattedSep) {
                  // Only count structural repairs
                  if (origLen !== colCount) fixes.listsAndTables++;
                }
                normalized.push(formattedSep);
              } else {
                const formattedRow = `| ${cells.map(c => c.trim()).join(' | ')} |`;
                if (origLen !== colCount) fixes.listsAndTables++;
                normalized.push(formattedRow);

                // Insert missing separator row after header
                if (r === 0 && !secondIsSep) {
                  normalized.push(`| ${Array(colCount).fill('---').join(' | ')} |`);
                  fixes.listsAndTables++;
                }
              }
            }

            result.push(...normalized);
            continue;
          }
        }

        result.push(...tableRows);
        continue;
      }

      result.push(line);
      i++;
    }

    return result.join('\n');
  }

  function isTableRowCandidate(line) {
    const t = line.trim();
    if (!t || t.startsWith('@@CODEBLOCK_') || t.startsWith('>')) return false;
    const pipeCount = (t.match(/\|/g) || []).length;
    return pipeCount >= 2 && (t.startsWith('|') || t.endsWith('|'));
  }

  function parseTableCells(line) {
    let t = line.trim();
    if (t.startsWith('|')) t = t.slice(1);
    if (t.endsWith('|')) t = t.slice(0, -1);
    return t.split('|');
  }

  function isSeparatorRow(cells) {
    return cells.length > 0 && cells.every(c => /^:?-+:?$/.test(c.trim()) || c.trim() === '');
  }

  /**
   * Protect inline code, math blocks, and URLs while prose rules run
   */
  function protectInlineTokens(text, rules, fixes) {
    const tokens = [];
    const stash = (val) => {
      const key = `@@INLINETOKEN_${tokens.length}@@`;
      tokens.push(val);
      return key;
    };

    let out = text;

    // 1. Protect fenced block placeholders already present
    out = out.replace(/@@CODEBLOCK_\d+@@/g, m => stash(m));

    // 2. Protect inline code spans (multi-backtick safe)
    out = out.replace(/(`+)([^\n`]+?)\1/g, m => stash(m));

    // 3. Normalize & protect LaTeX math
    if (rules.fixMath) {
      out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_, inner) => {
        fixes.math++;
        return stash(`$$\n${inner.trim()}\n$$`);
      });
      out = out.replace(/\\\((.+?)\\\)/g, (_, inner) => {
        fixes.math++;
        return stash(`$${inner.trim()}$`);
      });
    }

    // Protect existing $$...$$ block math & $...$ inline math
    out = out.replace(/\$\$[\s\S]+?\$\$/g, m => stash(m));
    out = out.replace(/(?<!\$)\$(?!\s)([^\n$]+?)(?<!\s)\$(?!\d)/g, m => stash(m));

    // 4. Protect Markdown links and raw URLs so underscores/dashes never get corrupted
    out = out.replace(/\]\(([^)\s]+(?:\s+"[^"]*")?)\)/g, m => stash(m));
    out = out.replace(/https?:\/\/[^\s<>)\]]+/g, m => stash(m));

    return {
      text: out,
      restore: (processed) => {
        // Restore in reverse order so nested tokens unwrap cleanly
        let restored = processed;
        for (let i = tokens.length - 1; i >= 0; i--) {
          restored = restored.split(`@@INLINETOKEN_${i}@@`).join(tokens[i]);
        }
        return restored;
      }
    };
  }

  /**
   * Main Auto-Heal & Analysis Pipeline
   */
  function parseAndFix(rawText, customRules) {
    const rules = Object.assign({}, DEFAULT_RULES, customRules || {});
    const fixes = {
      artifacts: 0,
      jsonUnescaped: 0,
      codeFences: 0,
      langDetected: 0,
      headings: 0,
      emphasis: 0,
      listsAndTables: 0,
      math: 0,
      spacing: 0,
      typography: 0,
      dialogue: 0,
      citations: 0,
      chatter: 0
    };

    const raw = typeof rawText === 'string' ? rawText : '';
    if (!raw.trim()) {
      return buildEmptyResult(raw);
    }

    let text = raw;

    // Step 1: Normalize line endings & invisible AI artifacts
    if (rules.fixArtifacts) {
      const before = text;
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const invisMatches = text.match(/[\u200B-\u200D\uFEFF\u2060]/g);
      if (invisMatches) {
        fixes.artifacts += invisMatches.length;
        text = text.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '');
      }
      if (text !== before && fixes.artifacts === 0) {
        fixes.artifacts++;
      }
    }

    // Step 2: Safe JSON string unescape
    if (rules.fixJsonEscape) {
      const res = tryUnescapeJsonPayload(text);
      text = res.text;
      fixes.jsonUnescaped += res.count;
    }

    // Step 3: Extract & heal fenced code blocks (strictly isolating code from all prose rules)
    const codePass = extractAndHealCodeBlocks(text, rules, fixes);
    text = codePass.textWithTokens;

    // Step 4: Optional AI opener chatter cleanup (only first paragraph, never touching code/headings)
    if (rules.stripAiChatter) {
      const chatterRe = /^(?:(?:Tentu(?: saja)?|Baik(?:lah)?|Berikut(?: adalah| ini)?|Halo|Here(?:'s| is)|Sure(?: thing)?|Certainly|Of course)[^\n]{0,140}[:.!]\s*\n+)/i;
      if (chatterRe.test(text)) {
        text = text.replace(chatterRe, '');
        fixes.chatter++;
      }
    }

    // Step 5: Protect inline code, math, and URLs before prose rules
    const inlineProt = protectInlineTokens(text, rules, fixes);
    let prose = inlineProt.text;

    // Clean non-breaking spaces in prose only (never inside code blocks)
    if (rules.fixArtifacts) {
      const nbsp = prose.match(/\u00A0/g);
      if (nbsp) {
        fixes.artifacts += nbsp.length;
        prose = prose.replace(/\u00A0/g, ' ');
      }
    }

    // Strip grounding / citation tags if enabled
    if (rules.stripCitations) {
      const citeRe = /\s*(?:\[cite:\s*[\d,\s-]+\]|【\d+†[^】]+】|\[\^\d+\](?!:))/gi;
      const matches = prose.match(citeRe);
      if (matches) {
        fixes.citations += matches.length;
        prose = prose.replace(citeRe, '');
      }
    }

    // Step 6: Repair Markdown Headings safely
    if (rules.fixHeadings) {
      // ##Heading -> ## Heading (2-6 hashes: almost never a social hashtag)
      prose = prose.replace(/^(#{2,6})([^\s#`])/gm, (_, hashes, ch) => {
        fixes.headings++;
        return `${hashes} ${ch}`;
      });
      // Single #Heading: only fix if followed by Uppercase word + spaces on the same line (not #tag or #include)
      prose = prose.replace(/^#([A-Z\u00C0-\u017F][^\n]*\s[^\n]*)$/gm, (full, rest) => {
        if (/^(include|define|pragma|ifdef|ifndef|endif|region)\b/i.test(rest)) return full;
        fixes.headings++;
        return `# ${rest}`;
      });
      // Ensure blank line before Markdown headings when directly glued after text
      prose = prose.replace(/([^\n])\n(#{1,6}\s+\S)/g, (_, prev, heading) => {
        fixes.headings++;
        return `${prev}\n\n${heading}`;
      });
    }

    // Step 7: Repair Broken Bold & Italic Emphasis
    if (rules.fixEmphasis) {
      // Quadruple asterisks ****word**** -> **word**
      prose = prose.replace(/\*{4}([^*\n]+?)\*{4}/g, (_, inner) => {
        fixes.emphasis++;
        return `**${inner.trim()}**`;
      });

      // Spaces inside bold markers: ** teks tebal ** -> **teks tebal**
      prose = prose.replace(/(^|[\s(\[“"'])(\*\*)([ \t]+)([^*\n]+?)([ \t]*)(\*\*)(?=$|[\s.,;:!?)\]”"'])/gm,
        (full, pre, o, sp1, inner, sp2, c) => {
          if (!inner.trim()) return full;
          fixes.emphasis++;
          return `${pre}${o}${inner.trim()}${c}`;
        }
      );
      prose = prose.replace(/(^|[\s(\[“"'])(\*\*)([^*\n]+?)([ \t]+)(\*\*)(?=$|[\s.,;:!?)\]”"'])/gm,
        (full, pre, o, inner, sp2, c) => {
          if (!inner.trim()) return full;
          fixes.emphasis++;
          return `${pre}${o}${inner.trim()}${c}`;
        }
      );

      // Glued label bold: **Catatan:**Ini penting -> **Catatan:** Ini penting
      prose = prose.replace(/(\*\*[^*\n]+?[:!?]\*\*)([A-Za-z0-9\u00C0-\u024F"“'])/g, (_, boldPart, nextChar) => {
        fixes.emphasis++;
        return `${boldPart} ${nextChar}`;
      });
    }

    // Step 8: Repair Broken Lists & Pipe Tables
    if (rules.fixListsAndTables) {
      // Unicode bullets -> standard Markdown dash
      prose = prose.replace(/^([ \t]*)[•◦▪▫●]\s+/gm, (_, indent) => {
        fixes.listsAndTables++;
        return `${indent}- `;
      });

      // Ordered list missing space: 1.Item -> 1. Item (never touches decimals like 3.14)
      prose = prose.replace(/^([ \t]*\d+\.)([A-Za-z\u00C0-\u024F"“'*\[])/gm, (_, num, ch) => {
        fixes.listsAndTables++;
        return `${num} ${ch}`;
      });

      // Unordered list missing space: -Item -> - Item (ignores --- HR, -- flags, -5 negative numbers)
      prose = prose.replace(/^([ \t]*-)([A-Z\u00C0-\u017F"“'\*])/gm, (full, dash, ch) => {
        fixes.listsAndTables++;
        return `${dash} ${ch}`;
      });

      // Repair pipe tables
      prose = healMarkdownTables(prose, fixes);
    }

    // Step 9: Literary / Novel Smart Typography (strictly outside code/URLs/math)
    if (rules.fixTypography) {
      // Em-dash: " -- " or "word--word" (never touches "---" horizontal rules)
      prose = prose.replace(/([^\-\n])--([^\-\n])/g, (full, a, b) => {
        if (a === '!' || b === '>') return full; // HTML comment guard
        fixes.typography++;
        return `${a}—${b}`;
      });
      // Ellipsis ... -> …
      prose = prose.replace(/(?<!\.)\.{3}(?!\.)/g, () => {
        fixes.typography++;
        return '…';
      });
      // Smart double quotes around prose phrases
      prose = prose.replace(/(^|[\s(\[—])"([^"\n]+?)"(?=$|[\s.,;:!?)\]—])/gm, (_, pre, inner) => {
        fixes.typography++;
        return `${pre}“${inner}”`;
      });
      // Smart apostrophe inside words (don't, Jum'at)
      prose = prose.replace(/([A-Za-z\u00C0-\u024F])'([A-Za-z\u00C0-\u024F])/g, (_, a, b) => {
        fixes.typography++;
        return `${a}’${b}`;
      });
    }

    // Step 10: Dialogue Paragraph Pacing (Fanfiction / Light Novel QoL)
    if (rules.fixDialogue) {
      // Separate consecutive lines where a line ends/starts with spoken dialogue quotes
      prose = prose.replace(/([”"!?.,]\s*)\n([“"][^\n]+)/g, (_, endPart, nextLine) => {
        fixes.dialogue++;
        return `${endPart}\n\n${nextLine}`;
      });
      prose = prose.replace(/([^\n]*[”"])\n([^\n\s#>|*\-])/g, (full, prevLine, nextChar) => {
        if (/^[“"]/.test(prevLine.trim())) {
          fixes.dialogue++;
          return `${prevLine}\n\n${nextChar}`;
        }
        return full;
      });
    }

    // Step 11: Spacing & Paragraph Hygiene
    if (rules.fixSpacing) {
      // Collapse 3+ blank lines down to 2 newlines (1 blank line)
      const multiBlank = prose.match(/\n{3,}/g);
      if (multiBlank) {
        fixes.spacing += multiBlank.length;
        prose = prose.replace(/\n{3,}/g, '\n\n');
      }
      // Trim trailing whitespace (preserving intentional Markdown 2-space line breaks)
      prose = prose.replace(/[ \t]{3,}$/gm, () => {
        fixes.spacing++;
        return '';
      });
    }

    // Step 12: Restore Inline Tokens & Fenced Code Blocks intact
    let fixed = inlineProt.restore(prose);
    for (let i = 0; i < codePass.codeBlocks.length; i++) {
      fixed = fixed.split(`@@CODEBLOCK_${i}@@`).join(codePass.codeBlocks[i].renderedFence);
    }

    // Clean leading/trailing excess blank lines cleanly
    fixed = fixed.replace(/^\n+/, '').replace(/\n+$/, '');

    // Extract headings & compute document statistics
    const headings = extractHeadings(fixed);
    const truncation = detectTruncation(raw, fixed, codePass.hadUnclosedFence, codePass.unclosedLang);
    const stats = computeStats(fixed, codePass.codeBlocks, headings);
    const fixDetails = buildFixDetails(fixes, truncation);
    const totalFixes = Object.values(fixes).reduce((a, b) => a + b, 0);

    return {
      raw,
      fixed,
      fixes,
      fixDetails,
      totalFixes,
      truncation,
      stats,
      codeBlocks: codePass.codeBlocks,
      headings
    };
  }

  function buildEmptyResult(raw) {
    return {
      raw,
      fixed: '',
      fixes: {},
      fixDetails: [],
      totalFixes: 0,
      truncation: { isTruncated: false, reasons: [], contextType: 'none', unclosedLang: '' },
      stats: { words: 0, chars: 0, charsNoSpaces: 0, lines: 0, paragraphs: 0, readMinutes: 0, codeBlocksCount: 0, headingsCount: 0, dialogueCount: 0 },
      codeBlocks: [],
      headings: []
    };
  }

  /**
   * Extract headings outside fenced code blocks
   */
  function extractHeadings(markdown) {
    const lines = markdown.split('\n');
    const headings = [];
    const slugCounts = {};
    let inFence = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!inFence) {
        const fm = line.match(/^\s*(`{3,}|~{3,})/);
        if (fm) {
          inFence = { char: fm[1][0], len: fm[1].length };
          continue;
        }
        const hm = line.match(/^(#{1,4})\s+(.+?)\s*#*$/);
        if (hm) {
          const level = hm[1].length;
          const cleanText = hm[2].replace(/[*_`~]/g, '').trim();
          const baseSlug = cleanText.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F]+/g, '-').replace(/^-|-$/g, '') || 'section';
          slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
          const id = slugCounts[baseSlug] === 1 ? `h-${baseSlug}` : `h-${baseSlug}-${slugCounts[baseSlug]}`;
          headings.push({ level, text: cleanText, id, line: i + 1 });
        }
      } else {
        const closeRe = new RegExp(`^\\s*${inFence.char}{${inFence.len},}\\s*$`);
        if (closeRe.test(line)) inFence = null;
      }
    }
    return headings;
  }

  /**
   * Detect if AI output was truncated mid-code or mid-sentence
   */
  function detectTruncation(raw, fixed, hadUnclosedFence, unclosedLang) {
    const reasons = [];
    let contextType = 'none';

    if (hadUnclosedFence) {
      reasons.push(`Blok kode (${unclosedLang || 'text'}) tidak tertutup di akhir teks`);
      contextType = 'code';
    }

    const trimmed = raw.trimEnd();
    if (!trimmed) return { isTruncated: false, reasons: [], contextType: 'none', unclosedLang: '' };

    const lastLine = trimmed.split('\n').pop().trim();

    if (!hadUnclosedFence && trimmed.length > 80) {
      // Check dangling conjunctions / prepositions / mid-clause commas
      if (/[,;:\(\[\{—-]$/.test(lastLine) && !/^(-{3,}|\*{3,})$/.test(lastLine)) {
        reasons.push('Kalimat terakhir berhenti di tanda baca menggantung');
        contextType = 'prose';
      } else if (/\b(dan|atau|yang|tetapi|namun|karena|dengan|untuk|dari|pada|di|ke|and|or|but|with|that|the|of|to|in|for)$/i.test(lastLine)) {
        reasons.push('Kalimat terakhir berhenti di kata sambung');
        contextType = 'prose';
      } else if (/[A-Za-z0-9\u00C0-\u024F]$/.test(lastLine) && !/^#{1,6}\s/.test(lastLine) && !/^[-*+]\s/.test(lastLine) && !/^\d+\.\s/.test(lastLine) && !/\|$/.test(lastLine) && lastLine.length > 35) {
        reasons.push('Paragraf terakhir tidak diakhiri titik atau tanda baca penutup');
        contextType = 'prose';
      }

      // Unbalanced quotes on last paragraph
      const straightQuotes = (lastLine.match(/"/g) || []).length;
      const openCurly = (lastLine.match(/“/g) || []).length;
      const closeCurly = (lastLine.match(/”/g) || []).length;
      if (straightQuotes % 2 !== 0 || openCurly > closeCurly) {
        reasons.push('Tanda kutip dialog di akhir teks belum tertutup');
        contextType = 'prose';
      }
    }

    return {
      isTruncated: reasons.length > 0,
      reasons,
      contextType,
      unclosedLang
    };
  }

  function computeStats(fixed, codeBlocks, headings) {
    const plain = stripMarkdownToPlain(fixed);
    const words = plain.trim() ? plain.trim().split(/\s+/).length : 0;
    const chars = fixed.length;
    const charsNoSpaces = fixed.replace(/\s/g, '').length;
    const lines = fixed ? fixed.split('\n').length : 0;
    const paragraphs = fixed.trim() ? fixed.trim().split(/\n\s*\n/).length : 0;
    const readMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 210));
    const dialogueMatches = plain.match(/(?:“[^”]+”|"[^"]+")/g);

    return {
      words,
      chars,
      charsNoSpaces,
      lines,
      paragraphs,
      readMinutes,
      codeBlocksCount: codeBlocks.length,
      headingsCount: headings.length,
      dialogueCount: dialogueMatches ? dialogueMatches.length : 0
    };
  }

  function buildFixDetails(fixes, truncation) {
    const details = [];
    if (fixes.codeFences) details.push({ label: `${fixes.codeFences} Code Fence`, type: 'active-fix' });
    if (fixes.langDetected) details.push({ label: `${fixes.langDetected} Auto Lang`, type: 'info-fix' });
    if (fixes.headings) details.push({ label: `${fixes.headings} Heading`, type: 'active-fix' });
    if (fixes.emphasis) details.push({ label: `${fixes.emphasis} Bold/Italic`, type: 'active-fix' });
    if (fixes.listsAndTables) details.push({ label: `${fixes.listsAndTables} List/Tabel`, type: 'active-fix' });
    if (fixes.math) details.push({ label: `${fixes.math} Math`, type: 'info-fix' });
    if (fixes.artifacts) details.push({ label: `${fixes.artifacts} Artifact`, type: 'active-fix' });
    if (fixes.jsonUnescaped) details.push({ label: `JSON Unescaped`, type: 'info-fix' });
    if (fixes.typography) details.push({ label: `${fixes.typography} Tipografi`, type: 'info-fix' });
    if (fixes.dialogue) details.push({ label: `${fixes.dialogue} Dialog`, type: 'info-fix' });
    if (fixes.spacing) details.push({ label: `${fixes.spacing} Spasi`, type: 'active-fix' });
    if (fixes.citations) details.push({ label: `${fixes.citations} Sitasi`, type: 'info-fix' });
    if (fixes.chatter) details.push({ label: `Chatter Bersih`, type: 'info-fix' });
    if (truncation.isTruncated) details.push({ label: `Terpotong!`, type: 'warn-fix' });
    return details;
  }

  /**
   * Strip Markdown syntax into clean readable plain text
   */
  function stripMarkdownToPlain(md) {
    if (!md) return '';
    return md
      .replace(/^```[\w-]*\n?|^```$/gm, '')
      .replace(/^~~~[\w-]*\n?|^~~~$/gm, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/==(.*?)==/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^>\s?(?:\[![A-Z]+\]\s*)?/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Smart Stitch Append: merges Part 2 AI response seamlessly onto Part 1,
   * automatically removing repeated overlap lines or redundant code fence openings!
   */
  function smartStitchAppend(existingText, newChunk) {
    const a = (existingText || '').replace(/\r\n/g, '\n').trimEnd();
    let b = (newChunk || '').replace(/\r\n/g, '\n').trimStart();
    if (!a) return { text: b, overlapRemoved: 0, message: 'Teks baru ditempelkan.' };
    if (!b) return { text: a, overlapRemoved: 0, message: 'Clipboard kosong.' };

    // Remove common continuation chatter from Part 2 start ("Tentu, ini lanjutannya:")
    b = b.replace(/^(?:(?:Tentu|Baik|Berikut lanjutannya|Here is the continuation|Continuing from)[^\n]{0,90}[:.]\s*\n+)/i, '');

    // Check if Part 1 ended inside an unclosed code fence and Part 2 starts with a redundant opening fence
    const aFences = (a.match(/^\s*```/gm) || []).length;
    if (aFences % 2 === 1 && /^\s*```[\w-]*\n/.test(b)) {
      b = b.replace(/^\s*```[\w-]*\n/, '');
    }

    const linesA = a.split('\n');
    const linesB = b.split('\n');

    // Look for overlapping tail of A matching head of B (up to 12 lines)
    const maxCheck = Math.min(12, linesA.length, linesB.length);
    let overlapLines = 0;

    for (let k = maxCheck; k >= 1; k--) {
      let match = true;
      for (let j = 0; j < k; j++) {
        if (linesA[linesA.length - k + j].trim() !== linesB[j].trim()) {
          match = false;
          break;
        }
      }
      if (match) {
        overlapLines = k;
        break;
      }
    }

    if (overlapLines > 0) {
      const merged = linesA.concat(linesB.slice(overlapLines)).join('\n');
      return {
        text: merged,
        overlapRemoved: overlapLines,
        message: `Disambungkan! ${overlapLines} baris tumpang-tindih otomatis dihapus.`
      };
    }

    // Check partial single-line phrase overlap (last 35 chars of A appearing at start of B)
    const lastLineA = linesA[linesA.length - 1];
    const firstLineB = linesB[0];
    if (lastLineA.length > 12 && firstLineB.startsWith(lastLineA.trim())) {
      const restFirst = firstLineB.slice(lastLineA.trim().length);
      linesB[0] = restFirst;
      const merged = a + linesB.join('\n');
      return {
        text: merged,
        overlapRemoved: 1,
        message: 'Disambungkan! Kalimat sambungan duplikat dibersihkan.'
      };
    }

    // Decide joiner: newline if code/list, double newline if prose ends with punctuation
    const joiner = (aFences % 2 === 1 || /[,;:\-—]$/.test(lastLineA.trim())) ? '\n' : '\n\n';
    return {
      text: a + joiner + b,
      overlapRemoved: 0,
      message: 'Bagian lanjutan berhasil disambungkan.'
    };
  }

  /**
   * Generate smart continuation prompt for Google AI Studio
   */
  function generateContinuationPrompt(fixedText, truncationInfo, opts) {
    const options = Object.assign({ lang: 'id', style: 'auto', tailLines: 5 }, opts || {});
    const lines = (fixedText || '').trimEnd().split('\n');
    const nonEmpty = lines.filter(l => l.trim() !== '');
    // Ignore auto-closed fence line at very end if truncation was code
    let sliceSource = nonEmpty;
    if (truncationInfo && truncationInfo.contextType === 'code' && sliceSource[sliceSource.length - 1] === '```') {
      sliceSource = sliceSource.slice(0, -1);
    }
    const tail = sliceSource.slice(-options.tailLines).join('\n');
    const isCode = options.style === 'code' || (options.style === 'auto' && truncationInfo && truncationInfo.contextType === 'code');

    if (options.lang === 'en') {
      if (isCode) {
        return [
          `Your previous response was cut off inside a ${truncationInfo && truncationInfo.unclosedLang ? truncationInfo.unclosedLang : 'code'} block.`,
          `Continue strictly from the exact line below without repeating previous code, without introductory chatter, and preserving indentation:`,
          ``,
          `--- LAST LINES ---`,
          tail,
          `--- CONTINUE IMMEDIATELY AFTER THIS ---`
        ].join('\n');
      }
      return [
        `Your previous response stopped before finishing.`,
        `Please continue seamlessly right from the exact last sentence/word below. Do NOT repeat prior paragraphs, do NOT add greetings, and keep the exact same tone and formatting:`,
        ``,
        `--- LAST TEXT ---`,
        tail,
        `--- CONTINUE IMMEDIATELY ---`
      ].join('\n');
    }

    if (isCode) {
      return [
        `Respons kamu sebelumnya terpotong di tengah blok kode (${truncationInfo && truncationInfo.unclosedLang ? truncationInfo.unclosedLang : 'kode'}).`,
        `Lanjutkan TEPAT dari baris terakhir di bawah ini tanpa mengulang kode sebelumnya, tanpa kata pengantar, dan pertahankan indentasi aslinya:`,
        ``,
        `--- BARIS TERAKHIR ---`,
        tail,
        `--- LANJUTKAN LANGSUNG SETELAH INI ---`
      ].join('\n');
    }

    return [
      `Respons kamu sebelumnya terpotong sebelum selesai.`,
      `Tolong lanjutkan secara mulus TEPAT dari kalimat/kata terakhir di bawah ini. JANGAN mengulang paragraf sebelumnya, JANGAN pakai basa-basi pembuka, dan pertahankan gaya bahasa serta format yang sama persis:`,
      ``,
      `--- TEKS TERAKHIR ---`,
      tail,
      `--- LANJUTKAN LANGSUNG ---`
    ].join('\n');
  }

  /**
   * Performance-safe Line Diff (LCS DP with automatic fast fallback for giant documents)
   */
  function computeLineDiff(rawText, fixedText) {
    const a = (rawText || '').replace(/\r\n/g, '\n').split('\n');
    const b = (fixedText || '').replace(/\r\n/g, '\n').split('\n');

    if (rawText === fixedText) {
      return {
        lines: b.map((t, idx) => ({ type: 'eq', text: t, oldLine: idx + 1, newLine: idx + 1 })),
        added: 0,
        removed: 0,
        unchanged: b.length
      };
    }

    // Fast greedy sync fallback if matrix would exceed safe RAM/CPU threshold
    if (a.length * b.length > 350000) {
      return computeFastLineDiff(a, b);
    }

    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        if (a[i] === b[j]) {
          dp[i][j] = dp[i + 1][j + 1] + 1;
        } else {
          dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
        }
      }
    }

    const lines = [];
    let i = 0, j = 0, added = 0, removed = 0, unchanged = 0;

    while (i < m && j < n) {
      if (a[i] === b[j]) {
        lines.push({ type: 'eq', text: a[i], oldLine: i + 1, newLine: j + 1 });
        unchanged++;
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        lines.push({ type: 'rem', text: a[i], oldLine: i + 1, newLine: null });
        removed++;
        i++;
      } else {
        lines.push({ type: 'add', text: b[j], oldLine: null, newLine: j + 1 });
        added++;
        j++;
      }
    }
    while (i < m) {
      lines.push({ type: 'rem', text: a[i], oldLine: i + 1, newLine: null });
      removed++;
      i++;
    }
    while (j < n) {
      lines.push({ type: 'add', text: b[j], oldLine: null, newLine: j + 1 });
      added++;
      j++;
    }

    return { lines, added, removed, unchanged };
  }

  function computeFastLineDiff(a, b) {
    const lines = [];
    let i = 0, j = 0, added = 0, removed = 0, unchanged = 0;
    const lookahead = 25;

    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        lines.push({ type: 'eq', text: a[i], oldLine: i + 1, newLine: j + 1 });
        unchanged++;
        i++; j++;
        continue;
      }
      let foundA = -1, foundB = -1;
      for (let k = 1; k <= lookahead; k++) {
        if (i + k < a.length && a[i + k] === b[j]) { foundA = k; break; }
        if (j + k < b.length && a[i] === b[j + k]) { foundB = k; break; }
      }
      if (foundA !== -1) {
        for (let t = 0; t < foundA; t++) {
          lines.push({ type: 'rem', text: a[i], oldLine: i + 1, newLine: null });
          removed++; i++;
        }
      } else if (foundB !== -1) {
        for (let t = 0; t < foundB; t++) {
          lines.push({ type: 'add', text: b[j], oldLine: null, newLine: j + 1 });
          added++; j++;
        }
      } else {
        lines.push({ type: 'rem', text: a[i], oldLine: i + 1, newLine: null });
        lines.push({ type: 'add', text: b[j], oldLine: null, newLine: j + 1 });
        removed++; added++; i++; j++;
      }
    }
    while (i < a.length) { lines.push({ type: 'rem', text: a[i], oldLine: i + 1, newLine: null }); removed++; i++; }
    while (j < b.length) { lines.push({ type: 'add', text: b[j], oldLine: null, newLine: j + 1 }); added++; j++; }
    return { lines, added, removed, unchanged };
  }

  /**
   * Built-in rich samples for instant testing
   */
  function getSampleText(type) {
    if (type === 'coding') {
      return `# Full-Stack Widget Demo\n\n> [!TIP]\n> Klik tombol **Live Preview** pada blok HTML di bawah (atau buka tab **Code View**) untuk menjalankan kode secara langsung di dalam sandbox!\n\n**card.html**\n\`\`\`html\n<!DOCTYPE html>\n<html lang="id">\n<head>\n  <style>\n    body { font-family: system-ui; background: #0f172a; color: #f8fafc; display: grid; place-items: center; min-height: 92vh; margin: 0; }\n    .card { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; padding: 24px 28px; border-radius: 14px; text-align: center; box-shadow: 0 12px 30px rgba(0,0,0,.4); }\n    button { background: #3b82f6; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 12px; }\n    button:hover { background: #2563eb; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h2>AI Studio Live Widget</h2>\n    <p>Klik tombol di bawah untuk menguji interaksi JavaScript:</p>\n    <button id="btn">Klik: 0</button>\n  </div>\n  <script>\n    let count = 0;\n    document.getElementById('btn').onclick = (e) => { count++; e.target.textContent = 'Klik: ' + count; };\n  </script>\n</body>\n</html>\n\`\`\`\n\n##Backend API (Auto-Deteksi Bahasa & Unclosed Fence)\n\`\`\`\n# api_server.py\nfrom fastapi import FastAPI\n\napp = FastAPI(title="AI Fixer API")\n\n@app.get("/health")\ndef check_health():\n    return {"status": "ok", "protected": True}\n\ndef process_batch(items: list[str]):\n    results = []\n    for item in items:\n        results.append(item.strip())`;
    }

    if (type === 'fanfic') {
      return `# Langit di Atas Stasiun Terakhir\n\n##Bab 1: Hujan di Peron Tiga\n\nLampu peron berkedip pelan ketika kereta malam terakhir melambat di bawah gerimis tipis. Udara membawa aroma tanah basah dan kopi hitam dari kios kecil di ujung stasiun.\n"Kau benar-benar akan pergi malam ini?" tanya Raka dengan suara nyaris tenggelam oleh deru rem besi.\n"Kalau aku tidak naik sekarang, aku tidak akan pernah berani pergi," jawab Sena pelan sambil menggenggam tiket kertas yang mulai lembap.\nRaka terdiam sejenak--matanya menatap jauh ke ujung rel yang menghilang ditelan kabut.\n"Setidaknya bawa payung ini..." katanya seraya menyodorkan payung lipat berwarna biru tua.\n\n***\n\n##Bab 2: Surat di Dalam Mantel\n\nKereta mulai melaju meninggalkan lampu-lampu kota yang meredup satu per satu. Di dalam gerbong yang hampir kosong, Sena merogoh saku mantelnya dan menemukan sepucuk amplop terlipat rapi.\n\n> *"Jangan pernah takut memulai ulang. Beberapa cerita baru benar-benar dimulai tepat di halaman yang kita kira adalah akhir."*\n\nDi luar jendela, awan perlahan pecah dan menampakkan sabit bulan pucat. Untuk pertama kalinya setelah berbulan-bulan, napas Sena terasa jauh lebih ringan.\n\n***\n\n##Bab 3: Fajar di Kota Pelabuhan\n\nKetika pengeras suara mengumumkan pemberhentian terakhir, langit timur sudah berubah menjadi jingga keemasan. Sena berdiri, menarik napas dalam-dalam, lalu melangkah keluar menuju angin laut yang hangat dan penuh kemungkinan baru.`;
    }

    // Default: Mixed broken Google AI Studio output
    return `##Ringkasan Analisis AI Studio\u200B\n**Catatan Penting:**Output ini sengaja berisi berbagai ** kerusakan umum ** dari Google AI Studio untuk menunjukkan kemampuan ****Auto-Heal**** tanpa merusak format kode.\n\n> [!IMPORTANT]\n> Semua blok kode dilindungi secara terpisah oleh *Tokenized Isolation Pipeline* sehingga indentasi, tanda kutip, dan simbol `#` di dalam kode **tidak akan pernah rusak**.\n\n• Perbaikan heading tanpa spasi\n• Perbaikan bullet Unicode & list rapat\n1.Item pertama tanpa spasi\n2.Item kedua yang rapi\n\n###Perbandingan Performa (Tabel Tanpa Baris Pemisah)\n| Fitur | Sebelum | Sesudah |\n| Code Fence | Terpotong & Tanpa Bahasa | Auto-Close & Auto-Detect |\n| LaTeX Math | \\(E = mc^2\\) mentah | Dirender Rapi |\n\n###Rumus Fisika & Matematika\nPersamaan kuadratik ditulis sebagai \\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\] dan energi foton \\(E = h\\nu\\).\n\n###Contoh Kode (Bahasa Tidak Dilabeli & Fence Tidak Tertutup)\n\`\`\`\n// analyzer.js\nasync function fetchMetrics(endpoint) {\n  const response = await fetch(endpoint);\n  if (!response.ok) {\n    throw new Error("HTTP error: " + response.status);\n  }\n  const data = await response.json();\n  return data.items.filter(item => item.score >= 0.85`;
  }

  global.OutputParser = {
    DEFAULT_RULES,
    RULE_METADATA,
    PRESETS,
    parseAndFix,
    detectLanguage,
    extractFilename,
    stripMarkdownToPlain,
    smartStitchAppend,
    generateContinuationPrompt,
    computeLineDiff,
    getSampleText
  };
})(window);