/* =========================================================
   APPLICATION CONTROLLER — WORKSPACE, CODE STUDIO & BOOK VIEW
   ========================================================= */
(function () {
  "use strict";

  const Parser = window.FixerParser;
  const Renderer = window.FixerRenderer;

  /* ---------------------------------------------------------
     Safe LocalStorage Helpers
     --------------------------------------------------------- */
  const STORAGE_KEY = "aistudio_fixer_pro_v2";
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }
  function saveState(patch) {
    try {
      const curr = loadState();
      const next = Object.assign(curr, patch);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {}
  }

  /* ---------------------------------------------------------
     Sample Presets (Coding, Story/Fanfic, Math, JSON-Escaped)
     --------------------------------------------------------- */
  const SAMPLES = {
    coding: `<thought>
Pengguna meminta komponen kartu profil interaktif lengkap dengan HTML, CSS, JavaScript, dan data JSON contoh.
Mari buat respons yang lengkap dan bersih.
</thought>
Tentu! Berikut adalah komponen Profile Card interaktif yang bisa langsung Anda coba:

###index.html
\`\`\`html <div class="card">
  <div class="avatar">AI</div>
  <h2 id="userName">Sora Takahashi</h2>
  <p class="role">Frontend Architect &amp; Storyteller</p>
  <button id="followBtn">Follow +</button>
  <span id="counter">128 Followers</span>
</div>
\`\`\`

###style.css
\`\`\`
body {
  font-family: system-ui, sans-serif;
  display: grid;
  place-items: center;
  min-height: 100vh;
  margin: 0;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #f8fafc;
}
.card {
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 28px 32px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  width: 280px;
}
.avatar {
  width: 64px; height: 64px; margin: 0 auto 12px;
  border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #a855f7);
  display: grid; place-items: center; font-weight: 800; font-size: 22px;
}
button {
  margin-top: 12px; padding: 9px 20px; border: none; border-radius: 999px;
  background: #3b82f6; color: #fff; font-weight: 700; cursor: pointer;
}
button.following { background: #10b981; }
#counter { display: block; margin-top: 10px; font-size: 13px; color: #94a3b8; }
\`\`\`

###app.js
\`\`\`
// Interactive follow toggle
let count = 128;
let isFollowing = false;
const btn = document.getElementById("followBtn");
const counter = document.getElementById("counter");

btn.addEventListener("click", () => {
  isFollowing = !isFollowing;
  count += isFollowing ? 1 : -1;
  btn.textContent = isFollowing ? "Following ✓" : "Follow +";
  btn.classList.toggle("following", isFollowing);
  counter.textContent = count + " Followers";
});
\`\`\`

###config.json
\`\`\`json
{"theme":"midnight","version":2,"features":["live-preview","zip-export","syntax-highlight"],"enabled":true}
\`\`\`

###Ringkasan Fitur
Fitur | Status | Catatan
---|---|---
Auto-Close Fence | Aktif | Memperbaiki blok kode yang terpotong
Live Sandbox | Aktif | Klik tombol Preview atau Run Web Preview

•Coba klik tab ** Code ** di pojok kanan atas untuk membuka Code Studio!
•Anda juga bisa klik tombol **Run Web Preview** untuk melihat kartu di atas berjalan secara langsung!

\`\`\`python
# Contoh kode yang terpotong di tengah jalan oleh AI Studio:
def process_stream(chunks):
    buffer = []
    for item in chunks:
        if item.strip():
            buffer.append(item`,

    story: `# Bab 1: Lampu Terakhir di Stasiun Utara

Hujan turun tipis ketika kereta malam berhenti di peron tiga. Di balik kaca jendela yang berembun, Arka menatap jam dinding tua yang jarumnya berhenti di pukul sebelas lewat dua belas.

"Kau yakin tidak ingin menunggu sampai badainya reda?" tanya Nadira pelan, tangannya menggenggam erat gagang payung hitam yang masih meneteskan air.

Arka tersenyum tipis--senyum yang sudah terlalu sering ia gunakan untuk menyembunyikan rasa lelah. "Jika aku menunggu badai reda, kereta menuju pelabuhan sudah berangkat duluan."

"Dan jika kau pergi sekarang, siapa yang akan memastikan catatan ini sampai ke ** arsip pusat **?" balas Nadira, suaranya nyaris tenggelam oleh gemuruh guntur dari kejauhan.

* * *

## Bab 2: Surat Tanpa Alamat

Lorong stasiun itu nyaris kosong. Hanya ada suara langkah sepatu mereka berdua yang memantul di lantai marmer pucat, ditemani lampu neon yang sesekali berkedip seperti sedang menahan kantuk.

Arka merogoh saku mantelnya dan mengeluarkan amplop cokelat tersegel lilin biru. \*Semua jawaban yang mereka cari selama tiga tahun terakhir ada di dalam sini.\*

> [!NOTE]
> Catatan Penulis: Coba buka tombol **Book View** di atas! Aktifkan **Sorot Dialog**, **Indentasi Novel**, **Drop Cap**, atau **Tema Sepia / Sage** untuk pengalaman membaca layaknya novel cetak.

"Simpan baik-baik," bisik Arka sambil menyerahkan amplop itu. "Jangan buka sebelum matahari terbit di atas mercusuar, karena saat segel itu patah, semua orang di kota ini akan`,

    math: `# Catatan Kalkulus & Fisika Modern

###Persamaan Kuadrat & Solusi Umum
Untuk persamaan polinomial derajat dua $ax^2 + bx + c = 0$, akar-akarnya dinyatakan dengan rumus:

\\[
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
\\]

###Hukum Energi & Relativitas
Energi total partikel bermassa diam \\(m_0\\) dengan momentum \\(p\\) memenuhi:

\\[
E^2 = (pc)^2 + (m_0 c^2)^2
\\]

###Ringkasan Konstanta Fundamental
Simbol | Nama Konstanta | Nilai Pendekatan
:---: | --- | ---:
$c$ | Kecepatan Cahaya | $3 \\times 10^8\\text{ m/s}$
$h$ | Konstanta Planck | $6.626 \\times 10^{-34}\\text{ J}\\cdot\\text{s}$
$G$ | Konstanta Gravitasi | $6.674 \\times 10^{-11}$

> [!TIP]
> Gunakan **Export -> Print / Save as PDF** atau **Interactive Book (.html)** untuk menyimpan catatan ini menjadi dokumen bacaan offline!

- [x] Normalisasi delimiter LaTeX \\\\[ \\\\] dan \\\\( \\\\)
- [x] Perbaikan otomatis tabel Markdown tanpa pipa luar
- [ ] Eksplorasi rumus tambahan`,

    escaped: `"# Laporan Analisis API\\n\\nBerikut adalah hasil **ekstraksi mentah** yang masih terjebak literal newline:\\n\\n###Daftar Langkah\\n1.Buka file konfigurasi\\n2.Jalankan skrip migrasi\\n\\n\`\`\`javascript\\nconst status = \\"ok\\";\\nconsole.log(\\"Hello from unescaped JSON!\\", status);\\n\`\`\`\\n\\nSemua literal \\\\n dan \\\\\\" telah dipulihkan otomatis!"`
  };

  /* ---------------------------------------------------------
     DOM References
     --------------------------------------------------------- */
  const $ = function (id) { return document.getElementById(id); };

  const el = {
    fontSizeSlider: $("fontSizeSlider"),
    fontSizeLabel: $("fontSizeLabel"),
    samplesBtn: $("samplesBtn"),
    samplesMenu: $("samplesMenu"),
    rulesBtn: $("rulesBtn"),
    rulesMenu: $("rulesMenu"),
    rulesActiveBadge: $("rulesActiveBadge"),
    historyBtn: $("historyBtn"),
    historyMenu: $("historyMenu"),
    historyCount: $("historyCount"),
    exportBtn: $("exportBtn"),
    exportMenu: $("exportMenu"),
    shortcutsBtn: $("shortcutsBtn"),
    themeToggle: $("themeToggle"),
    themeLabel: $("themeLabel"),
    themeIcon: $("themeIcon"),

    diagBadges: $("diagBadges"),
    statWords: $("statWords"),
    statChars: $("statChars"),
    statLines: $("statLines"),
    statCodeCount: $("statCodeCount"),
    statRead: $("statRead"),

    mobTabInput: $("mobTabInput"),
    mobTabOutput: $("mobTabOutput"),
    workspace: $("workspace"),
    inputPanel: $("inputPanel"),
    splitDivider: $("splitDivider"),
    outputPanel: $("outputPanel"),

    undoBtn: $("undoBtn"),
    redoBtn: $("redoBtn"),
    pasteBtn: $("pasteBtn"),
    stitchBtn: $("stitchBtn"),
    importFileBtn: $("importFileBtn"),
    fileInput: $("fileInput"),
    findToggleBtn: $("findToggleBtn"),
    clearBtn: $("clearBtn"),
    focusInputBtn: $("focusInputBtn"),

    findBar: $("findBar"),
    findInput: $("findInput"),
    replaceInput: $("replaceInput"),
    regexToggle: $("regexToggle"),
    caseToggle: $("caseToggle"),
    wholeWordToggle: $("wholeWordToggle"),
    findCount: $("findCount"),
    findPrevBtn: $("findPrevBtn"),
    findNextBtn: $("findNextBtn"),
    replaceNextBtn: $("replaceNextBtn"),
    replaceAllBtn: $("replaceAllBtn"),
    closeFindBtn: $("closeFindBtn"),

    rawInput: $("rawInput"),
    cursorPos: $("cursorPos"),
    selectionInfo: $("selectionInfo"),

    modePreviewBtn: $("modePreviewBtn"),
    modeRawBtn: $("modeRawBtn"),
    modeDiffBtn: $("modeDiffBtn"),
    modeCodeBtn: $("modeCodeBtn"),
    codeTabCount: $("codeTabCount"),

    readerModeBtn: $("readerModeBtn"),
    syncScrollBtn: $("syncScrollBtn"),
    tocToggleBtn: $("tocToggleBtn"),
    codeBarToggleBtn: $("codeBarToggleBtn"),
    openWindowBtn: $("openWindowBtn"),
    continuePromptBtn: $("continuePromptBtn"),
    copyPlainBtn: $("copyPlainBtn"),
    copyResultBtn: $("copyResultBtn"),
    focusOutputBtn: $("focusOutputBtn"),

    codeToolbarBar: $("codeToolbarBar"),
    expandAllCodeBtn: $("expandAllCodeBtn"),
    collapseAllCodeBtn: $("collapseAllCodeBtn"),
    toggleLineNumsBtn: $("toggleLineNumsBtn"),
    toggleWrapAllBtn: $("toggleWrapAllBtn"),
    openCodeModalBtn: $("openCodeModalBtn"),
    downloadZipBtn: $("downloadZipBtn"),
    copyAllCodeBtn: $("copyAllCodeBtn"),

    diffToolbarBar: $("diffToolbarBar"),
    diffStatsBadge: $("diffStatsBadge"),
    diffChangesOnlyBtn: $("diffChangesOnlyBtn"),
    diffCopyPatchBtn: $("diffCopyPatchBtn"),

    tocBar: $("tocBar"),
    previewOutput: $("previewOutput"),
    rawOutput: $("rawOutput"),
    diffOutput: $("diffOutput"),
    codeViewOutput: $("codeViewOutput"),

    truncationBanner: $("truncationBanner"),
    truncationReasonText: $("truncationReasonText"),
    bannerContinueBtn: $("bannerContinueBtn"),
    bannerStitchBtn: $("bannerStitchBtn"),

    mobBarPaste: $("mobBarPaste"),
    mobBarInput: $("mobBarInput"),
    mobBarOutput: $("mobBarOutput"),
    mobBarReader: $("mobBarReader"),
    mobBarCopy: $("mobBarCopy"),

    // Book Reader
    readerOverlay: $("readerOverlay"),
    readerDimmer: $("readerDimmer"),
    readerRuler: $("readerRuler"),
    readerProgressFill: $("readerProgressFill"),
    readerShowBarsBtn: $("readerShowBarsBtn"),
    closeReaderBtn: $("closeReaderBtn"),
    readerTocDrawerBtn: $("readerTocDrawerBtn"),
    readerChapterTitle: $("readerChapterTitle"),
    readerBookmarkBtn: $("readerBookmarkBtn"),
    readerSettingsToggleBtn: $("readerSettingsToggleBtn"),
    readerHideBarsBtn: $("readerHideBarsBtn"),
    readerPopoutBtn: $("readerPopoutBtn"),

    readerDrawerBackdrop: $("readerDrawerBackdrop"),
    readerDrawer: $("readerDrawer"),
    closeReaderDrawerBtn: $("closeReaderDrawerBtn"),
    drawerTabChapters: $("drawerTabChapters"),
    drawerTabBookmarks: $("drawerTabBookmarks"),
    readerChaptersList: $("readerChaptersList"),
    readerBookmarksList: $("readerBookmarksList"),

    readerSettingsDrawer: $("readerSettingsDrawer"),
    readerThemeSelect: $("readerThemeSelect"),
    readerFontSelect: $("readerFontSelect"),
    readerWidthSelect: $("readerWidthSelect"),
    readerFontDecBtn: $("readerFontDecBtn"),
    readerFontSizeLabel: $("readerFontSizeLabel"),
    readerFontIncBtn: $("readerFontIncBtn"),
    readerLineHeightSelect: $("readerLineHeightSelect"),
    readerJustifyBtn: $("readerJustifyBtn"),
    readerIndentBtn: $("readerIndentBtn"),
    readerDropCapBtn: $("readerDropCapBtn"),
    readerDialogueBtn: $("readerDialogueBtn"),
    readerBionicBtn: $("readerBionicBtn"),
    readerRulerBtn: $("readerRulerBtn"),
    readerColumnsBtn: $("readerColumnsBtn"),
    readerDimmerSlider: $("readerDimmerSlider"),
    readerDimmerLabel: $("readerDimmerLabel"),
    readerWarmthSlider: $("readerWarmthSlider"),
    readerWarmthLabel: $("readerWarmthLabel"),
    readerAutoScrollSelect: $("readerAutoScrollSelect"),
    readerTtsVoiceSelect: $("readerTtsVoiceSelect"),
    readerTtsRateSelect: $("readerTtsRateSelect"),
    readerPrintBtn: $("readerPrintBtn"),
    readerResetSettingsBtn: $("readerResetSettingsBtn"),

    readerScroll: $("readerScroll"),
    readerPage: $("readerPage"),
    readerArticle: $("readerArticle"),
    readerPrevChapBtn: $("readerPrevChapBtn"),
    readerNextChapBtn: $("readerNextChapBtn"),
    readerStatusText: $("readerStatusText"),
    readerAutoScrollToggleBtn: $("readerAutoScrollToggleBtn"),
    readerTtsBtn: $("readerTtsBtn"),
    readerTopBtn: $("readerTopBtn"),

    // Modals
    continueModal: $("continueModal"),
    closeModalBtn: $("closeModalBtn"),
    continueLangIdBtn: $("continueLangIdBtn"),
    continueLangEnBtn: $("continueLangEnBtn"),
    continuePromptText: $("continuePromptText"),
    copyContinueBtn: $("copyContinueBtn"),

    stitchModal: $("stitchModal"),
    closeStitchModalBtn: $("closeStitchModalBtn"),
    stitchPart2Input: $("stitchPart2Input"),
    stitchPreviewInfo: $("stitchPreviewInfo"),
    applyStitchBtn: $("applyStitchBtn"),

    codeExtractModal: $("codeExtractModal"),
    closeCodeModalBtn: $("closeCodeModalBtn"),
    codeFilterInput: $("codeFilterInput"),
    modalLangChips: $("modalLangChips"),
    modalExpandAllBtn: $("modalExpandAllBtn"),
    modalCollapseAllBtn: $("modalCollapseAllBtn"),
    modalRunWebBtn: $("modalRunWebBtn"),
    modalDownloadZipBtn: $("modalDownloadZipBtn"),
    modalCopyAllCodeBtn: $("modalCopyAllCodeBtn"),
    codeExtractBody: $("codeExtractBody"),

    sandboxModal: $("sandboxModal"),
    closeSandboxModalBtn: $("closeSandboxModalBtn"),
    sandboxTitle: $("sandboxTitle"),
    sandboxRefreshBtn: $("sandboxRefreshBtn"),
    sandboxOpenTabBtn: $("sandboxOpenTabBtn"),
    sandboxFrame: $("sandboxFrame"),

    codeFocusModal: $("codeFocusModal"),
    closeCodeFocusBtn: $("closeCodeFocusBtn"),
    codeFocusTitle: $("codeFocusTitle"),
    codeFocusCopyBtn: $("codeFocusCopyBtn"),
    codeFocusDownloadBtn: $("codeFocusDownloadBtn"),
    codeFocusBody: $("codeFocusBody"),

    shortcutsModal: $("shortcutsModal"),
    closeShortcutsModalBtn: $("closeShortcutsModalBtn"),
    toastContainer: $("toastContainer")
  };

  /* ---------------------------------------------------------
     Application State
     --------------------------------------------------------- */
  const persisted = loadState();
  const DEFAULT_READER_PREFS = {
    theme: "sepia",
    font: "serif",
    width: "medium",
    fontSize: 18,
    lineHeight: "1.85",
    justify: false,
    indent: false,
    dropCap: true,
    dialogueHighlight: false,
    bionicReading: false,
    readingRuler: false,
    twoColumns: false,
    dimmer: 0,
    warmth: 0,
    autoScrollSpeed: 0,
    ttsRate: 1,
    ttsVoiceURI: ""
  };

  const state = {
    theme: persisted.theme || "dark",
    fontSize: persisted.fontSize || 14,
    rules: Object.assign(Parser.getDefaultRules(), persisted.rules || {}),
    history: Array.isArray(persisted.history) ? persisted.history : [],
    readerPositions: persisted.readerPositions || {},
    readerBookmarks: persisted.readerBookmarks || {},
    readerPrefs: Object.assign({}, DEFAULT_READER_PREFS, persisted.readerPrefs || {}),

    viewMode: "preview", // preview | raw | diff | code
    syncScroll: !!persisted.syncScroll,
    showLineNumbers: persisted.showLineNumbers !== false,
    wrapAllCode: !!persisted.wrapAllCode,
    diffChangesOnly: false,
    continueLang: "id",
    focusPanel: null, // null | "input" | "output"

    codeFilterLang: "all",
    codeFilterQuery: "",
    modalFilterLang: "all",
    modalFilterQuery: "",

    // Undo / Redo
    undoStack: [],
    redoStack: [],
    lastSavedInput: "",

    // Find & Replace
    findRegex: false,
    findCase: false,
    findWhole: false,
    findMatches: [],
    findCurrentIdx: -1,

    // Current Result Cache
    result: null,
    metadata: { headings: [], codeBlocks: [], plainText: "", stats: Parser.computeStats("") },
    diffOps: [],
    currentSandboxHtml: "",
    currentFocusBlock: null,
    lastClickedLineByCard: {},

    // Reader Runtime
    readerOpen: false,
    autoScrollActive: false,
    autoScrollRaf: null,
    autoScrollCarry: 0,
    ttsActive: false,
    ttsSessionId: 0,
    ttsParagraphs: [],
    ttsIndex: 0
  };

  /* ---------------------------------------------------------
     Toast Notifications
     --------------------------------------------------------- */
  function toast(msg, type) {
    const node = document.createElement("div");
    node.className = "toast " + (type || "info");
    node.textContent = msg;
    el.toastContainer.appendChild(node);
    setTimeout(function () {
      node.classList.add("fade-out");
      setTimeout(function () { node.remove(); }, 220);
    }, 2400);
  }

  function copyText(text, successMsg) {
    if (!text) {
      toast("Tidak ada teks untuk disalin.", "warning");
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast(successMsg || "Berhasil disalin!", "success");
      }).catch(function () {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast(successMsg || "Berhasil disalin!", "success");
    } catch (_) {
      toast("Gagal menyalin ke clipboard.", "warning");
    }
    ta.remove();
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------------------------------------------------------
     Theme & Font Controls
     --------------------------------------------------------- */
  const THEMES = ["dark", "book", "light"];
  const THEME_LABELS = { dark: "Dark", book: "Book", light: "Light" };

  function applyTheme(theme) {
    state.theme = THEMES.includes(theme) ? theme : "dark";
    document.documentElement.setAttribute("data-theme", state.theme);
    el.themeLabel.textContent = THEME_LABELS[state.theme];
    saveState({ theme: state.theme });
  }

  function applyFontSize(size) {
    const clamped = Math.min(22, Math.max(12, Number(size) || 14));
    state.fontSize = clamped;
    document.documentElement.style.setProperty("--editor-font-size", clamped + "px");
    el.fontSizeSlider.value = clamped;
    el.fontSizeLabel.textContent = clamped + "px";
    saveState({ fontSize: clamped });
  }

  /* ---------------------------------------------------------
     Undo / Redo Stack
     --------------------------------------------------------- */
  function pushUndoSnapshot(val) {
    if (val === state.lastSavedInput) return;
    state.undoStack.push(state.lastSavedInput);
    if (state.undoStack.length > 60) state.undoStack.shift();
    state.redoStack = [];
    state.lastSavedInput = val;
    updateUndoButtons();
  }

  function updateUndoButtons() {
    el.undoBtn.disabled = state.undoStack.length === 0;
    el.redoBtn.disabled = state.redoStack.length === 0;
  }

  function setInputValue(val, recordUndo) {
    if (recordUndo !== false) pushUndoSnapshot(el.rawInput.value);
    el.rawInput.value = val;
    state.lastSavedInput = val;
    updateUndoButtons();
    updateCursorStatus();
    processInputNow();
  }

  /* ---------------------------------------------------------
     Core Processing Pipeline (Adaptive Debounce for Huge Texts)
     --------------------------------------------------------- */
  let processTimer = null;

  function scheduleProcess() {
    clearTimeout(processTimer);
    const len = el.rawInput.value.length;
    const delay = len > 40000 ? 220 : (len > 10000 ? 110 : 40);
    processTimer = setTimeout(processInputNow, delay);
  }

  function processInputNow() {
    const raw = el.rawInput.value;
    const res = Parser.autoFix(raw, state.rules);
    const meta = Parser.extractMetadata(res.fixed);

    state.result = res;
    state.metadata = meta;

    // Update Diagnostic Badges
    renderDiagnostics(res);

    // Update Stats
    el.statWords.textContent = meta.stats.words.toLocaleString("id-ID");
    el.statChars.textContent = meta.stats.chars.toLocaleString("id-ID");
    el.statLines.textContent = meta.stats.lines.toLocaleString("id-ID");
    el.statCodeCount.textContent = meta.codeBlocks.length;
    el.statRead.textContent = meta.stats.readMinutes + " mnt";
    el.codeTabCount.textContent = meta.codeBlocks.length;

    // Truncation Banner
    if (res.truncated) {
      el.truncationBanner.classList.add("visible");
      el.truncationReasonText.textContent = res.truncationReason || "Teks berhenti di tengah kalimat atau blok kode.";
    } else {
      el.truncationBanner.classList.remove("visible");
    }

    // Raw Output
    el.rawOutput.value = res.fixed;

    // Rendered Preview
    if (!res.fixed) {
      el.previewOutput.innerHTML = buildEmptyStateHtml();
    } else {
      el.previewOutput.innerHTML = Renderer.renderMarkdown(res.fixed, meta, {
        showLineNumbers: state.showLineNumbers,
        wrapLines: state.wrapAllCode
      });
    }

    // TOC Bar
    renderTocBar(meta.headings);

    // Active Secondary Views
    if (state.viewMode === "diff") renderDiffView();
    if (state.viewMode === "code") renderCodeStudioView();
    if (el.codeExtractModal.classList.contains("open")) renderCodeExplorerModal();
    if (state.readerOpen) renderReaderContent(false);

    // Update Find Match Count if open
    if (el.findBar.classList.contains("open")) updateFindMatches();
  }

  function buildEmptyStateHtml() {
    return (
      '<div class="empty-state">' +
        '<div class="empty-state-icon">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' +
        "</div>" +
        "<h3>Siap Memperbaiki Output AI Studio</h3>" +
        "<p>Tempel hasil dari Google AI Studio / Gemini, atau seret file <code>.md</code> / <code>.txt</code> ke editor kiri untuk perbaikan otomatis, Code Studio, Live Sandbox Preview, dan Book Reader.</p>" +
        '<div class="empty-state-actions">' +
          '<button class="btn btn-sm btn-primary" type="button" data-empty-action="paste">Paste Clipboard</button>' +
          '<button class="btn btn-sm" type="button" data-empty-action="coding">Sample Coding</button>' +
          '<button class="btn btn-sm" type="button" data-empty-action="story">Sample Fanfiksi</button>' +
          '<button class="btn btn-sm" type="button" data-empty-action="math">Sample Math</button>' +
        "</div>" +
      "</div>"
    );
  }

  function renderDiagnostics(res) {
    const html = ['<span class="diag-title">Fix Log:</span>'];
    if (!el.rawInput.value.trim()) {
      html.push('<span class="badge">Menunggu input</span>');
    } else if (res.diagnostics.length === 0 && !res.truncated) {
      html.push('<span class="badge active-fix">&#10003; Format sudah bersih</span>');
    } else {
      res.diagnostics.forEach(function (d) {
        const cls = d.type === "info" ? "info-fix" : "active-fix";
        html.push('<span class="badge ' + cls + '">&#10003; ' + d.count + " " + Renderer.escapeHtml(d.label) + "</span>");
      });
      if (res.truncated) {
        html.push('<span class="badge warn-fix">&#9888; Terpotong</span>');
      }
    }
    el.diagBadges.innerHTML = html.join("");
  }

  function renderTocBar(headings) {
    if (!headings || headings.length === 0) {
      el.tocBar.innerHTML = '<span style="font-size:11.5px;color:var(--text-muted);">Belum ada heading (# / ##) terdeteksi.</span>';
      return;
    }
    el.tocBar.innerHTML = headings.map(function (h) {
      return '<button class="toc-chip lvl-' + Math.min(3, h.level) + '" type="button" data-jump-heading="' + Renderer.escapeHtml(h.id) + '">' + Renderer.escapeHtml(h.title) + "</button>";
    }).join("");
  }

  /* ---------------------------------------------------------
     View Mode Switcher (Preview / Raw / Diff / Code Studio)
     --------------------------------------------------------- */
  function setViewMode(mode) {
    state.viewMode = mode;
    [
      [el.modePreviewBtn, "preview"],
      [el.modeRawBtn, "raw"],
      [el.modeDiffBtn, "diff"],
      [el.modeCodeBtn, "code"]
    ].forEach(function (pair) {
      const active = pair[1] === mode;
      pair[0].classList.toggle("active", active);
      pair[0].setAttribute("aria-selected", active ? "true" : "false");
    });

    el.previewOutput.style.display = mode === "preview" ? "block" : "none";
    el.rawOutput.style.display = mode === "raw" ? "block" : "none";
    el.diffOutput.style.display = mode === "diff" ? "block" : "none";
    el.codeViewOutput.classList.toggle("open", mode === "code");
    el.diffToolbarBar.classList.toggle("open", mode === "diff");

    if (mode === "diff") renderDiffView();
    if (mode === "code") renderCodeStudioView();
  }

  function renderDiffView() {
    const raw = el.rawInput.value;
    const fixed = state.result ? state.result.fixed : "";
    state.diffOps = Parser.computeDiff(raw, fixed);
    const rendered = Renderer.renderDiffHtml(state.diffOps, state.diffChangesOnly);

    if (typeof rendered === "string") {
      el.diffOutput.innerHTML = rendered;
      el.diffStatsBadge.textContent = "+0 / -0 baris";
    } else {
      el.diffOutput.innerHTML = rendered.html;
      el.diffStatsBadge.textContent = "+" + rendered.added + " / -" + rendered.removed + " baris";
    }
  }

  /* ---------------------------------------------------------
     Dedicated Code Studio View & Code Explorer Modal
     --------------------------------------------------------- */
  function canRunCombinedWeb(blocks) {
    const hasHtml = blocks.some(function (b) { return b.lang === "html"; });
    const hasCssOrJs = blocks.some(function (b) { return b.lang === "css" || b.lang === "javascript"; });
    return hasHtml && hasCssOrJs;
  }

  function getFilteredBlocks(blocks, langFilter, query) {
    const q = (query || "").trim().toLowerCase();
    return blocks.filter(function (b) {
      if (langFilter && langFilter !== "all" && b.lang !== langFilter) return false;
      if (!q) return true;
      return b.lang.toLowerCase().includes(q) || b.filename.toLowerCase().includes(q) || b.code.toLowerCase().includes(q);
    });
  }

  function buildLangChipsHtml(blocks, activeLang) {
    const counts = {};
    blocks.forEach(function (b) { counts[b.lang] = (counts[b.lang] || 0) + 1; });
    const chips = ['<button class="lang-chip' + (activeLang === "all" ? " active" : "") + '" type="button" data-lang-filter="all">Semua (' + blocks.length + ")</button>"];
    Object.keys(counts).sort().forEach(function (lang) {
      chips.push(
        '<button class="lang-chip' + (activeLang === lang ? " active" : "") + '" type="button" data-lang-filter="' + Renderer.escapeHtml(lang) + '">' +
          Renderer.escapeHtml(lang.toUpperCase()) + " (" + counts[lang] + ")" +
        "</button>"
      );
    });
    return chips.join("");
  }

  function renderCodeStudioView() {
    const blocks = state.metadata.codeBlocks || [];
    if (blocks.length === 0) {
      el.codeViewOutput.innerHTML =
        '<div class="empty-state"><h3>Belum Ada Blok Kode</h3><p>Tempel output yang mengandung blok kode (<code>```</code>) untuk mengakses Code Studio, syntax highlighting, Live Sandbox Preview, dan ekspor .ZIP.</p></div>';
      return;
    }

    const filtered = getFilteredBlocks(blocks, state.codeFilterLang, state.codeFilterQuery);
    const webReady = canRunCombinedWeb(blocks);

    const headerHtml =
      '<div class="code-studio-header">' +
        '<div class="code-studio-top">' +
          '<input class="find-input" id="studioCodeSearch" type="text" placeholder="Filter nama file, bahasa, atau isi kode..." value="' + Renderer.escapeHtml(state.codeFilterQuery) + '">' +
          (webReady ? '<button class="btn btn-sm btn-accent-soft" type="button" data-studio-action="run-web">Run Web Preview (HTML+CSS+JS)</button>' : "") +
          '<button class="btn btn-sm" type="button" data-studio-action="zip">Download .ZIP (' + blocks.length + ")</button>" +
          '<button class="btn btn-sm btn-primary" type="button" data-studio-action="copy-all">Copy All</button>' +
        "</div>" +
        '<div class="lang-chips">' + buildLangChipsHtml(blocks, state.codeFilterLang) + "</div>" +
      "</div>";

    const cardsHtml = filtered.length === 0
      ? '<div class="empty-state"><p>Tidak ada blok kode yang cocok dengan filter.</p></div>'
      : filtered.map(function (b) {
          return Renderer.buildCodeCardHtml(b, {
            showLineNumbers: state.showLineNumbers,
            wrapLines: state.wrapAllCode,
            showJump: true,
            cardPrefix: "studio-code-"
          });
        }).join("");

    el.codeViewOutput.innerHTML = headerHtml + cardsHtml;

    const searchEl = $("studioCodeSearch");
    if (searchEl) {
      searchEl.addEventListener("input", function () {
        state.codeFilterQuery = searchEl.value;
        const pos = searchEl.selectionStart;
        renderCodeStudioView();
        const fresh = $("studioCodeSearch");
        if (fresh) { fresh.focus(); fresh.setSelectionRange(pos, pos); }
      });
    }
  }

  function renderCodeExplorerModal() {
    const blocks = state.metadata.codeBlocks || [];
    el.modalRunWebBtn.style.display = canRunCombinedWeb(blocks) ? "inline-flex" : "none";
    el.modalLangChips.innerHTML = buildLangChipsHtml(blocks, state.modalFilterLang);

    const filtered = getFilteredBlocks(blocks, state.modalFilterLang, state.modalFilterQuery);
    if (filtered.length === 0) {
      el.codeExtractBody.innerHTML = '<p style="font-size:13px;color:var(--text-muted);text-align:center;padding:24px;">Tidak ada blok kode ditemukan.</p>';
      return;
    }

    el.codeExtractBody.innerHTML = filtered.map(function (b) {
      return Renderer.buildCodeCardHtml(b, {
        showLineNumbers: state.showLineNumbers,
        wrapLines: state.wrapAllCode,
        showJump: true,
        cardPrefix: "modal-code-"
      });
    }).join("");
  }

  /* ---------------------------------------------------------
     Interactive Code Card Event Delegation (Works in Preview,
     Code Studio, Modal, Focus & Reader!)
     --------------------------------------------------------- */
  function handleCodeCardInteraction(e) {
    // 1. Line Number Highlighting (Click or Shift+Click range!)
    const lnEl = e.target.closest(".code-gutter .ln");
    if (lnEl) {
      const card = lnEl.closest(".code-card");
      if (!card) return;
      const lineNum = Number(lnEl.dataset.line);
      const cardKey = card.id || card.dataset.codeIndex;

      if (e.shiftKey && state.lastClickedLineByCard[cardKey]) {
        const start = Math.min(state.lastClickedLineByCard[cardKey], lineNum);
        const end = Math.max(state.lastClickedLineByCard[cardKey], lineNum);
        card.querySelectorAll(".ln, .code-line").forEach(function (node) {
          const n = Number(node.dataset.line);
          node.classList.toggle("hl", n >= start && n <= end);
        });
      } else {
        const isAlready = lnEl.classList.contains("hl");
        const targetLn = card.querySelector('.code-line[data-line="' + lineNum + '"]');
        lnEl.classList.toggle("hl", !isAlready);
        if (targetLn) targetLn.classList.toggle("hl", !isAlready);
        state.lastClickedLineByCard[cardKey] = lineNum;
      }
      return;
    }

    // 2. Code Studio Filter Chips / Actions
    const langChip = e.target.closest(".lang-chip");
    if (langChip) {
      const lang = langChip.dataset.langFilter;
      if (e.target.closest("#codeViewOutput")) {
        state.codeFilterLang = lang;
        renderCodeStudioView();
      } else if (e.target.closest("#codeExtractModal")) {
        state.modalFilterLang = lang;
        renderCodeExplorerModal();
      }
      return;
    }

    const studioBtn = e.target.closest("[data-studio-action]");
    if (studioBtn) {
      const act = studioBtn.dataset.studioAction;
      if (act === "run-web") openSandbox(null);
      if (act === "zip") exportCodeZip();
      if (act === "copy-all") copyAllCodeBlocks();
      return;
    }

    // 3. Per-Card Action Buttons
    const actionBtn = e.target.closest("[data-code-action]");
    if (!actionBtn) return;

    const card = actionBtn.closest(".code-card");
    if (!card) return;
    const idx = Number(card.dataset.codeIndex);
    const block = state.metadata.codeBlocks[idx];
    const action = actionBtn.dataset.codeAction;

    if (action === "collapse") {
      card.classList.toggle("collapsed");
      return;
    }
    if (action === "wrap") {
      card.classList.toggle("wrap-lines");
      actionBtn.classList.toggle("active-toggle", card.classList.contains("wrap-lines"));
      return;
    }
    if (!block) return;

    if (action === "copy") {
      copyText(block.code, "Kode (" + block.filename + ") disalin!");
      const orig = actionBtn.textContent;
      actionBtn.textContent = "Copied ✓";
      setTimeout(function () { actionBtn.textContent = orig; }, 1200);
    } else if (action === "download") {
      downloadBlob(new Blob([block.code], { type: "text/plain;charset=utf-8" }), block.filename);
      toast("Mengunduh " + block.filename, "success");
    } else if (action === "preview") {
      openSandbox(block);
    } else if (action === "format-json") {
      try {
        const pretty = JSON.stringify(JSON.parse(block.code), null, 2);
        block.code = pretty;
        block.lines = pretty.split("\n").length;
        block.bytes = new Blob([pretty]).size;
        const freshHtml = Renderer.buildCodeCardHtml(block, {
          showLineNumbers: state.showLineNumbers,
          wrapLines: card.classList.contains("wrap-lines"),
          showJump: !!card.querySelector('[data-code-action="jump"]'),
          cardPrefix: card.id.replace(/\d+$/, "")
        });
        card.outerHTML = freshHtml;
        toast("JSON dirapikan!", "success");
      } catch (err) {
        toast("JSON tidak valid: " + err.message, "warning");
      }
    } else if (action === "focus") {
      openCodeFocusModal(block);
    } else if (action === "jump") {
      closeModal(el.codeExtractModal);
      setViewMode("preview");
      setMobilePane("output");
      setTimeout(function () {
        const target = document.getElementById("code-block-" + block.index);
        if (target) {
          target.classList.remove("collapsed");
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("code-card-highlight");
          setTimeout(function () { target.classList.remove("code-card-highlight"); }, 1600);
        }
      }, 60);
    }
  }

  function openSandbox(singleBlock) {
    const blocks = state.metadata.codeBlocks || [];
    const html = Renderer.buildCombinedWebHtml(blocks, singleBlock);
    state.currentSandboxHtml = html;
    el.sandboxTitle.textContent = singleBlock
      ? "Live Sandbox: " + singleBlock.filename
      : "Live Web Sandbox (HTML + CSS + JS)";
    el.sandboxFrame.srcdoc = html;
    openModal(el.sandboxModal);
  }

  function openCodeFocusModal(block) {
    state.currentFocusBlock = block;
    el.codeFocusTitle.textContent = block.filename + " (" + block.lang.toUpperCase() + " • " + block.lines + " baris)";
    el.codeFocusBody.innerHTML = Renderer.buildCodeCardHtml(block, {
      showLineNumbers: true,
      wrapLines: false,
      cardPrefix: "focus-code-"
    });
    openModal(el.codeFocusModal);
  }

  function copyAllCodeBlocks() {
    const blocks = state.metadata.codeBlocks || [];
    if (blocks.length === 0) {
      toast("Tidak ada blok kode untuk disalin.", "warning");
      return;
    }
    const merged = blocks.map(function (b) {
      return "// ===== " + b.filename + " (" + b.lang + ") =====\n" + b.code;
    }).join("\n\n");
    copyText(merged, "Semua " + blocks.length + " blok kode disalin!");
  }

  function exportCodeZip() {
    const blocks = state.metadata.codeBlocks || [];
    if (blocks.length === 0) {
      toast("Tidak ada blok kode untuk dikemas menjadi .ZIP.", "warning");
      return;
    }
    const files = blocks.map(function (b) {
      return { name: b.filename, content: b.code };
    });
    const zipBlob = Parser.buildZipBlob(files);
    downloadBlob(zipBlob, "ai-studio-code-blocks.zip");
    toast("Arsip ZIP (" + files.length + " file) berhasil diunduh!", "success");
  }

  /* ---------------------------------------------------------
     Rules & History Menus
     --------------------------------------------------------- */
  function renderRulesMenu() {
    const activeCount = Parser.RULE_DEFINITIONS.filter(function (r) { return !!state.rules[r.id]; }).length;
    el.rulesActiveBadge.textContent = activeCount;

    const head =
      '<div class="dropdown-header">' +
        "<span>Auto-Heal Rules (" + activeCount + "/" + Parser.RULE_DEFINITIONS.length + ")</span>" +
        '<button class="btn btn-sm" type="button" id="resetRulesBtn">Reset</button>' +
      "</div>";

    const rows = Parser.RULE_DEFINITIONS.map(function (r) {
      const checked = state.rules[r.id] ? " checked" : "";
      return (
        '<label class="rule-toggle">' +
          '<span class="rule-toggle-text"><strong>' + Renderer.escapeHtml(r.label) + "</strong><small>" + Renderer.escapeHtml(r.desc) + "</small></span>" +
          '<input type="checkbox" data-rule-id="' + r.id + '"' + checked + ">" +
        "</label>"
      );
    }).join("");

    el.rulesMenu.innerHTML = head + rows;

    const resetBtn = $("resetRulesBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        state.rules = Parser.getDefaultRules();
        saveState({ rules: state.rules });
        renderRulesMenu();
        processInputNow();
        toast("Aturan perbaikan dikembalikan ke default.", "info");
      });
    }
  }

  function saveSnapshotToHistory() {
    const raw = el.rawInput.value.trim();
    if (!raw || raw.length < 15) return;
    if (state.history.length > 0 && state.history[0].raw === raw) return;

    const titleLine = raw.split("\n").find(function (l) { return l.trim().length > 0; }) || "Snapshot";
    const entry = {
      id: Date.now(),
      title: titleLine.replace(/^#+\s*/, "").slice(0, 56),
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      words: state.metadata.stats.words,
      pinned: false,
      raw: raw
    };

    const pinned = state.history.filter(function (h) { return h.pinned; });
    const unpinned = state.history.filter(function (h) { return !h.pinned; });
    unpinned.unshift(entry);
    state.history = pinned.concat(unpinned.slice(0, 15));
    saveState({ history: state.history });
    renderHistoryMenu();
  }

  function renderHistoryMenu() {
    el.historyCount.textContent = state.history.length;
    if (state.history.length === 0) {
      el.historyMenu.innerHTML =
        '<div class="dropdown-header"><span>Riwayat Snapshot</span></div>' +
        '<p style="padding:12px;font-size:12px;color:var(--text-muted);text-align:center;">Belum ada riwayat tersimpan. Snapshot otomatis tersimpan saat Anda menyalin atau memuat teks baru.</p>';
      return;
    }

    const head =
      '<div class="dropdown-header">' +
        "<span>Riwayat (" + state.history.length + ")</span>" +
        '<div style="display:flex;gap:4px;">' +
          '<button class="btn btn-sm" type="button" data-hist-action="save-now">Simpan Kini</button>' +
          '<button class="btn btn-sm" type="button" data-hist-action="clear-all">Hapus</button>' +
        "</div>" +
      "</div>";

    const items = state.history.map(function (h) {
      return (
        '<div class="history-item-row">' +
          '<button class="history-item-main" type="button" data-hist-action="load" data-hist-id="' + h.id + '">' +
            "<strong>" + (h.pinned ? "★ " : "") + Renderer.escapeHtml(h.title) + "</strong>" +
            "<small>" + Renderer.escapeHtml(h.time) + " &bull; " + h.words + " kata</small>" +
          "</button>" +
          '<button class="btn btn-sm btn-icon" type="button" data-hist-action="pin" data-hist-id="' + h.id + '" title="Pin/Unpin">' + (h.pinned ? "★" : "☆") + "</button>" +
          '<button class="btn btn-sm btn-icon" type="button" data-hist-action="del" data-hist-id="' + h.id + '" title="Hapus">&times;</button>' +
        "</div>"
      );
    }).join("");

    el.historyMenu.innerHTML = head + items;
  }

  /* ---------------------------------------------------------
     Find & Replace Engine (Regex-Safe + Prev/Next Match)
     --------------------------------------------------------- */
  function buildFindRegex() {
    const pattern = el.findInput.value;
    if (!pattern) return null;
    try {
      let src = state.findRegex ? pattern : pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (state.findWhole) src = "\\b" + src + "\\b";
      const flags = "g" + (state.findCase ? "" : "i");
      const re = new RegExp(src, flags);
      el.findInput.classList.remove("input-error");
      return re;
    } catch (_) {
      el.findInput.classList.add("input-error");
      return "ERROR";
    }
  }

  function updateFindMatches() {
    const re = buildFindRegex();
    state.findMatches = [];
    if (re === "ERROR") {
      el.findCount.textContent = "Regex error";
      return;
    }
    if (!re) {
      el.findCount.textContent = "0 cocok";
      state.findCurrentIdx = -1;
      return;
    }

    const text = el.rawInput.value;
    let m;
    let guard = 0;
    while ((m = re.exec(text)) !== null && guard < 10000) {
      state.findMatches.push({ start: m.index, end: m.index + m[0].length });
      if (m[0].length === 0) re.lastIndex++;
      guard++;
    }

    if (state.findCurrentIdx >= state.findMatches.length) state.findCurrentIdx = 0;
    el.findCount.textContent = state.findMatches.length > 0
      ? ((state.findCurrentIdx >= 0 ? state.findCurrentIdx + 1 : 0) + "/" + state.findMatches.length)
      : "0 cocok";
  }

  function jumpToFindMatch(dir) {
    updateFindMatches();
    if (state.findMatches.length === 0) return;
    state.findCurrentIdx = (state.findCurrentIdx + dir + state.findMatches.length) % state.findMatches.length;
    const match = state.findMatches[state.findCurrentIdx];
    el.rawInput.focus();
    el.rawInput.setSelectionRange(match.start, match.end);
    el.findCount.textContent = (state.findCurrentIdx + 1) + "/" + state.findMatches.length;
    updateCursorStatus();
  }

  function replaceCurrentMatch() {
    updateFindMatches();
    if (state.findMatches.length === 0) return;
    if (state.findCurrentIdx < 0) state.findCurrentIdx = 0;
    const match = state.findMatches[state.findCurrentIdx];
    const val = el.rawInput.value;
    const nextVal = val.slice(0, match.start) + el.replaceInput.value + val.slice(match.end);
    setInputValue(nextVal, true);
    updateFindMatches();
    toast("1 kecocokan diganti.", "success");
  }

  function replaceAllMatches() {
    const re = buildFindRegex();
    if (!re || re === "ERROR") return;
    const val = el.rawInput.value;
    const count = state.findMatches.length;
    if (count === 0) return;
    const nextVal = val.replace(re, el.replaceInput.value);
    setInputValue(nextVal, true);
    updateFindMatches();
    toast(count + " kecocokan berhasil diganti!", "success");
  }

  /* ---------------------------------------------------------
     Editor Cursor Status & Resizable Split Pane & Sync Scroll
     --------------------------------------------------------- */
  function updateCursorStatus() {
    const ta = el.rawInput;
    const pos = ta.selectionStart || 0;
    const before = ta.value.slice(0, pos);
    const lines = before.split("\n");
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length + 1;
    el.cursorPos.textContent = "Baris " + lineNum + ", Kol " + colNum;

    const selLen = (ta.selectionEnd || 0) - pos;
    el.selectionInfo.textContent = selLen > 0 ? ("Dipilih: " + selLen + " karakter") : "";
  }

  function initSplitPane() {
    let dragging = false;

    el.splitDivider.addEventListener("mousedown", function (e) {
      e.preventDefault();
      dragging = true;
      el.splitDivider.classList.add("dragging");
      document.body.style.cursor = "col-resize";
    });

    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      const rect = el.workspace.getBoundingClientRect();
      const pct = Math.min(78, Math.max(22, ((e.clientX - rect.left) / rect.width) * 100));
      document.documentElement.style.setProperty("--split-left", pct.toFixed(1) + "%");
    });

    window.addEventListener("mouseup", function () {
      if (!dragging) return;
      dragging = false;
      el.splitDivider.classList.remove("dragging");
      document.body.style.cursor = "";
    });

    el.splitDivider.addEventListener("dblclick", function () {
      document.documentElement.style.setProperty("--split-left", "50%");
      toast("Ukuran panel direset 50:50.", "info");
    });
  }

  let syncingScroll = false;
  function bindSyncScroll() {
    function getActiveOutputScroller() {
      if (state.viewMode === "raw") return el.rawOutput;
      if (state.viewMode === "diff") return el.diffOutput;
      if (state.viewMode === "code") return el.codeViewOutput;
      return el.previewOutput;
    }

    el.rawInput.addEventListener("scroll", function () {
      if (!state.syncScroll || syncingScroll) return;
      const maxIn = el.rawInput.scrollHeight - el.rawInput.clientHeight;
      if (maxIn <= 0) return;
      const ratio = el.rawInput.scrollTop / maxIn;
      const outEl = getActiveOutputScroller();
      syncingScroll = true;
      outEl.scrollTop = ratio * (outEl.scrollHeight - outEl.clientHeight);
      requestAnimationFrame(function () { syncingScroll = false; });
    });

    [el.previewOutput, el.rawOutput, el.diffOutput, el.codeViewOutput].forEach(function (scroller) {
      scroller.addEventListener("scroll", function () {
        if (!state.syncScroll || syncingScroll) return;
        const maxOut = scroller.scrollHeight - scroller.clientHeight;
        if (maxOut <= 0) return;
        const ratio = scroller.scrollTop / maxOut;
        syncingScroll = true;
        el.rawInput.scrollTop = ratio * (el.rawInput.scrollHeight - el.rawInput.clientHeight);
        requestAnimationFrame(function () { syncingScroll = false; });
      });
    });
  }

  /* ---------------------------------------------------------
     BOOK & FANFICTION READER ENGINE (MASTERPIECE EDITION)
     --------------------------------------------------------- */
  function openBookReader() {
    if (!state.result || !state.result.fixed) {
      toast("Masukkan teks terlebih dahulu untuk membuka Book View.", "warning");
      return;
    }
    state.readerOpen = true;
    el.readerOverlay.classList.add("open");
    applyReaderPrefs();
    renderReaderContent(true);
    populateTtsVoices();
  }

  function closeBookReader() {
    state.readerOpen = false;
    stopAutoScroll();
    stopTts();
    closeReaderDrawer();
    el.readerOverlay.classList.remove("open", "bars-hidden");
    el.readerSettingsDrawer.classList.remove("open");
    el.readerSettingsToggleBtn.classList.remove("active");
  }

  function renderReaderContent(restoreScroll) {
    const md = state.result ? state.result.fixed : "";
    const meta = state.metadata;
    const html = Renderer.renderMarkdown(md, meta, {
      bookMode: true,
      headingPrefix: "reader-",
      cardPrefix: "reader-code-",
      showLineNumbers: state.showLineNumbers
    });

    el.readerArticle.innerHTML = html;

    // Apply Dialogue Highlighting & Bionic Reading safely on text nodes
    Renderer.enhanceBookArticleDom(el.readerArticle, {
      dialogueHighlight: state.readerPrefs.dialogueHighlight,
      bionicReading: state.readerPrefs.bionicReading
    });

    // Update Chapter Title & Drawer Lists
    const firstHeading = meta.headings[0];
    el.readerChapterTitle.textContent = firstHeading ? firstHeading.title : "Mode Buku & Fanfiksi";
    renderReaderDrawerLists();

    // Restore saved reading position for this document
    if (restoreScroll) {
      const docHash = Parser.hashText(md);
      const savedPct = state.readerPositions[docHash];
      requestAnimationFrame(function () {
        if (typeof savedPct === "number" && savedPct > 0.02 && savedPct < 0.99) {
          const maxScroll = el.readerScroll.scrollHeight - el.readerScroll.clientHeight;
          el.readerScroll.scrollTop = Math.round(maxScroll * savedPct);
          toast("Melanjutkan bacaan dari " + Math.round(savedPct * 100) + "%", "info");
        } else {
          el.readerScroll.scrollTop = 0;
        }
        updateReaderProgress();
      });
    } else {
      updateReaderProgress();
    }
  }

  function applyReaderPrefs() {
    const p = state.readerPrefs;
    el.readerOverlay.setAttribute("data-rtheme", p.theme);
    el.readerThemeSelect.value = p.theme;
    el.readerFontSelect.value = p.font;
    el.readerWidthSelect.value = p.width;
    el.readerLineHeightSelect.value = String(p.lineHeight);
    el.readerFontSizeLabel.textContent = p.fontSize + "px";

    el.readerPage.className = "reader-page width-" + p.width + (p.twoColumns ? " two-columns" : "");
    el.readerArticle.className =
      "reader-article md-preview font-" + p.font +
      (p.justify ? " align-justify" : "") +
      (p.indent ? " book-indent" : "") +
      (p.dropCap ? " drop-cap" : "");
    el.readerArticle.style.fontSize = p.fontSize + "px";
    el.readerArticle.style.lineHeight = p.lineHeight;

    el.readerJustifyBtn.classList.toggle("active", p.justify);
    el.readerIndentBtn.classList.toggle("active", p.indent);
    el.readerDropCapBtn.classList.toggle("active", p.dropCap);
    el.readerDialogueBtn.classList.toggle("active", p.dialogueHighlight);
    el.readerBionicBtn.classList.toggle("active", p.bionicReading);
    el.readerRulerBtn.classList.toggle("active", p.readingRuler);
    el.readerColumnsBtn.classList.toggle("active", p.twoColumns);
    el.readerOverlay.classList.toggle("ruler-on", p.readingRuler);

    // Dimmer & Warmth Blue-Light Filter
    el.readerDimmerSlider.value = p.dimmer;
    el.readerDimmerLabel.textContent = p.dimmer + "%";
    el.readerWarmthSlider.value = p.warmth;
    el.readerWarmthLabel.textContent = p.warmth + "%";
    updateReaderDimmerLayer();

    el.readerAutoScrollSelect.value = String(p.autoScrollSpeed);
    el.readerTtsRateSelect.value = String(p.ttsRate);

    saveState({ readerPrefs: p });
  }

  function updateReaderDimmerLayer() {
    const d = Number(state.readerPrefs.dimmer) / 100;
    const w = Number(state.readerPrefs.warmth) / 100;
    if (d <= 0 && w <= 0) {
      el.readerDimmer.style.background = "transparent";
      return;
    }
    const r = Math.round(255 * w);
    const g = Math.round(145 * w);
    const b = 0;
    const alpha = Math.min(0.72, d + w * 0.45);
    el.readerDimmer.style.background = w > 0
      ? "rgba(" + Math.round(r * (1 - d)) + "," + Math.round(g * (1 - d)) + "," + b + "," + alpha.toFixed(2) + ")"
      : "rgba(0,0,0," + d.toFixed(2) + ")";
  }

  function updateReaderProgress() {
    const sc = el.readerScroll;
    const maxScroll = Math.max(1, sc.scrollHeight - sc.clientHeight);
    const ratio = Math.min(1, Math.max(0, sc.scrollTop / maxScroll));
    const pct = Math.round(ratio * 100);
    el.readerProgressFill.style.width = pct + "%";

    const totalMins = state.metadata.stats.readMinutes || 0;
    const remainingMins = Math.max(0, Math.ceil(totalMins * (1 - ratio)));
    el.readerStatusText.textContent = pct + "% • ~" + remainingMins + " mnt tersisa";

    // Highlight active chapter in title & drawer
    const headings = el.readerArticle.querySelectorAll("h1, h2, h3");
    let activeH = null;
    const scTop = sc.getBoundingClientRect().top + 80;
    headings.forEach(function (h) {
      if (h.getBoundingClientRect().top <= scTop) activeH = h;
    });
    if (activeH) {
      el.readerChapterTitle.textContent = activeH.textContent.trim();
      el.readerChaptersList.querySelectorAll(".drawer-list-item").forEach(function (btn) {
        btn.classList.toggle("active", btn.dataset.readerJump === activeH.id);
      });
    }

    // Save reading position debounced
    if (state.result && state.result.fixed) {
      const docHash = Parser.hashText(state.result.fixed);
      state.readerPositions[docHash] = Number(ratio.toFixed(3));
      saveState({ readerPositions: state.readerPositions });
    }
  }

  function jumpReaderChapter(dir) {
    const headings = Array.from(el.readerArticle.querySelectorAll("h1, h2, h3"));
    if (headings.length === 0) {
      toast("Tidak ada bab/heading di dokumen ini.", "info");
      return;
    }
    const scTop = el.readerScroll.getBoundingClientRect().top + 90;
    let currentIdx = -1;
    headings.forEach(function (h, idx) {
      if (h.getBoundingClientRect().top <= scTop) currentIdx = idx;
    });
    const targetIdx = Math.min(headings.length - 1, Math.max(0, currentIdx + dir));
    headings[targetIdx].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* Reader Slide-out Drawer (Chapters & Bookmarks) */
  function openReaderDrawer() {
    el.readerDrawer.classList.add("open");
    el.readerDrawerBackdrop.classList.add("open");
    renderReaderDrawerLists();
  }
  function closeReaderDrawer() {
    el.readerDrawer.classList.remove("open");
    el.readerDrawerBackdrop.classList.remove("open");
  }

  function renderReaderDrawerLists() {
    const headings = state.metadata.headings || [];
    if (headings.length === 0) {
      el.readerChaptersList.innerHTML = '<p style="font-size:12.5px;opacity:0.7;padding:12px;">Belum ada bab/heading (# / ##) dalam teks.</p>';
    } else {
      el.readerChaptersList.innerHTML = headings.map(function (h) {
        return '<button class="drawer-list-item lvl-' + Math.min(3, h.level) + '" type="button" data-reader-jump="reader-' + Renderer.escapeHtml(h.id) + '">' +
          '<span>' + Renderer.escapeHtml(h.title) + "</span>" +
        "</button>";
      }).join("");
    }

    const docHash = Parser.hashText(state.result ? state.result.fixed : "");
    const bms = state.readerBookmarks[docHash] || [];
    if (bms.length === 0) {
      el.readerBookmarksList.innerHTML = '<p style="font-size:12.5px;opacity:0.7;padding:12px;">Belum ada bookmark. Klik ikon bookmark di bar atas untuk menandai posisi bacaan saat ini.</p>';
    } else {
      el.readerBookmarksList.innerHTML = bms.map(function (bm) {
        return (
          '<div class="drawer-list-item" data-bm-pct="' + bm.pct + '">' +
            '<span style="flex:1;cursor:pointer;" data-bm-jump="' + bm.pct + '"><strong>' + Math.round(bm.pct * 100) + "%</strong> — " + Renderer.escapeHtml(bm.label) + "</span>" +
            '<button class="reader-btn" type="button" data-bm-del="' + bm.id + '" style="min-height:26px;padding:2px 7px;">&times;</button>' +
          "</div>"
        );
      }).join("");
    }
  }

  function addCurrentBookmark() {
    const sc = el.readerScroll;
    const maxScroll = Math.max(1, sc.scrollHeight - sc.clientHeight);
    const pct = Number(Math.min(1, Math.max(0, sc.scrollTop / maxScroll)).toFixed(3));
    const docHash = Parser.hashText(state.result ? state.result.fixed : "");
    if (!state.readerBookmarks[docHash]) state.readerBookmarks[docHash] = [];

    const label = el.readerChapterTitle.textContent.slice(0, 32) + " (" + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + ")";
    state.readerBookmarks[docHash].unshift({ id: Date.now(), pct: pct, label: label });
    saveState({ readerBookmarks: state.readerBookmarks });
    renderReaderDrawerLists();
    toast("Bookmark disimpan di " + Math.round(pct * 100) + "%!", "success");
  }

  /* Smooth RequestAnimationFrame Auto-Scroll Engine */
  function startAutoScroll() {
    const speed = Number(state.readerPrefs.autoScrollSpeed) || 1;
    if (speed <= 0) {
      state.readerPrefs.autoScrollSpeed = 1;
      el.readerAutoScrollSelect.value = "1";
    }
    state.autoScrollActive = true;
    el.readerAutoScrollToggleBtn.classList.add("active");
    el.readerAutoScrollToggleBtn.textContent = "Pause";

    let lastTs = performance.now();
    function step(now) {
      if (!state.autoScrollActive || !state.readerOpen) return;
      const dt = Math.min(50, now - lastTs) / 16.67;
      lastTs = now;
      const spd = Number(state.readerPrefs.autoScrollSpeed) || 1;
      state.autoScrollCarry += spd * 0.45 * dt;
      if (state.autoScrollCarry >= 1) {
        const px = Math.floor(state.autoScrollCarry);
        state.autoScrollCarry -= px;
        el.readerScroll.scrollTop += px;
        if (el.readerScroll.scrollTop + el.readerScroll.clientHeight >= el.readerScroll.scrollHeight - 2) {
          stopAutoScroll();
          toast("Selesai membaca halaman.", "info");
          return;
        }
      }
      state.autoScrollRaf = requestAnimationFrame(step);
    }
    state.autoScrollRaf = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    state.autoScrollActive = false;
    if (state.autoScrollRaf) cancelAnimationFrame(state.autoScrollRaf);
    state.autoScrollRaf = null;
    el.readerAutoScrollToggleBtn.classList.remove("active");
    el.readerAutoScrollToggleBtn.textContent = "Scroll";
  }

  function toggleAutoScroll() {
    if (state.autoScrollActive) stopAutoScroll();
    else startAutoScroll();
  }

  /* Upgraded Paragraph-Chunked TTS / Audiobook Engine (Fixes Chrome 15s Cutoff Bug!) */
  function populateTtsVoices() {
    if (!("speechSynthesis" in window)) {
      el.readerTtsVoiceSelect.innerHTML = '<option value="">TTS Tidak Didukung</option>';
      return;
    }
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;
    const savedUri = state.readerPrefs.ttsVoiceURI;
    el.readerTtsVoiceSelect.innerHTML = '<option value="">Otomatis</option>' + voices.map(function (v) {
      const sel = v.voiceURI === savedUri ? " selected" : "";
      return '<option value="' + Renderer.escapeHtml(v.voiceURI) + '"' + sel + ">" + Renderer.escapeHtml(v.name + " (" + v.lang + ")") + "</option>";
    }).join("");
  }

  function stopTts() {
    state.ttsSessionId++;
    state.ttsActive = false;
    if ("speechSynthesis" in window) {
      try { speechSynthesis.cancel(); } catch (_) {}
    }
    el.readerArticle.querySelectorAll(".tts-speaking").forEach(function (n) {
      n.classList.remove("tts-speaking");
    });
    el.readerTtsBtn.classList.remove("active");
    el.readerTtsBtn.textContent = "Bacakan";
  }

  function startTts() {
    if (!("speechSynthesis" in window)) {
      toast("Browser ini tidak mendukung Web Speech API (TTS).", "warning");
      return;
    }
    stopTts();
    const nodes = Array.from(el.readerArticle.querySelectorAll("h1, h2, h3, p, li, blockquote")).filter(function (n) {
      return n.textContent.trim().length > 0 && !n.closest(".code-card");
    });
    if (nodes.length === 0) {
      toast("Tidak ada teks prosa untuk dibacakan.", "warning");
      return;
    }

    // Start from first paragraph currently visible in viewport!
    const viewTop = el.readerScroll.getBoundingClientRect().top + 20;
    let startIdx = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].getBoundingClientRect().bottom >= viewTop) {
        startIdx = i;
        break;
      }
    }

    state.ttsActive = true;
    state.ttsParagraphs = nodes;
    state.ttsIndex = startIdx;
    const mySession = ++state.ttsSessionId;

    el.readerTtsBtn.classList.add("active");
    el.readerTtsBtn.textContent = "Stop TTS";
    speakNextParagraph(mySession);
  }

  function speakNextParagraph(sessionId) {
    if (!state.ttsActive || sessionId !== state.ttsSessionId) return;
    if (state.ttsIndex >= state.ttsParagraphs.length) {
      stopTts();
      toast("Pembacaan selesai.", "success");
      return;
    }

    el.readerArticle.querySelectorAll(".tts-speaking").forEach(function (n) {
      n.classList.remove("tts-speaking");
    });
    const node = state.ttsParagraphs[state.ttsIndex];
    node.classList.add("tts-speaking");
    node.scrollIntoView({ behavior: "smooth", block: "center" });

    const text = node.textContent.trim();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = Number(state.readerPrefs.ttsRate) || 1;

    const voices = speechSynthesis.getVoices();
    if (state.readerPrefs.ttsVoiceURI) {
      const chosen = voices.find(function (v) { return v.voiceURI === state.readerPrefs.ttsVoiceURI; });
      if (chosen) utter.voice = chosen;
    } else {
      const idVoice = voices.find(function (v) { return /^id/i.test(v.lang); });
      if (idVoice) utter.voice = idVoice;
    }

    utter.onend = function () {
      if (sessionId !== state.ttsSessionId) return;
      state.ttsIndex++;
      speakNextParagraph(sessionId);
    };
    utter.onerror = function () {
      if (sessionId !== state.ttsSessionId) return;
      stopTts();
    };

    speechSynthesis.speak(utter);
  }

  /* ---------------------------------------------------------
     Modals, Dropdowns & Mobile Helpers
     --------------------------------------------------------- */
  function closeAllDropdowns() {
    document.querySelectorAll(".dropdown-menu.open").forEach(function (m) {
      m.classList.remove("open");
    });
  }

  function toggleDropdown(menuEl) {
    const wasOpen = menuEl.classList.contains("open");
    closeAllDropdowns();
    if (!wasOpen) menuEl.classList.add("open");
  }

  function openModal(backdrop) {
    closeAllDropdowns();
    backdrop.classList.add("open");
  }

  function closeModal(backdrop) {
    backdrop.classList.remove("open");
  }

  function setMobilePane(pane) {
    const isInput = pane === "input";
    el.inputPanel.classList.toggle("mobile-hidden", !isInput);
    el.outputPanel.classList.toggle("mobile-hidden", isInput);
    el.mobTabInput.classList.toggle("active", isInput);
    el.mobTabOutput.classList.toggle("active", !isInput);
    el.mobBarInput.classList.toggle("active", isInput);
    el.mobBarOutput.classList.toggle("active", !isInput);
  }

  function togglePanelFocus(which) {
    if (state.focusPanel === which) {
      state.focusPanel = null;
      el.workspace.classList.remove("focus-input", "focus-output");
    } else {
      state.focusPanel = which;
      el.workspace.classList.toggle("focus-input", which === "input");
      el.workspace.classList.toggle("focus-output", which === "output");
    }
  }

  /* ---------------------------------------------------------
     Exports & Pop-out Tab
     --------------------------------------------------------- */
  function openStandalonePreviewTab() {
    if (!state.result || !state.result.fixed) {
      toast("Tidak ada konten untuk dibuka.", "warning");
      return;
    }
    const title = (state.metadata.headings[0] && state.metadata.headings[0].title) || "AI Studio Fixed Output";
    const bodyHtml = Renderer.renderMarkdown(state.result.fixed, state.metadata, { bookMode: true });
    const fullHtml = Renderer.generateStandaloneBookHtml(title, bodyHtml, state.metadata.headings, state.readerPrefs.theme === "dark" ? "dark" : "sepia");
    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
  }

  function handleExport(type) {
    closeAllDropdowns();
    const fixed = state.result ? state.result.fixed : "";
    if (!fixed && type !== "print") {
      toast("Belum ada konten untuk diekspor.", "warning");
      return;
    }

    if (type === "md") {
      downloadBlob(new Blob([fixed], { type: "text/markdown;charset=utf-8" }), "ai-studio-fixed.md");
      toast("File Markdown (.md) diunduh!", "success");
    } else if (type === "txt") {
      downloadBlob(new Blob([state.metadata.plainText], { type: "text/plain;charset=utf-8" }), "ai-studio-clean.txt");
      toast("File Plain Text (.txt) diunduh!", "success");
    } else if (type === "html") {
      const title = (state.metadata.headings[0] && state.metadata.headings[0].title) || "AI Studio Book";
      const bodyHtml = Renderer.renderMarkdown(fixed, state.metadata, { bookMode: true });
      const html = Renderer.generateStandaloneBookHtml(title, bodyHtml, state.metadata.headings, "sepia");
      downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), "ai-studio-book.html");
      toast("Interactive Book (.html) diunduh!", "success");
    } else if (type === "zip") {
      exportCodeZip();
    } else if (type === "json") {
      const payload = {
        exportedAt: new Date().toISOString(),
        stats: state.metadata.stats,
        diagnostics: state.result.diagnostics,
        headings: state.metadata.headings,
        codeBlocks: state.metadata.codeBlocks,
        markdown: fixed
      };
      downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" }), "ai-studio-output.json");
      toast("Data terstruktur (.json) diunduh!", "success");
    } else if (type === "print") {
      window.print();
    }
  }

  /* ---------------------------------------------------------
     Paste & Import Helpers
     --------------------------------------------------------- */
  function pasteFromClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      toast("Gunakan Ctrl+V di kotak editor (browser membatasi clipboard otomatis).", "info");
      el.rawInput.focus();
      return;
    }
    navigator.clipboard.readText().then(function (txt) {
      if (!txt) {
        toast("Clipboard kosong.", "warning");
        return;
      }
      saveSnapshotToHistory();
      setInputValue(txt, true);
      setMobilePane("output");
      toast("Teks berhasil ditempel & diperbaiki!", "success");
    }).catch(function () {
      toast("Izin clipboard ditolak. Tempel manual dengan Ctrl+V.", "warning");
      el.rawInput.focus();
    });
  }

  function loadFileObject(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      saveSnapshotToHistory();
      setInputValue(String(ev.target.result || ""), true);
      toast("File '" + file.name + "' dimuat!", "success");
    };
    reader.readAsText(file);
  }

  /* ---------------------------------------------------------
     Continuation Prompt & Stitcher Modals
     --------------------------------------------------------- */
  function refreshContinueModalText() {
    const fixed = state.result ? state.result.fixed : el.rawInput.value;
    const reason = state.result ? state.result.truncationReason : "";
    el.continuePromptText.value = Parser.generateContinuePrompt(fixed, reason, state.continueLang);
    el.continueLangIdBtn.classList.toggle("active", state.continueLang === "id");
    el.continueLangEnBtn.classList.toggle("active", state.continueLang === "en");
  }

  function openContinueModal() {
    if (!el.rawInput.value.trim()) {
      toast("Masukkan teks terlebih dahulu.", "warning");
      return;
    }
    refreshContinueModalText();
    openModal(el.continueModal);
  }

  function openStitchModal() {
    el.stitchPart2Input.value = "";
    el.stitchPreviewInfo.textContent = "Tempel lanjutan (Part 2) untuk melihat pratinjau penggabungan...";
    el.stitchPreviewInfo.className = "badge";
    openModal(el.stitchModal);
    setTimeout(function () { el.stitchPart2Input.focus(); }, 60);
  }

  /* ---------------------------------------------------------
     Event Bindings
     --------------------------------------------------------- */
  function bindEvents() {
    // Header
    el.fontSizeSlider.addEventListener("input", function () { applyFontSize(el.fontSizeSlider.value); });

    el.themeToggle.addEventListener("click", function () {
      const idx = (THEMES.indexOf(state.theme) + 1) % THEMES.length;
      applyTheme(THEMES[idx]);
      toast("Tema: " + THEME_LABELS[state.theme], "info");
    });

    el.samplesBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleDropdown(el.samplesMenu); });
    el.samplesMenu.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-sample]");
      if (!btn) return;
      const key = btn.dataset.sample;
      if (SAMPLES[key]) {
        saveSnapshotToHistory();
        setInputValue(SAMPLES[key], true);
        closeAllDropdowns();
        toast("Sample '" + key + "' dimuat!", "success");
      }
    });

    el.rulesBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleDropdown(el.rulesMenu); });
    el.rulesMenu.addEventListener("change", function (e) {
      const cb = e.target.closest("[data-rule-id]");
      if (!cb) return;
      state.rules[cb.dataset.ruleId] = cb.checked;
      saveState({ rules: state.rules });
      renderRulesMenu();
      processInputNow();
    });

    el.historyBtn.addEventListener("click", function (e) { e.stopPropagation(); renderHistoryMenu(); toggleDropdown(el.historyMenu); });
    el.historyMenu.addEventListener("click", function (e) {
      e.stopPropagation();
      const btn = e.target.closest("[data-hist-action]");
      if (!btn) return;
      const act = btn.dataset.histAction;
      const id = Number(btn.dataset.histId);

      if (act === "save-now") {
        saveSnapshotToHistory();
        toast("Snapshot disimpan!", "success");
      } else if (act === "clear-all") {
        state.history = state.history.filter(function (h) { return h.pinned; });
        saveState({ history: state.history });
        renderHistoryMenu();
        toast("Riwayat non-pin dibersihkan.", "info");
      } else if (act === "load") {
        const found = state.history.find(function (h) { return h.id === id; });
        if (found) {
          setInputValue(found.raw, true);
          closeAllDropdowns();
          toast("Snapshot dipulihkan!", "success");
        }
      } else if (act === "pin") {
        const found = state.history.find(function (h) { return h.id === id; });
        if (found) {
          found.pinned = !found.pinned;
          state.history.sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); });
          saveState({ history: state.history });
          renderHistoryMenu();
        }
      } else if (act === "del") {
        state.history = state.history.filter(function (h) { return h.id !== id; });
        saveState({ history: state.history });
        renderHistoryMenu();
      }
    });

    el.exportBtn.addEventListener("click", function (e) { e.stopPropagation(); toggleDropdown(el.exportMenu); });
    el.exportMenu.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-export]");
      if (btn) handleExport(btn.dataset.export);
    });

    el.shortcutsBtn.addEventListener("click", function () { openModal(el.shortcutsModal); });
    el.closeShortcutsModalBtn.addEventListener("click", function () { closeModal(el.shortcutsModal); });

    // Input Editor & Actions
    let undoDebounce = null;
    el.rawInput.addEventListener("input", function () {
      updateCursorStatus();
      scheduleProcess();
      clearTimeout(undoDebounce);
      undoDebounce = setTimeout(function () {
        pushUndoSnapshot(el.rawInput.value);
      }, 600);
    });

    el.rawInput.addEventListener("keyup", updateCursorStatus);
    el.rawInput.addEventListener("click", updateCursorStatus);

    el.undoBtn.addEventListener("click", function () {
      if (state.undoStack.length === 0) return;
      state.redoStack.push(el.rawInput.value);
      const prev = state.undoStack.pop();
      el.rawInput.value = prev;
      state.lastSavedInput = prev;
      updateUndoButtons();
      processInputNow();
    });

    el.redoBtn.addEventListener("click", function () {
      if (state.redoStack.length === 0) return;
      state.undoStack.push(el.rawInput.value);
      const next = state.redoStack.pop();
      el.rawInput.value = next;
      state.lastSavedInput = next;
      updateUndoButtons();
      processInputNow();
    });

    el.pasteBtn.addEventListener("click", pasteFromClipboard);
    el.stitchBtn.addEventListener("click", openStitchModal);
    el.bannerStitchBtn.addEventListener("click", openStitchModal);

    el.importFileBtn.addEventListener("click", function () { el.fileInput.click(); });
    el.fileInput.addEventListener("change", function () {
      if (el.fileInput.files && el.fileInput.files[0]) {
        loadFileObject(el.fileInput.files[0]);
        el.fileInput.value = "";
      }
    });

    // Drag & Drop File Support
    ["dragenter", "dragover"].forEach(function (evName) {
      el.inputPanel.addEventListener(evName, function (e) {
        e.preventDefault();
        el.inputPanel.classList.add("drag-over");
      });
    });
    ["dragleave", "drop"].forEach(function (evName) {
      el.inputPanel.addEventListener(evName, function (e) {
        e.preventDefault();
        el.inputPanel.classList.remove("drag-over");
        if (evName === "drop" && e.dataTransfer && e.dataTransfer.files[0]) {
          loadFileObject(e.dataTransfer.files[0]);
        }
      });
    });

    el.clearBtn.addEventListener("click", function () {
      if (!el.rawInput.value) return;
      saveSnapshotToHistory();
      setInputValue("", true);
      toast("Editor dikosongkan (tersimpan di History).", "info");
    });

    el.focusInputBtn.addEventListener("click", function () { togglePanelFocus("input"); });
    el.focusOutputBtn.addEventListener("click", function () { togglePanelFocus("output"); });

    // Find & Replace
    el.findToggleBtn.addEventListener("click", function () {
      el.findBar.classList.toggle("open");
      if (el.findBar.classList.contains("open")) {
        el.findInput.focus();
        updateFindMatches();
      }
    });
    el.closeFindBtn.addEventListener("click", function () { el.findBar.classList.remove("open"); });
    el.findInput.addEventListener("input", updateFindMatches);
    el.findInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); jumpToFindMatch(e.shiftKey ? -1 : 1); }
    });
    el.regexToggle.addEventListener("click", function () {
      state.findRegex = !state.findRegex;
      el.regexToggle.classList.toggle("active", state.findRegex);
      updateFindMatches();
    });
    el.caseToggle.addEventListener("click", function () {
      state.findCase = !state.findCase;
      el.caseToggle.classList.toggle("active", state.findCase);
      updateFindMatches();
    });
    el.wholeWordToggle.addEventListener("click", function () {
      state.findWhole = !state.findWhole;
      el.wholeWordToggle.classList.toggle("active", state.findWhole);
      updateFindMatches();
    });
    el.findPrevBtn.addEventListener("click", function () { jumpToFindMatch(-1); });
    el.findNextBtn.addEventListener("click", function () { jumpToFindMatch(1); });
    el.replaceNextBtn.addEventListener("click", replaceCurrentMatch);
    el.replaceAllBtn.addEventListener("click", replaceAllMatches);

    // Output View Modes & Controls
    el.modePreviewBtn.addEventListener("click", function () { setViewMode("preview"); });
    el.modeRawBtn.addEventListener("click", function () { setViewMode("raw"); });
    el.modeDiffBtn.addEventListener("click", function () { setViewMode("diff"); });
    el.modeCodeBtn.addEventListener("click", function () { setViewMode("code"); });

    el.syncScrollBtn.addEventListener("click", function () {
      state.syncScroll = !state.syncScroll;
      el.syncScrollBtn.classList.toggle("active-toggle", state.syncScroll);
      saveState({ syncScroll: state.syncScroll });
      toast("Sync Scroll: " + (state.syncScroll ? "Aktif" : "Nonaktif"), "info");
    });

    el.tocToggleBtn.addEventListener("click", function () {
      el.tocBar.classList.toggle("open");
      el.tocToggleBtn.classList.toggle("active-toggle", el.tocBar.classList.contains("open"));
    });

    el.tocBar.addEventListener("click", function (e) {
      const chip = e.target.closest("[data-jump-heading]");
      if (!chip) return;
      setViewMode("preview");
      const target = document.getElementById(chip.dataset.jumpHeading);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    el.codeBarToggleBtn.addEventListener("click", function () {
      el.codeToolbarBar.classList.toggle("open");
      el.codeBarToggleBtn.classList.toggle("active-toggle", el.codeToolbarBar.classList.contains("open"));
    });

    el.expandAllCodeBtn.addEventListener("click", function () {
      document.querySelectorAll("#previewOutput .code-card, #codeViewOutput .code-card").forEach(function (c) { c.classList.remove("collapsed"); });
    });
    el.collapseAllCodeBtn.addEventListener("click", function () {
      document.querySelectorAll("#previewOutput .code-card, #codeViewOutput .code-card").forEach(function (c) { c.classList.add("collapsed"); });
    });
    el.toggleLineNumsBtn.addEventListener("click", function () {
      state.showLineNumbers = !state.showLineNumbers;
      el.toggleLineNumsBtn.classList.toggle("btn-primary", state.showLineNumbers);
      saveState({ showLineNumbers: state.showLineNumbers });
      document.querySelectorAll(".code-gutter").forEach(function (g) { g.classList.toggle("hidden", !state.showLineNumbers); });
    });
    el.toggleWrapAllBtn.addEventListener("click", function () {
      state.wrapAllCode = !state.wrapAllCode;
      el.toggleWrapAllBtn.classList.toggle("btn-primary", state.wrapAllCode);
      saveState({ wrapAllCode: state.wrapAllCode });
      document.querySelectorAll(".code-card").forEach(function (c) { c.classList.toggle("wrap-lines", state.wrapAllCode); });
    });

    el.openCodeModalBtn.addEventListener("click", function () {
      renderCodeExplorerModal();
      openModal(el.codeExtractModal);
    });
    el.downloadZipBtn.addEventListener("click", exportCodeZip);
    el.copyAllCodeBtn.addEventListener("click", copyAllCodeBlocks);

    // Diff Controls
    el.diffChangesOnlyBtn.addEventListener("click", function () {
      state.diffChangesOnly = !state.diffChangesOnly;
      el.diffChangesOnlyBtn.classList.toggle("btn-primary", state.diffChangesOnly);
      renderDiffView();
    });
    el.diffCopyPatchBtn.addEventListener("click", function () {
      const patch = state.diffOps.map(function (op) {
        const s = op.type === "add" ? "+ " : (op.type === "rem" ? "- " : "  ");
        return s + op.text;
      }).join("\n");
      copyText(patch, "Unified Diff disalin!");
    });

    // Empty State Quick Actions & Code Card Delegation
    el.previewOutput.addEventListener("click", function (e) {
      const emptyAct = e.target.closest("[data-empty-action]");
      if (emptyAct) {
        const k = emptyAct.dataset.emptyAction;
        if (k === "paste") pasteFromClipboard();
        else if (SAMPLES[k]) setInputValue(SAMPLES[k], true);
        return;
      }
      handleCodeCardInteraction(e);
    });
    el.codeViewOutput.addEventListener("click", handleCodeCardInteraction);
    el.codeExtractModal.addEventListener("click", handleCodeCardInteraction);
    el.codeFocusBody.addEventListener("click", handleCodeCardInteraction);
    el.readerArticle.addEventListener("click", handleCodeCardInteraction);

    // Output Quick Buttons
    el.readerModeBtn.addEventListener("click", openBookReader);
    el.openWindowBtn.addEventListener("click", openStandalonePreviewTab);
    el.continuePromptBtn.addEventListener("click", openContinueModal);
    el.bannerContinueBtn.addEventListener("click", openContinueModal);
    el.copyPlainBtn.addEventListener("click", function () {
      copyText(state.metadata.plainText, "Teks polos berhasil disalin!");
    });
    el.copyResultBtn.addEventListener("click", function () {
      saveSnapshotToHistory();
      copyText(state.result ? state.result.fixed : "", "Markdown hasil perbaikan disalin!");
    });

    // Continue Prompt Modal
    el.closeModalBtn.addEventListener("click", function () { closeModal(el.continueModal); });
    el.continueLangIdBtn.addEventListener("click", function () { state.continueLang = "id"; refreshContinueModalText(); });
    el.continueLangEnBtn.addEventListener("click", function () { state.continueLang = "en"; refreshContinueModalText(); });
    el.copyContinueBtn.addEventListener("click", function () {
      copyText(el.continuePromptText.value, "Continue Prompt disalin! Tempel ke Google AI Studio.");
      closeModal(el.continueModal);
    });

    // Stitch Modal
    el.closeStitchModalBtn.addEventListener("click", function () { closeModal(el.stitchModal); });
    el.stitchPart2Input.addEventListener("input", function () {
      const p2 = el.stitchPart2Input.value;
      if (!p2.trim()) {
        el.stitchPreviewInfo.textContent = "Menunggu teks lanjutan...";
        el.stitchPreviewInfo.className = "badge";
        return;
      }
      const preview = Parser.smartStitch(el.rawInput.value, p2);
      el.stitchPreviewInfo.textContent = preview.note;
      el.stitchPreviewInfo.className = "badge active-fix";
    });
    el.applyStitchBtn.addEventListener("click", function () {
      const p2 = el.stitchPart2Input.value;
      if (!p2.trim()) {
        toast("Tempel teks Part 2 terlebih dahulu.", "warning");
        return;
      }
      saveSnapshotToHistory();
      const stitched = Parser.smartStitch(el.rawInput.value, p2);
      setInputValue(stitched.merged, true);
      closeModal(el.stitchModal);
      toast(stitched.note, "success");
    });

    // Code Explorer Modal
    el.closeCodeModalBtn.addEventListener("click", function () { closeModal(el.codeExtractModal); });
    el.codeFilterInput.addEventListener("input", function () {
      state.modalFilterQuery = el.codeFilterInput.value;
      renderCodeExplorerModal();
    });
    el.modalExpandAllBtn.addEventListener("click", function () {
      el.codeExtractBody.querySelectorAll(".code-card").forEach(function (c) { c.classList.remove("collapsed"); });
    });
    el.modalCollapseAllBtn.addEventListener("click", function () {
      el.codeExtractBody.querySelectorAll(".code-card").forEach(function (c) { c.classList.add("collapsed"); });
    });
    el.modalRunWebBtn.addEventListener("click", function () { openSandbox(null); });
    el.modalDownloadZipBtn.addEventListener("click", exportCodeZip);
    el.modalCopyAllCodeBtn.addEventListener("click", copyAllCodeBlocks);

    // Sandbox Modal
    el.closeSandboxModalBtn.addEventListener("click", function () {
      el.sandboxFrame.srcdoc = "";
      closeModal(el.sandboxModal);
    });
    el.sandboxRefreshBtn.addEventListener("click", function () {
      el.sandboxFrame.srcdoc = state.currentSandboxHtml;
    });
    el.sandboxOpenTabBtn.addEventListener("click", function () {
      const blob = new Blob([state.currentSandboxHtml], { type: "text/html;charset=utf-8" });
      window.open(URL.createObjectURL(blob), "_blank", "noopener");
    });

    // Code Focus Modal
    el.closeCodeFocusBtn.addEventListener("click", function () { closeModal(el.codeFocusModal); });
    el.codeFocusCopyBtn.addEventListener("click", function () {
      if (state.currentFocusBlock) copyText(state.currentFocusBlock.code, "Kode disalin!");
    });
    el.codeFocusDownloadBtn.addEventListener("click", function () {
      if (state.currentFocusBlock) {
        downloadBlob(new Blob([state.currentFocusBlock.code], { type: "text/plain;charset=utf-8" }), state.currentFocusBlock.filename);
      }
    });

    // Mobile Tabs & Bottom Bar
    el.mobTabInput.addEventListener("click", function () { setMobilePane("input"); });
    el.mobTabOutput.addEventListener("click", function () { setMobilePane("output"); });
    el.mobBarInput.addEventListener("click", function () { setMobilePane("input"); });
    el.mobBarOutput.addEventListener("click", function () { setMobilePane("output"); });
    el.mobBarPaste.addEventListener("click", pasteFromClipboard);
    el.mobBarReader.addEventListener("click", openBookReader);
    el.mobBarCopy.addEventListener("click", function () {
      copyText(state.result ? state.result.fixed : "", "Hasil perbaikan disalin!");
    });

    // Book Reader Events
    bindBookReaderEvents();

    // Click Outside Closes Dropdowns & Modal Backdrops
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".dropdown-wrap")) closeAllDropdowns();
    });

    [el.continueModal, el.stitchModal, el.codeExtractModal, el.sandboxModal, el.codeFocusModal, el.shortcutsModal].forEach(function (bd) {
      bd.addEventListener("click", function (e) {
        if (e.target === bd) {
          if (bd === el.sandboxModal) el.sandboxFrame.srcdoc = "";
          closeModal(bd);
        }
      });
    });

    // Global & Reader Keyboard Shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);
  }

  function bindBookReaderEvents() {
    el.closeReaderBtn.addEventListener("click", closeBookReader);
    el.readerTocDrawerBtn.addEventListener("click", openReaderDrawer);
    el.closeReaderDrawerBtn.addEventListener("click", closeReaderDrawer);
    el.readerDrawerBackdrop.addEventListener("click", closeReaderDrawer);

    el.drawerTabChapters.addEventListener("click", function () {
      el.drawerTabChapters.classList.add("active");
      el.drawerTabBookmarks.classList.remove("active");
      el.readerChaptersList.style.display = "flex";
      el.readerBookmarksList.style.display = "none";
    });
    el.drawerTabBookmarks.addEventListener("click", function () {
      el.drawerTabBookmarks.classList.add("active");
      el.drawerTabChapters.classList.remove("active");
      el.readerBookmarksList.style.display = "flex";
      el.readerChaptersList.style.display = "none";
    });

    el.readerChaptersList.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-reader-jump]");
      if (!btn) return;
      const target = document.getElementById(btn.dataset.readerJump);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      closeReaderDrawer();
    });

    el.readerBookmarksList.addEventListener("click", function (e) {
      const del = e.target.closest("[data-bm-del]");
      if (del) {
        const id = Number(del.dataset.bmDel);
        const docHash = Parser.hashText(state.result ? state.result.fixed : "");
        state.readerBookmarks[docHash] = (state.readerBookmarks[docHash] || []).filter(function (b) { return b.id !== id; });
        saveState({ readerBookmarks: state.readerBookmarks });
        renderReaderDrawerLists();
        return;
      }
      const jmp = e.target.closest("[data-bm-jump]");
      if (jmp) {
        const pct = Number(jmp.dataset.bmJump);
        const maxS = el.readerScroll.scrollHeight - el.readerScroll.clientHeight;
        el.readerScroll.scrollTo({ top: Math.round(maxS * pct), behavior: "smooth" });
        closeReaderDrawer();
      }
    });

    el.readerBookmarkBtn.addEventListener("click", addCurrentBookmark);

    el.readerSettingsToggleBtn.addEventListener("click", function () {
      el.readerSettingsDrawer.classList.toggle("open");
      el.readerSettingsToggleBtn.classList.toggle("active", el.readerSettingsDrawer.classList.contains("open"));
    });

    el.readerHideBarsBtn.addEventListener("click", function () {
      el.readerOverlay.classList.add("bars-hidden");
      el.readerSettingsDrawer.classList.remove("open");
    });
    el.readerShowBarsBtn.addEventListener("click", function () {
      el.readerOverlay.classList.remove("bars-hidden");
    });
    el.readerPopoutBtn.addEventListener("click", openStandalonePreviewTab);

    // Tap Center of Page to Toggle Distraction-Free Bars (Kindle-style)
    el.readerScroll.addEventListener("click", function (e) {
      if (e.target.closest("a, button, input, select, .code-card, details")) return;
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) return;
      const rect = el.readerScroll.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / rect.height;
      if (relY > 0.2 && relY < 0.8) {
        el.readerOverlay.classList.toggle("bars-hidden");
      }
    });

    // Reading Ruler Follows Mouse / Touch
    el.readerScroll.addEventListener("mousemove", function (e) {
      if (!state.readerPrefs.readingRuler) return;
      el.readerRuler.style.top = e.clientY + "px";
    });

    // Settings Controls
    el.readerThemeSelect.addEventListener("change", function () { state.readerPrefs.theme = el.readerThemeSelect.value; applyReaderPrefs(); });
    el.readerFontSelect.addEventListener("change", function () { state.readerPrefs.font = el.readerFontSelect.value; applyReaderPrefs(); });
    el.readerWidthSelect.addEventListener("change", function () { state.readerPrefs.width = el.readerWidthSelect.value; applyReaderPrefs(); });
    el.readerLineHeightSelect.addEventListener("change", function () { state.readerPrefs.lineHeight = el.readerLineHeightSelect.value; applyReaderPrefs(); });

    el.readerFontDecBtn.addEventListener("click", function () {
      state.readerPrefs.fontSize = Math.max(13, state.readerPrefs.fontSize - 1);
      applyReaderPrefs();
    });
    el.readerFontIncBtn.addEventListener("click", function () {
      state.readerPrefs.fontSize = Math.min(30, state.readerPrefs.fontSize + 1);
      applyReaderPrefs();
    });

    el.readerJustifyBtn.addEventListener("click", function () { state.readerPrefs.justify = !state.readerPrefs.justify; applyReaderPrefs(); });
    el.readerIndentBtn.addEventListener("click", function () { state.readerPrefs.indent = !state.readerPrefs.indent; applyReaderPrefs(); });
    el.readerDropCapBtn.addEventListener("click", function () { state.readerPrefs.dropCap = !state.readerPrefs.dropCap; applyReaderPrefs(); });
    el.readerDialogueBtn.addEventListener("click", function () {
      state.readerPrefs.dialogueHighlight = !state.readerPrefs.dialogueHighlight;
      applyReaderPrefs();
      renderReaderContent(false);
    });
    el.readerBionicBtn.addEventListener("click", function () {
      state.readerPrefs.bionicReading = !state.readerPrefs.bionicReading;
      applyReaderPrefs();
      renderReaderContent(false);
    });
    el.readerRulerBtn.addEventListener("click", function () { state.readerPrefs.readingRuler = !state.readerPrefs.readingRuler; applyReaderPrefs(); });
    el.readerColumnsBtn.addEventListener("click", function () { state.readerPrefs.twoColumns = !state.readerPrefs.twoColumns; applyReaderPrefs(); });

    el.readerDimmerSlider.addEventListener("input", function () {
      state.readerPrefs.dimmer = Number(el.readerDimmerSlider.value);
      applyReaderPrefs();
    });
    el.readerWarmthSlider.addEventListener("input", function () {
      state.readerPrefs.warmth = Number(el.readerWarmthSlider.value);
      applyReaderPrefs();
    });

    el.readerAutoScrollSelect.addEventListener("change", function () {
      state.readerPrefs.autoScrollSpeed = Number(el.readerAutoScrollSelect.value);
      saveState({ readerPrefs: state.readerPrefs });
      if (state.readerPrefs.autoScrollSpeed > 0) startAutoScroll();
      else stopAutoScroll();
    });

    el.readerTtsVoiceSelect.addEventListener("change", function () {
      state.readerPrefs.ttsVoiceURI = el.readerTtsVoiceSelect.value;
      saveState({ readerPrefs: state.readerPrefs });
    });
    el.readerTtsRateSelect.addEventListener("change", function () {
      state.readerPrefs.ttsRate = Number(el.readerTtsRateSelect.value);
      saveState({ readerPrefs: state.readerPrefs });
    });

    el.readerPrintBtn.addEventListener("click", function () { window.print(); });
    el.readerResetSettingsBtn.addEventListener("click", function () {
      state.readerPrefs = Object.assign({}, DEFAULT_READER_PREFS);
      applyReaderPrefs();
      renderReaderContent(false);
      toast("Tampilan Book Reader dikembalikan ke default.", "info");
    });

    // Bottom Bar Actions
    el.readerScroll.addEventListener("scroll", updateReaderProgress);
    el.readerPrevChapBtn.addEventListener("click", function () { jumpReaderChapter(-1); });
    el.readerNextChapBtn.addEventListener("click", function () { jumpReaderChapter(1); });
    el.readerAutoScrollToggleBtn.addEventListener("click", toggleAutoScroll);
    el.readerTtsBtn.addEventListener("click", function () {
      if (state.ttsActive) stopTts();
      else startTts();
    });
    el.readerTopBtn.addEventListener("click", function () {
      el.readerScroll.scrollTo({ top: 0, behavior: "smooth" });
    });

    if ("speechSynthesis" in window) {
      speechSynthesis.onvoiceschanged = populateTtsVoices;
    }
  }

  function handleKeyboardShortcuts(e) {
    const mod = e.ctrlKey || e.metaKey;
    const inField = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);

    // Escape closes top-most overlay
    if (e.key === "Escape") {
      if (el.sandboxModal.classList.contains("open")) { el.sandboxFrame.srcdoc = ""; closeModal(el.sandboxModal); return; }
      if (el.codeFocusModal.classList.contains("open")) { closeModal(el.codeFocusModal); return; }
      if (el.codeExtractModal.classList.contains("open")) { closeModal(el.codeExtractModal); return; }
      if (el.stitchModal.classList.contains("open")) { closeModal(el.stitchModal); return; }
      if (el.continueModal.classList.contains("open")) { closeModal(el.continueModal); return; }
      if (el.shortcutsModal.classList.contains("open")) { closeModal(el.shortcutsModal); return; }
      if (el.readerDrawer.classList.contains("open")) { closeReaderDrawer(); return; }
      if (state.readerOpen) { closeBookReader(); return; }
      closeAllDropdowns();
      el.findBar.classList.remove("open");
      return;
    }

    // Book Reader specific hotkeys
    if (state.readerOpen && !inField) {
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        el.readerOverlay.classList.toggle("bars-hidden");
      } else if (e.key === " ") {
        e.preventDefault();
        toggleAutoScroll();
      } else if (e.key === "[") {
        e.preventDefault();
        jumpReaderChapter(-1);
      } else if (e.key === "]") {
        e.preventDefault();
        jumpReaderChapter(1);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        state.readerPrefs.fontSize = Math.min(30, state.readerPrefs.fontSize + 1);
        applyReaderPrefs();
      } else if (e.key === "-") {
        e.preventDefault();
        state.readerPrefs.fontSize = Math.max(13, state.readerPrefs.fontSize - 1);
        applyReaderPrefs();
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        state.readerPrefs.bionicReading = !state.readerPrefs.bionicReading;
        applyReaderPrefs();
        renderReaderContent(false);
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        state.readerPrefs.readingRuler = !state.readerPrefs.readingRuler;
        applyReaderPrefs();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        if (state.ttsActive) stopTts(); else startTts();
      }
      return;
    }

    // Workspace Shortcuts
    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (el.shortcutsModal.classList.contains("open")) closeModal(el.shortcutsModal);
      else openModal(el.shortcutsModal);
    } else if (mod && e.key.toLowerCase() === "b") {
      e.preventDefault();
      if (state.readerOpen) closeBookReader(); else openBookReader();
    } else if (mod && e.shiftKey && e.key.toLowerCase() === "c") {
      e.preventDefault();
      copyText(state.result ? state.result.fixed : "", "Markdown hasil perbaikan disalin!");
    } else if (mod && e.key.toLowerCase() === "f") {
      e.preventDefault();
      el.findBar.classList.add("open");
      el.findInput.focus();
      el.findInput.select();
    }
  }

  /* ---------------------------------------------------------
     Initialize App
     --------------------------------------------------------- */
  function init() {
    applyTheme(state.theme);
    applyFontSize(state.fontSize);
    renderRulesMenu();
    renderHistoryMenu();
    el.syncScrollBtn.classList.toggle("active-toggle", state.syncScroll);
    el.toggleLineNumsBtn.classList.toggle("btn-primary", state.showLineNumbers);
    el.toggleWrapAllBtn.classList.toggle("btn-primary", state.wrapAllCode);

    initSplitPane();
    bindSyncScroll();
    bindEvents();
    processInputNow();
  }

  init();
})();