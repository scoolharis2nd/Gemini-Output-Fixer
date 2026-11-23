/* =========================================================
   PARSER, AUTO-HEAL ENGINE, DIFF, STITCHER & PURE-JS ZIP
   100% Offline, Zero Dependencies
   ========================================================= */
(function (global) {
  "use strict";

  const RULE_DEFINITIONS = [
    {
      id: "unescapeJson",
      label: "Unescape JSON String (\\n, \\\")",
      desc: "Memulihkan teks yang terjebak literal \\n dan \\\" dari raw JSON/API.",
      default: true
    },
    {
      id: "cleanArtifacts",
      label: "Bersihkan Invisible & Citation Artifacts",
      desc: "Hapus BOM, zero-width space, CR/LF campuran, dan tag cite aneh.",
      default: true
    },
    {
      id: "thinkingBlocks",
      label: "Rapikan AI Thinking / Reasoning Block",
      desc: "Ubah <thought>/<thinking> menjadi blok lipat rapi.",
      default: true
    },
    {
      id: "fixCodeFences",
      label: "Perbaiki & Tutup Code Fence + Auto-Lang",
      desc: "Tutup ``` yang terpotong, rapikan indentasi fence, & deteksi bahasa otomatis.",
      default: true
    },
    {
      id: "fixHeadings",
      label: "Perbaiki Heading (###Judul → ### Judul)",
      desc: "Tambahkan spasi setelah tanda # serta baris kosong yang rapi.",
      default: true
    },
    {
      id: "fixLists",
      label: "Perbaiki List & Bullet (• / -Item)",
      desc: "Normalisasi bullet Unicode & tambahkan spasi setelah - atau 1.",
      default: true
    },
    {
      id: "fixInlineMd",
      label: "Perbaiki Bold/Italic Rusak & Escape",
      desc: "Hapus spasi dalam ** teks **, tutup ** gantung, & unescape \\* di prosa.",
      default: true
    },
    {
      id: "fixTables",
      label: "Perbaiki Tabel Markdown",
      desc: "Lengkapi pipa luar |, rapikan baris pemisah ---, & samakan kolom.",
      default: true
    },
    {
      id: "fixMath",
      label: "Normalisasi LaTeX Math (\\[ \\] → $$)",
      desc: "Konversi \\[...\\] & \\(...\\) agar rumus tampil rapi di Preview/Book.",
      default: true
    },
    {
      id: "normalizeSpacing",
      label: "Rapikan Baris Kosong Berlebih",
      desc: "Ubah 3+ baris kosong berturut-turut menjadi 1 jarak paragraf bersih.",
      default: true
    },
    {
      id: "storyPolish",
      label: "Poles Novel / Fanfiksi (Scene Break & Dash)",
      desc: "Standarkan * * * / --- sebagai scene break & ubah -- menjadi em-dash (—).",
      default: false
    },
    {
      id: "stripAiFiller",
      label: "Hapus Basa-basi AI (Pembuka & Penutup)",
      desc: "Hapus kalimat seperti 'Tentu! Berikut adalah...' atau 'Semoga membantu!'.",
      default: false
    }
  ];

  function getDefaultRules() {
    const map = {};
    RULE_DEFINITIONS.forEach(function (r) { map[r.id] = r.default; });
    return map;
  }

  /* ---------------------------------------------------------
     1. Language Auto-Detection & Filename Inference
     --------------------------------------------------------- */
  const LANG_EXTENSIONS = {
    javascript: "js", js: "js", jsx: "jsx", typescript: "ts", ts: "ts", tsx: "tsx",
    python: "py", py: "py", html: "html", xml: "xml", svg: "svg", css: "css",
    scss: "scss", json: "json", bash: "sh", sh: "sh", shell: "sh", powershell: "ps1",
    sql: "sql", java: "java", c: "c", cpp: "cpp", csharp: "cs", cs: "cs",
    go: "go", rust: "rs", rs: "rs", php: "php", ruby: "rb", yaml: "yml", yml: "yml",
    markdown: "md", md: "md", diff: "diff", text: "txt", plaintext: "txt"
  };

  function normalizeLang(lang) {
    if (!lang) return "";
    const l = lang.trim().toLowerCase().replace(/^language-/, "");
    const alias = {
      js: "javascript", mjs: "javascript", cjs: "javascript",
      ts: "typescript", py: "python", py3: "python",
      sh: "bash", zsh: "bash", shell: "bash",
      htm: "html", yml: "yaml", "c++": "cpp", "c#": "csharp",
      rs: "rust", md: "markdown", txt: "plaintext"
    };
    return alias[l] || l;
  }

  function detectLanguage(code) {
    const trimmed = (code || "").trim();
    if (!trimmed) return "plaintext";

    // JSON check
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        JSON.parse(trimmed);
        return "json";
      } catch (_) {}
    }

    // SVG / HTML / XML
    if (/^<svg[\s>]/i.test(trimmed)) return "svg";
    if (/<!DOCTYPE\s+html|<html[\s>]|<head[\s>]|<body[\s>]|<(div|section|main|header|footer|script|style|form|button|input)\b/i.test(trimmed)) {
      return "html";
    }
    if (/^<\?xml\b/i.test(trimmed)) return "xml";

    // PHP
    if (/<\?php\b/.test(trimmed)) return "php";

    // SQL
    if (/^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|WITH\s+\w+\s+AS)\b/im.test(trimmed) && /\b(FROM|VALUES|SET|WHERE|JOIN|PRIMARY\s+KEY)\b/i.test(trimmed)) {
      return "sql";
    }

    // CSS
    if (/(^|\n)\s*([.#@]?[\w-:[\]="']+\s*\{[^}]*:\s*[^}]+\})/.test(trimmed) && !/\b(function|const|let|var|class|def|import|return)\b/.test(trimmed)) {
      return "css";
    }

    // Python
    if (/(^|\n)\s*(def\s+\w+\s*\(|class\s+\w+.*:|from\s+[\w.]+\s+import\s+|import\s+\w+|if\s+__name__\s*==\s*['"]__main__['"])/.test(trimmed)) {
      return "python";
    }

    // Rust
    if (/\bfn\s+\w+\s*\(.*\)\s*(->|\{)/.test(trimmed) && /\b(let\s+mut|println!|impl\s+|match\s+|pub\s+fn|struct\s+)\b/.test(trimmed)) {
      return "rust";
    }

    // Go
    if (/^\s*package\s+\w+/m.test(trimmed) && /\bfunc\s+/.test(trimmed)) {
      return "go";
    }

    // Java / C# / C++
    if (/\bpublic\s+static\s+void\s+main\b|\bSystem\.out\.println\b/.test(trimmed)) return "java";
    if (/#include\s*<[\w.\/]+>/.test(trimmed)) return "cpp";
    if (/\busing\s+System;|\bnamespace\s+\w+/.test(trimmed)) return "csharp";

    // TypeScript vs JavaScript
    if (/\b(interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|void|any|unknown)\b)/.test(trimmed) && /\b(const|let|function|export|import|=>)\b/.test(trimmed)) {
      return "typescript";
    }
    if (/\b(const|let|var|function|async|await|document\.|window\.|console\.log|export\s+default|addEventListener)\b|=>/.test(trimmed)) {
      return "javascript";
    }

    // Bash / Shell
    if (/^#!\/bin\/(ba)?sh/m.test(trimmed) || /(^|\n)\s*(\$\s+)?(npm|npx|yarn|pnpm|git|pip|python|docker|curl|cd|mkdir|chmod|sudo|apt|brew)\s+/.test(trimmed)) {
      return "bash";
    }

    // YAML
    if (/^[\w-]+:\s*(\S.*)?$/m.test(trimmed) && !trimmed.includes("{") && !trimmed.includes(";")) {
      const yamlLines = trimmed.split("\n").filter(function (l) { return /^\s*([\w-]+:\s*|- )/.test(l); }).length;
      if (yamlLines >= 3 && yamlLines >= trimmed.split("\n").length * 0.6) return "yaml";
    }

    return "plaintext";
  }

  function inferFilename(code, prevContextLine, lang, index) {
    // 1. Check first 2 lines of code for filename comments
    const firstLines = (code || "").split("\n").slice(0, 2);
    for (let i = 0; i < firstLines.length; i++) {
      const line = firstLines[i].trim();
      const m = line.match(/^(?:\/\/|#|\/\*|<!--|--)\s*(?:file(?:name)?\s*[:=]\s*|START OF FILE\s+)?([\w./-]+\.[a-zA-Z0-9]{1,8})\b/i);
      if (m) return m[1];
    }

    // 2. Check preceding markdown heading / bold / START OF FILE line
    if (prevContextLine) {
      const cleanPrev = prevContextLine.trim();
      const m2 = cleanPrev.match(/(?:`|\*\*|#{1,6}\s*|START OF FILE\s+)([\w./-]+\.[a-zA-Z0-9]{1,8})(?:`|\*\*|\s*---|$)/i);
      if (m2) return m2[1];
      const m3 = cleanPrev.match(/\b([\w-]+\.(?:html|css|js|jsx|ts|tsx|py|json|md|sql|sh|yml|yaml|svg|php|java|cpp|c|go|rs|txt))\b/i);
      if (m3) return m3[1];
    }

    const ext = LANG_EXTENSIONS[normalizeLang(lang)] || "txt";
    return "snippet-" + String(index + 1).padStart(2, "0") + "." + ext;
  }

  /* ---------------------------------------------------------
     2. Segmenter: Protect Fenced Code Blocks During Prose Fixes
     --------------------------------------------------------- */
  function splitByCodeFences(text) {
    const lines = text.split("\n");
    const segments = [];
    let buffer = [];
    let inFence = false;
    let fenceChar = "";
    let fenceLen = 0;

    function flush(type) {
      if (buffer.length > 0) {
        segments.push({ type: type, text: buffer.join("\n") });
        buffer = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!inFence) {
        const openMatch = line.match(/^[ \t]{0,3}(`{3,}|~{3,})(.*)$/);
        if (openMatch) {
          flush("prose");
          inFence = true;
          fenceChar = openMatch[1][0];
          fenceLen = openMatch[1].length;
          buffer.push(line);
          continue;
        }
        buffer.push(line);
      } else {
        buffer.push(line);
        const closeRe = new RegExp("^[ \\t]{0,3}" + fenceChar + "{" + fenceLen + ",}[ \\t]*$");
        if (closeRe.test(line)) {
          flush("code");
          inFence = false;
          fenceChar = "";
          fenceLen = 0;
        }
      }
    }

    flush(inFence ? "code" : "prose");
    return segments;
  }

  /* ---------------------------------------------------------
     3. Main Auto-Heal Engine
     --------------------------------------------------------- */
  function autoFix(rawText, userRules) {
    const rules = Object.assign(getDefaultRules(), userRules || {});
    const fixes = {
      unescapedJson: 0,
      artifactsCleaned: 0,
      thinkingFormatted: 0,
      fencesFixed: 0,
      langsDetected: 0,
      headingsFixed: 0,
      listsFixed: 0,
      inlineFixed: 0,
      tablesFixed: 0,
      mathFixed: 0,
      spacingFixed: 0,
      storyPolished: 0,
      fillerStripped: 0
    };

    if (!rawText || !rawText.trim()) {
      return {
        fixed: "",
        fixes: fixes,
        totalFixes: 0,
        diagnostics: [],
        truncated: false,
        truncationReason: "",
        stats: computeStats("")
      };
    }

    let text = String(rawText);

    // Normalize line endings first
    const hadCrlf = /\r/.test(text);
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (hadCrlf && rules.cleanArtifacts) fixes.artifactsCleaned++;

    // Rule 1: Unescape JSON-escaped strings (only when clearly escaped!)
    if (rules.unescapeJson) {
      const literalNewlines = (text.match(/\\n/g) || []).length;
      const realNewlines = (text.match(/\n/g) || []).length;
      const trimmed = text.trim();
      const wrappedInQuotes = trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2;

      if (wrappedInQuotes && literalNewlines >= 1 && realNewlines === 0) {
        try {
          const parsed = JSON.parse(trimmed);
          if (typeof parsed === "string") {
            text = parsed;
            fixes.unescapedJson++;
          }
        } catch (_) {}
      } else if (literalNewlines >= 3 && realNewlines <= 2) {
        text = text
          .replace(/\\r\\n/g, "\n")
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"');
        fixes.unescapedJson++;
      }
    }

    // Rule 2: Clean invisible characters & Gemini artifacts
    if (rules.cleanArtifacts) {
      const before = text;
      text = text
        .replace(/^\uFEFF/, "")
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
        .replace(/\u00A0/g, " ")
        .replace(/\[cite:\s*[\d,\s]+\]/gi, "")
        .replace(/<ctrl\d+>/gi, "");
      if (text !== before) fixes.artifactsCleaned++;
    }

    // Rule 3: Thinking / Reasoning blocks (<thought>...</thought> or <thinking>...)
    if (rules.thinkingBlocks) {
      text = text.replace(/<(thought|thinking)>([\s\S]*?)<\/\1>/gi, function (_, _tag, inner) {
        fixes.thinkingFormatted++;
        return "\n:::thought\n" + inner.trim() + "\n:::\n";
      });
      // Handle unclosed <thought> at start if AI forgot closing tag before a heading
      if (/<(thought|thinking)>/i.test(text) && !/<\/(thought|thinking)>/i.test(text)) {
        text = text.replace(/<(thought|thinking)>([\s\S]*)/i, function (_, _tag, inner) {
          fixes.thinkingFormatted++;
          return ":::thought\n" + inner.trim() + "\n:::";
        });
      }
    }

    // Rule 4: Strip AI Conversational Filler (optional)
    if (rules.stripAiFiller) {
      const leadPatterns = [
        /^(?:Sure|Certainly|Of course|Absolutely|Here(?:'s| is)|Great question|Tentu(?: saja)?|Baik(?:lah)?|Berikut(?: adalah| ini)?)[^.\n!?:]{0,120}[.!:?]\s*\n+/i
      ];
      for (let p = 0; p < leadPatterns.length; p++) {
        if (leadPatterns[p].test(text)) {
          text = text.replace(leadPatterns[p], "");
          fixes.fillerStripped++;
        }
      }
      const trailPattern = /\n+(?:Hope this helps|Let me know if you (?:need|have|want)|Feel free to ask|Semoga membantu|Jika ada pertanyaan|Beri tahu saya jika)[^\n]{0,160}[.!?]?\s*$/i;
      if (trailPattern.test(text)) {
        text = text.replace(trailPattern, "");
        fixes.fillerStripped++;
      }
    }

    // Rule 5: Repair & Normalize Code Fences (line-by-line state machine)
    if (rules.fixCodeFences) {
      const lines = text.split("\n");
      const out = [];
      let inFence = false;
      let fenceOpenIdx = -1;
      let fenceLang = "";
      let fenceLines = [];

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (!inFence) {
          // Case A: Inline code fence glued to code on same line: ```js const x = 1;
          const glued = line.match(/^[ \t]*(`{3,})([a-zA-Z0-9_+#.-]+)?[ \t]+(.+)$/);
          if (glued && !glued[3].includes("```")) {
            const langToken = glued[2] || "";
            const restCode = glued[3];
            // Ensure previous line is blank if needed
            if (out.length > 0 && out[out.length - 1].trim() !== "") out.push("");
            fenceOpenIdx = out.length;
            fenceLang = normalizeLang(langToken);
            out.push("```" + fenceLang);
            out.push(restCode);
            fenceLines = [restCode];
            inFence = true;
            fixes.fencesFixed++;
            continue;
          }

          // Case B: Normal or overly-indented opening fence
          const openMatch = line.match(/^([ \t]*)(`{3,}|~{3,})\s*([a-zA-Z0-9_+#.-]*)\s*$/);
          if (openMatch) {
            const indent = openMatch[1];
            const ticks = openMatch[2];
            const rawLang = openMatch[3] || "";
            if (indent.length > 3 || ticks.length > 3 || ticks[0] === "~") {
              fixes.fencesFixed++;
            }
            if (out.length > 0 && out[out.length - 1].trim() !== "") {
              out.push("");
            }
            fenceOpenIdx = out.length;
            fenceLang = normalizeLang(rawLang);
            out.push("```" + fenceLang);
            fenceLines = [];
            inFence = true;
            continue;
          }

          out.push(line);
        } else {
          // Closing fence check
          const closeMatch = line.match(/^([ \t]*)(`{3,}|~{3,})\s*$/);
          if (closeMatch) {
            if (closeMatch[1].length > 3 || closeMatch[2].length > 3 || closeMatch[2][0] === "~") {
              fixes.fencesFixed++;
            }
            // Auto-detect language if missing
            if (!fenceLang && fenceLines.length > 0) {
              const detected = detectLanguage(fenceLines.join("\n"));
              if (detected && detected !== "plaintext") {
                out[fenceOpenIdx] = "```" + detected;
                fixes.langsDetected++;
              }
            }
            out.push("```");
            inFence = false;
            fenceOpenIdx = -1;
            fenceLang = "";
            fenceLines = [];
            continue;
          }

          // Case: Closing ``` glued to end of last code line: return true;```
          const gluedClose = line.match(/^(.+?)`{3,}\s*$/);
          if (gluedClose && !gluedClose[1].includes("```")) {
            out.push(gluedClose[1]);
            fenceLines.push(gluedClose[1]);
            if (!fenceLang) {
              const detected = detectLanguage(fenceLines.join("\n"));
              if (detected && detected !== "plaintext") {
                out[fenceOpenIdx] = "```" + detected;
                fixes.langsDetected++;
              }
            }
            out.push("```");
            fixes.fencesFixed++;
            inFence = false;
            fenceOpenIdx = -1;
            fenceLang = "";
            fenceLines = [];
            continue;
          }

          out.push(line);
          fenceLines.push(line);
        }
      }

      // Auto-close unclosed code fence at EOF!
      if (inFence) {
        if (!fenceLang && fenceLines.length > 0) {
          const detected = detectLanguage(fenceLines.join("\n"));
          if (detected && detected !== "plaintext") {
            out[fenceOpenIdx] = "```" + detected;
            fixes.langsDetected++;
          }
        }
        out.push("```");
        fixes.fencesFixed++;
      }

      text = out.join("\n");
    }

    // Now split text into PROSE vs CODE segments so prose fixes NEVER touch code blocks!
    const segments = splitByCodeFences(text);

    for (let s = 0; s < segments.length; s++) {
      if (segments[s].type !== "prose") continue;
      let seg = segments[s].text;

      // Rule 6: Repair LaTeX Math delimiters (\[ \] -> $$, \( \) -> $)
      if (rules.fixMath) {
        const beforeMath = seg;
        seg = seg.replace(/\\\[([\s\S]*?)\\\]/g, function (_, expr) {
          return "\n$$\n" + expr.trim() + "\n$$\n";
        });
        seg = seg.replace(/\\\((.+?)\\\)/g, function (_, expr) {
          return "$" + expr.trim() + "$";
        });
        if (seg !== beforeMath) fixes.mathFixed++;
      }

      // Rule 7: Repair Headings (###Title -> ### Title)
      if (rules.fixHeadings) {
        seg = seg.replace(/^([ \t]*)(#{1,6})([^\s#].*)$/gm, function (_, _sp, hashes, title) {
          fixes.headingsFixed++;
          return hashes + " " + title.trim();
        });
      }

      // Rule 8: Repair Lists & Unicode Bullets
      if (rules.fixLists) {
        seg = seg.replace(/^([ \t]*)[•▪◦●■]\s*/gm, function (_, indent) {
          fixes.listsFixed++;
          return indent + "- ";
        });
        seg = seg.replace(/^([ \t]*)-([^\s\-].*)$/gm, function (_, indent, body) {
          if (/^-{2,}$/.test("-" + body.trim())) return indent + "-" + body;
          fixes.listsFixed++;
          return indent + "- " + body;
        });
        seg = seg.replace(/^([ \t]*)(\d+)\.([^\s\d].*)$/gm, function (_, indent, num, body) {
          fixes.listsFixed++;
          return indent + num + ". " + body;
        });
      }

      // Rule 9: Repair Markdown Tables
      if (rules.fixTables) {
        const tableRes = repairTablesInSegment(seg);
        seg = tableRes.text;
        fixes.tablesFixed += tableRes.count;
      }

      // Rule 10: Repair Inline Markdown (protect inline `code` first)
      if (rules.fixInlineMd) {
        const inlineTokens = [];
        let protectedSeg = seg.replace(/`[^`\n]+`/g, function (m) {
          inlineTokens.push(m);
          return "\uE000IC" + (inlineTokens.length - 1) + "\uE001";
        });

        // Fix stray spaces inside bold: ** text ** -> **text**
        const beforeInline = protectedSeg;
        protectedSeg = protectedSeg.replace(/\*\*[ \t]+([^*\n]+?)[ \t]+\*\*/g, "**$1**");
        // Fix escaped markdown symbols in prose: \*, \_, \# (not inside LaTeX)
        protectedSeg = protectedSeg.replace(/(^|[^\\])\\([*_#])/g, "$1$2");

        // Auto-close dangling ** within a single paragraph line
        const pLines = protectedSeg.split("\n").map(function (line) {
          if (/^\s*([-*_]\s*){3,}$/.test(line)) return line;
          const boldCount = (line.match(/\*\*/g) || []).length;
          if (boldCount % 2 === 1 && !line.trim().endsWith("**")) {
            fixes.inlineFixed++;
            return line + "**";
          }
          return line;
        });
        protectedSeg = pLines.join("\n");

        if (protectedSeg !== beforeInline) fixes.inlineFixed++;

        // Restore inline code tokens
        seg = protectedSeg.replace(/\uE000IC(\d+)\uE001/g, function (_, idx) {
          return inlineTokens[Number(idx)];
        });
      }

      // Rule 11: Story / Fanfiction Polish (optional)
      if (rules.storyPolish) {
        const beforeStory = seg;
        // Normalize scene break lines (* * *, ---, ~~~, ===) to clean ---
        seg = seg.replace(/^[ \t]*(?:\*[ \t]*\*[ \t]*\*[ \t*]*|-{3,}|~{3,}|={3,}|✦[ \t✦]*✦)[ \t]*$/gm, "\n---\n");
        // Convert double hyphen -- between words/spaces into typographic em-dash —
        seg = seg.replace(/(\S|\s)--(\S|\s)/g, "$1—$2");
        if (seg !== beforeStory) fixes.storyPolished++;
      }

      // Rule 12: Normalize excessive blank lines & trailing spaces
      if (rules.normalizeSpacing) {
        const beforeSp = seg;
        seg = seg.replace(/[ \t]+$/gm, "");
        seg = seg.replace(/\n{3,}/g, "\n\n");
        if (seg !== beforeSp) fixes.spacingFixed++;
      }

      segments[s].text = seg;
    }

    let fixed = segments.map(function (s) { return s.text; }).join("\n").trim();

    // Build human-readable diagnostics
    const diagnostics = [];
    if (fixes.unescapedJson) diagnostics.push({ label: "JSON Unescaped", count: fixes.unescapedJson, type: "fix" });
    if (fixes.fencesFixed) diagnostics.push({ label: "Code Fence Fixed", count: fixes.fencesFixed, type: "fix" });
    if (fixes.langsDetected) diagnostics.push({ label: "Lang Auto-Detected", count: fixes.langsDetected, type: "info" });
    if (fixes.thinkingFormatted) diagnostics.push({ label: "Thinking Block", count: fixes.thinkingFormatted, type: "info" });
    if (fixes.headingsFixed) diagnostics.push({ label: "Heading Fixed", count: fixes.headingsFixed, type: "fix" });
    if (fixes.listsFixed) diagnostics.push({ label: "List Fixed", count: fixes.listsFixed, type: "fix" });
    if (fixes.tablesFixed) diagnostics.push({ label: "Table Repaired", count: fixes.tablesFixed, type: "fix" });
    if (fixes.inlineFixed) diagnostics.push({ label: "Inline MD Fixed", count: fixes.inlineFixed, type: "fix" });
    if (fixes.mathFixed) diagnostics.push({ label: "LaTeX Normalized", count: fixes.mathFixed, type: "fix" });
    if (fixes.artifactsCleaned) diagnostics.push({ label: "Artifacts Cleaned", count: fixes.artifactsCleaned, type: "fix" });
    if (fixes.storyPolished) diagnostics.push({ label: "Story Polish", count: fixes.storyPolished, type: "info" });
    if (fixes.fillerStripped) diagnostics.push({ label: "AI Filler Stripped", count: fixes.fillerStripped, type: "fix" });
    if (fixes.spacingFixed) diagnostics.push({ label: "Spacing Tidied", count: fixes.spacingFixed, type: "fix" });

    const totalFixes = Object.keys(fixes).reduce(function (acc, k) { return acc + fixes[k]; }, 0);

    // Truncation Detection on ORIGINAL raw text!
    const trunc = detectTruncation(rawText);

    return {
      fixed: fixed,
      fixes: fixes,
      totalFixes: totalFixes,
      diagnostics: diagnostics,
      truncated: trunc.truncated,
      truncationReason: trunc.reason,
      stats: computeStats(fixed)
    };
  }

  function repairTablesInSegment(seg) {
    const lines = seg.split("\n");
    const out = [];
    let count = 0;
    let i = 0;

    while (i < lines.length) {
      // Detect potential table: line with at least 1 pipe, followed by separator line with pipes and dashes
      if (
        i + 1 < lines.length &&
        lines[i].includes("|") &&
        /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(lines[i + 1])
      ) {
        const block = [];
        while (i < lines.length && lines[i].trim() !== "" && lines[i].includes("|")) {
          block.push(lines[i]);
          i++;
        }

        const parsedRows = block.map(function (row) {
          let r = row.trim();
          const hadOuter = r.startsWith("|") && r.endsWith("|");
          if (!hadOuter) count++;
          if (r.startsWith("|")) r = r.slice(1);
          if (r.endsWith("|")) r = r.slice(0, -1);
          return r.split("|").map(function (cell) { return cell.trim(); });
        });

        const colCount = Math.max.apply(null, parsedRows.map(function (r) { return r.length; }));
        const normalized = parsedRows.map(function (cells, rowIdx) {
          while (cells.length < colCount) {
            cells.push(rowIdx === 1 ? "---" : "");
            count++;
          }
          if (rowIdx === 1) {
            return "| " + cells.map(function (c) {
              const left = c.startsWith(":");
              const right = c.endsWith(":");
              if (left && right) return ":---:";
              if (right) return "---:";
              if (left) return ":---";
              return "---";
            }).join(" | ") + " |";
          }
          return "| " + cells.join(" | ") + " |";
        });

        if (out.length > 0 && out[out.length - 1].trim() !== "") out.push("");
        out.push.apply(out, normalized);
        out.push("");
        continue;
      }

      out.push(lines[i]);
      i++;
    }

    return { text: out.join("\n"), count: count };
  }

  /* ---------------------------------------------------------
     4. Smart Truncation Detector
     --------------------------------------------------------- */
  function detectTruncation(rawText) {
    const trimmed = (rawText || "").trim();
    if (!trimmed || trimmed.length < 40) {
      return { truncated: false, reason: "" };
    }

    // 1. Unclosed code fence in original input
    const fenceLines = trimmed.split("\n").filter(function (l) {
      return /^[ \t]*(`{3,}|~{3,})/.test(l);
    });
    if (fenceLines.length % 2 === 1) {
      return {
        truncated: true,
        reason: "Blok kode (```) belum ditutup di bagian akhir output."
      };
    }

    // 2. Unclosed <thought> / <thinking> tag
    if (/<(thought|thinking)>/i.test(trimmed) && !/<\/(thought|thinking)>/i.test(trimmed)) {
      return {
        truncated: true,
        reason: "Tag <thought> belum selesai / terpotong."
      };
    }

    const lines = trimmed.split("\n");
    const lastLine = lines[lines.length - 1].trim();

    // If ends with a clean closing code fence or horizontal rule or complete table row, not truncated
    if (/^(`{3,}|~{3,}|-{3,}|\*{3,})$/.test(lastLine)) {
      return { truncated: false, reason: "" };
    }
    if (/^\|.*\|$/.test(lastLine)) {
      return { truncated: false, reason: "" };
    }
    if (/^#{1,6}\s+/.test(lastLine)) {
      return {
        truncated: true,
        reason: "Berhenti tepat pada judul heading tanpa isi."
      };
    }

    // 3. Ends with dangling punctuation / conjunction / open bracket
    if (/[,;:\(\[\{`\\]$/.test(lastLine) || /\b(dan|atau|yang|untuk|dengan|karena|tetapi|namun|and|or|the|with|for|because|that|from|to)$/i.test(lastLine)) {
      return {
        truncated: true,
        reason: "Kalimat berhenti di tengah kata sambung atau tanda baca menggantung."
      };
    }

    // 4. Long prose ending without terminal punctuation
    if (lastLine.length >= 28 && !/[.!?"'”’»\)\]\}`…—*]$/.test(lastLine)) {
      return {
        truncated: true,
        reason: "Paragraf terakhir berhenti tanpa tanda baca akhir kalimat."
      };
    }

    return { truncated: false, reason: "" };
  }

  /* ---------------------------------------------------------
     5. Metadata Extractor (Headings, Code Blocks, Stats)
     --------------------------------------------------------- */
  function extractMetadata(markdown) {
    const md = markdown || "";
    const lines = md.split("\n");
    const headings = [];
    const codeBlocks = [];
    const slugCounts = {};

    let inFence = false;
    let currentCode = [];
    let currentLang = "";
    let prevNonEmptyLine = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!inFence) {
        const openMatch = line.match(/^[ \t]{0,3}`{3,}\s*([a-zA-Z0-9_+#.-]*)\s*$/);
        if (openMatch) {
          inFence = true;
          currentLang = normalizeLang(openMatch[1]) || "";
          currentCode = [];
          continue;
        }

        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const cleanTitle = headingMatch[2].replace(/[*_`~]/g, "").trim();
          const baseSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F]+/g, "-").replace(/^-|-$/g, "") || "section";
          slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
          const id = "h-" + baseSlug + (slugCounts[baseSlug] > 1 ? "-" + slugCounts[baseSlug] : "");
          headings.push({ id: id, level: level, title: cleanTitle, line: i + 1 });
        }

        if (line.trim() !== "") prevNonEmptyLine = line;
      } else {
        if (/^[ \t]{0,3}`{3,}\s*$/.test(line)) {
          const codeStr = currentCode.join("\n");
          const finalLang = currentLang || detectLanguage(codeStr);
          const idx = codeBlocks.length;
          const filename = inferFilename(codeStr, prevNonEmptyLine, finalLang, idx);
          codeBlocks.push({
            index: idx,
            id: "code-block-" + idx,
            lang: finalLang,
            filename: filename,
            code: codeStr,
            lines: codeStr ? codeStr.split("\n").length : 0,
            bytes: new Blob([codeStr]).size
          });
          inFence = false;
          currentCode = [];
          currentLang = "";
          prevNonEmptyLine = "";
        } else {
          currentCode.push(line);
        }
      }
    }

    const plainText = stripMarkdownToPlain(md);
    const stats = computeStats(md, codeBlocks.length);

    return {
      headings: headings,
      codeBlocks: codeBlocks,
      plainText: plainText,
      stats: stats
    };
  }

  function stripMarkdownToPlain(md) {
    if (!md) return "";
    return md
      .replace(/^:::thought\s*$/gm, "")
      .replace(/^:::\s*$/gm, "")
      .replace(/^```[\w_+#.-]*\s*$/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/~~(.*?)~~/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^\s*>\s?/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function computeStats(text, codeCountOverride) {
    const t = text || "";
    const trimmed = t.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = t.length;
    const lines = trimmed ? t.split("\n").length : 0;
    const readMinutes = words > 0 ? Math.max(1, Math.ceil(words / 220)) : 0;
    let codeCount = typeof codeCountOverride === "number" ? codeCountOverride : 0;
    if (typeof codeCountOverride !== "number") {
      const m = t.match(/^[ \t]{0,3}```/gm);
      codeCount = m ? Math.floor(m.length / 2) : 0;
    }
    return { words: words, chars: chars, lines: lines, readMinutes: readMinutes, codeCount: codeCount };
  }

  /* ---------------------------------------------------------
     6. Continuation Prompt & Smart Overlap Stitcher
     --------------------------------------------------------- */
  function generateContinuePrompt(fixedText, truncationReason, lang) {
    const clean = (fixedText || "").trim();
    const tailLines = clean.split("\n").slice(-6).join("\n");
    const lastSnippet = tailLines.length > 360 ? tailLines.slice(-360) : tailLines;

    if (lang === "en") {
      return [
        "Your previous response was cut off mid-output" + (truncationReason ? " (" + truncationReason + ")" : "") + ".",
        "Please continue seamlessly from the exact point where you stopped.",
        "",
        "Strict rules:",
        "1. Do NOT repeat any previous paragraphs, headings, or lines.",
        "2. Do NOT add introductory chatter like 'Sure, continuing...'.",
        "3. Keep the exact same formatting, Markdown structure, tone, and indentation.",
        "",
        "Exact ending of your previous output:",
        "<<<",
        lastSnippet,
        ">>>",
        "",
        "Continue immediately after the text above:"
      ].join("\n");
    }

    return [
      "Respons Anda sebelumnya terpotong di tengah jalan" + (truncationReason ? " (" + truncationReason + ")" : "") + ".",
      "Tolong lanjutkan secara mulus tepat dari titik terakhir tersebut.",
      "",
      "Aturan ketat:",
      "1. JANGAN mengulang kalimat, paragraf, atau baris kode sebelumnya.",
      "2. JANGAN tambahkan basa-basi pembuka seperti 'Tentu, berikut lanjutannya...'.",
      "3. Pertahankan format Markdown, gaya bahasa, dan indentasi yang sama persis.",
      "",
      "Potongan tepat di bagian akhir respons sebelumnya:",
      "<<<",
      lastSnippet,
      ">>>",
      "",
      "Lanjutkan langsung setelah teks di atas:"
    ].join("\n");
  }

  function smartStitch(part1, part2) {
    let p1 = (part1 || "").replace(/\r\n/g, "\n").trimEnd();
    let p2 = (part2 || "").replace(/\r\n/g, "\n").trimStart();

    if (!p1) return { merged: p2, overlapRemoved: 0, note: "Part 1 kosong, menggunakan Part 2." };
    if (!p2) return { merged: p1, overlapRemoved: 0, note: "Part 2 kosong." };

    let overlapRemoved = 0;
    let note = "";

    // Strip leading AI continuation chatter from Part 2
    const chatterRe = /^(?:Sure|Certainly|Here(?:'s| is) the continuation|Tentu|Baik|Berikut lanjutannya)[^\n]{0,100}[:.!]\s*\n+/i;
    if (chatterRe.test(p2)) {
      p2 = p2.replace(chatterRe, "");
    }

    // Check if Part 1 had an unclosed code fence and Part 2 starts with ```lang
    const p1FenceCount = (p1.match(/^[ \t]*`{3,}/gm) || []).length;
    if (p1FenceCount % 2 === 1) {
      const dupOpen = p2.match(/^[ \t]*`{3,}[a-zA-Z0-9_+#.-]*\s*\n/);
      if (dupOpen) {
        p2 = p2.slice(dupOpen[0].length);
        overlapRemoved += dupOpen[0].length;
        note = "Pembuka blok kode duplikat dihapus otomatis.";
      }
    }

    // 1. Line-level suffix/prefix overlap detection (check up to last 15 lines)
    const lines1 = p1.split("\n");
    const lines2 = p2.split("\n");
    const maxCheckLines = Math.min(15, lines1.length, lines2.length);
    let bestLineOverlap = 0;

    for (let k = maxCheckLines; k >= 1; k--) {
      let match = true;
      for (let j = 0; j < k; j++) {
        if (lines1[lines1.length - k + j].trim() !== lines2[j].trim()) {
          match = false;
          break;
        }
      }
      if (match) {
        bestLineOverlap = k;
        break;
      }
    }

    if (bestLineOverlap > 0) {
      const removedText = lines2.slice(0, bestLineOverlap).join("\n");
      overlapRemoved += removedText.length;
      const rest2 = lines2.slice(bestLineOverlap).join("\n");
      return {
        merged: p1 + (rest2 ? "\n" + rest2 : ""),
        overlapRemoved: overlapRemoved,
        note: "Berhasil membuang " + bestLineOverlap + " baris duplikat & menyambungkan mulus!"
      };
    }

    // 2. Character-level suffix/prefix overlap (for mid-sentence continuations)
    const maxChars = Math.min(280, p1.length, p2.length);
    let bestCharOverlap = 0;
    for (let len = maxChars; len >= 12; len--) {
      if (p1.slice(-len) === p2.slice(0, len)) {
        bestCharOverlap = len;
        break;
      }
    }

    if (bestCharOverlap > 0) {
      overlapRemoved += bestCharOverlap;
      return {
        merged: p1 + p2.slice(bestCharOverlap),
        overlapRemoved: overlapRemoved,
        note: "Berhasil membuang " + bestCharOverlap + " karakter tumpang tindih & menyambung tepat di tengah kalimat!"
      };
    }

    // 3. Smart join separator (space if mid-sentence, newline otherwise)
    const needsSpace = /[a-zA-Z0-9,;]$/.test(p1) && /^[a-z0-9]/.test(p2);
    const sep = needsSpace ? " " : "\n";
    return {
      merged: p1 + sep + p2,
      overlapRemoved: overlapRemoved,
      note: note || "Disambungkan bersih tanpa duplikasi yang terdeteksi."
    };
  }

  /* ---------------------------------------------------------
     7. Line-Level Diff Engine (LCS with Safe Large-File Guard)
     --------------------------------------------------------- */
  function computeDiff(original, fixed) {
    const a = (original || "").replace(/\r\n/g, "\n").split("\n");
    const b = (fixed || "").replace(/\r\n/g, "\n").split("\n");

    // Guard for huge files (> 1200 lines) to guarantee 60fps UI
    if (a.length * b.length > 900000) {
      return computeFastGreedyDiff(a, b);
    }

    const n = a.length;
    const m = b.length;
    const dp = new Array(n + 1);
    for (let i = 0; i <= n; i++) {
      dp[i] = new Int32Array(m + 1);
    }

    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        if (a[i] === b[j]) {
          dp[i][j] = dp[i + 1][j + 1] + 1;
        } else {
          dp[i][j] = dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
        }
      }
    }

    const ops = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        ops.push({ type: "eq", text: a[i], oldLine: i + 1, newLine: j + 1 });
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        ops.push({ type: "rem", text: a[i], oldLine: i + 1, newLine: null });
        i++;
      } else {
        ops.push({ type: "add", text: b[j], oldLine: null, newLine: j + 1 });
        j++;
      }
    }
    while (i < n) {
      ops.push({ type: "rem", text: a[i], oldLine: i + 1, newLine: null });
      i++;
    }
    while (j < m) {
      ops.push({ type: "add", text: b[j], oldLine: null, newLine: j + 1 });
      j++;
    }

    return ops;
  }

  function computeFastGreedyDiff(a, b) {
    const ops = [];
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) {
        ops.push({ type: "eq", text: a[i], oldLine: i + 1, newLine: j + 1 });
        i++; j++;
      } else {
        // Look ahead up to 12 lines for resync
        let foundA = -1, foundB = -1;
        for (let k = 1; k <= 12; k++) {
          if (foundB === -1 && j + k < b.length && i < a.length && a[i] === b[j + k]) foundB = j + k;
          if (foundA === -1 && i + k < a.length && j < b.length && a[i + k] === b[j]) foundA = i + k;
        }
        if (foundB !== -1 && (foundA === -1 || (foundB - j) <= (foundA - i))) {
          while (j < foundB) {
            ops.push({ type: "add", text: b[j], oldLine: null, newLine: j + 1 });
            j++;
          }
        } else if (foundA !== -1) {
          while (i < foundA) {
            ops.push({ type: "rem", text: a[i], oldLine: i + 1, newLine: null });
            i++;
          }
        } else {
          if (i < a.length) {
            ops.push({ type: "rem", text: a[i], oldLine: i + 1, newLine: null });
            i++;
          }
          if (j < b.length) {
            ops.push({ type: "add", text: b[j], oldLine: null, newLine: j + 1 });
            j++;
          }
        }
      }
    }
    return ops;
  }

  /* ---------------------------------------------------------
     8. Pure Zero-Dependency ZIP Generator (STORE + CRC32)
     --------------------------------------------------------- */
  const CRC_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function buildZipBlob(files) {
    const encoder = new TextEncoder();
    const now = new Date();
    const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | ((now.getSeconds() >> 1) & 0x1f);
    const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0x0f) << 5) | (now.getDate() & 0x1f);

    const usedNames = {};
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach(function (file, idx) {
      let safeName = (file.name || ("file-" + (idx + 1) + ".txt"))
        .replace(/^[\/\\]+/, "")
        .replace(/\.\./g, "_");
      if (usedNames[safeName]) {
        const dot = safeName.lastIndexOf(".");
        const n = ++usedNames[safeName];
        safeName = dot > 0 ? safeName.slice(0, dot) + "-" + n + safeName.slice(dot) : safeName + "-" + n;
      } else {
        usedNames[safeName] = 1;
      }

      const nameBytes = encoder.encode(safeName);
      const dataBytes = encoder.encode(file.content || "");
      const crc = crc32(dataBytes);

      // Local File Header (30 bytes)
      const localHeader = new ArrayBuffer(30);
      const lv = new DataView(localHeader);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true); // UTF-8
      lv.setUint16(8, 0, true);      // STORE
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, dataBytes.length, true);
      lv.setUint32(22, dataBytes.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);

      localParts.push(new Uint8Array(localHeader), nameBytes, dataBytes);

      // Central Directory Header (46 bytes)
      const centralHeader = new ArrayBuffer(46);
      const cv = new DataView(centralHeader);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, dataBytes.length, true);
      cv.setUint32(24, dataBytes.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);

      centralParts.push(new Uint8Array(centralHeader), nameBytes);
      offset += 30 + nameBytes.length + dataBytes.length;
    });

    let centralSize = 0;
    centralParts.forEach(function (u8) { centralSize += u8.length; });

    // End of Central Directory (22 bytes)
    const eocd = new ArrayBuffer(22);
    const ev = new DataView(eocd);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob(localParts.concat(centralParts, [new Uint8Array(eocd)]), {
      type: "application/zip"
    });
  }

  /* ---------------------------------------------------------
     9. Simple Content Hash (for Reader Position Memory)
     --------------------------------------------------------- */
  function hashText(str) {
    let h = 5381;
    const sample = (str || "").slice(0, 1200) + "|" + (str || "").length;
    for (let i = 0; i < sample.length; i++) {
      h = ((h << 5) + h) + sample.charCodeAt(i);
      h = h & 0x7fffffff;
    }
    return "doc_" + h.toString(36);
  }

  global.FixerParser = {
    RULE_DEFINITIONS: RULE_DEFINITIONS,
    getDefaultRules: getDefaultRules,
    normalizeLang: normalizeLang,
    detectLanguage: detectLanguage,
    inferFilename: inferFilename,
    autoFix: autoFix,
    extractMetadata: extractMetadata,
    stripMarkdownToPlain: stripMarkdownToPlain,
    computeStats: computeStats,
    generateContinuePrompt: generateContinuePrompt,
    smartStitch: smartStitch,
    computeDiff: computeDiff,
    buildZipBlob: buildZipBlob,
    hashText: hashText
  };
})(window);