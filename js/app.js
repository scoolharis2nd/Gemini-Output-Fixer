(function (global) {
  'use strict';

  const STORAGE_DRAFT = 'aistudio_fixer_draft_v3';
  const STORAGE_HISTORY = 'aistudio_fixer_history_v3';
  const STORAGE_THEME = 'aistudio_fixer_theme_v3';
  const STORAGE_FONT = 'aistudio_fixer_font_v2';
  const STORAGE_RULES = 'aistudio_fixer_rules_v3';
  const STORAGE_READER = 'aistudio_fixer_reader_v3';
  const STORAGE_CODE_PREFS = 'aistudio_fixer_codeprefs_v2';
  const STORAGE_BOOKMARKS = 'aistudio_fixer_bookmarks_v1';

  const SAMPLES = {
    mixed: `#Bab 1: Senja di Stasiun Lama\u200B\u200C
Angin sore berhembus pelan melewati peron yang hampir kosong. Raka menatap jam saku miliknya yang jarumnya berhenti tepat pada pukul lima lewat sepuluh.



"Kau masih menunggu kereta yang sama?" suara itu terdengar dari balik bayangan pilar batu.
Raka menoleh perlahan, mendapati Dina berdiri dengan mantel cokelat tuanya. **Matanya menyimpan rahasia yang belum sempat terucap selama tiga tahun terakhir.

> [!TIP]
> Gunakan **Book View** untuk membaca cerita ini dengan Bionic Reading, Reading Ruler, atau suara TTS, dan buka **Code View** untuk tema syntax & live preview!

---

###Catatan Penulis & Implementasi Kode
-Latar tempat terinspirasi dari stasiun tua bergaya kolonial
- [x] Perbaiki heading, list, dan tag inline tanpa merusak angka desimal seperti 3.14 atau suhu -5 derajat
- [ ] Coba klik nomor baris di kartu kode untuk menyorot baris penting

| Komponen | Status | Catatan |
| Parser | Aktif | Menjaga format kode & tulisan |
| Book View | Masterpiece | 5 Tema, Bionic, TTS & Bookmark

\`\`\`javascript
// Simulasi pemutar bab cerita
async function loadChapter(chapterId) {
  const res = await fetch(\`/api/chapters/\${chapterId}\`);
  if (!res.ok) throw new Error('Gagal memuat bab');
  return res.json();
}
\`\`\`

\`\`\`python
def hitung_estimasi_baca(teks: str, wpm: int = 200) -> int:
    kata = len(teks.split())
    return max(1, (kata + wpm - 1) // wpm)`,

    coding: `#Dokumentasi API & Komponen UI
Berikut contoh output AI Studio yang terpotong, memiliki tabel tanpa garis pemisah, dan blok kode berurutan:

> [!NOTE]
> Klik tombol **Preview** pada kartu HTML di bawah untuk melihat hasil render langsung, atau **Format JSON** pada kartu JSON!

| Endpoint | Method | Deskripsi |
| /api/v1/fix | POST | Auto-heal markdown & kode |
| /api/v1/export | GET | Unduh hasil .md atau .html |

Rumus kompleksitas LCS Diff:
\\[
T(m, n) = \\frac{m \\times n}{2} + \\Delta_{\\text{trim}}
\\]

\`\`\`json
{"app":"Gemini Output Fixer","version":"2.0","offline":true,"features":["Code View","Book View","LCS Diff"]}
\`\`\`

\`\`\`html
<div style="font-family:system-ui;padding:20px;background:linear-gradient(135deg,#1e293b,#0f172a);color:#f8fafc;border-radius:12px;text-align:center;">
  <h2 style="margin:0 0 8px;color:#38bdf8;">Live HTML Preview Aktif!</h2>
  <p style="margin:0;opacity:0.85;">Kartu ini dirender aman langsung dari blok kode HTML.</p>
</div>
\`\`\`

\`\`\`typescript
interface FixResult {
  fixed: string;
  codeCount: number;
  truncated: boolean;
}

export function summarize(res: FixResult): string {
  return \`Fixed (\${res.codeCount} blocks)\`;`,

    story: `#Bab 1: Lentera di Ujung Dermaga
Hujan baru saja reda ketika kapal kayu itu merapat ke dermaga tua. Bau garam laut bercampur dengan aroma tanah basah yang menenangkan.
"Kita tiba lebih cepat dari perkiraan," gumam Arga sambil menarik kerah jaketnya.
Nadia tidak langsung menjawab. Ia menatap deretan lentera minyak yang bergoyang pelan di sepanjang jembatan kayu, memantulkan cahaya keemasan di permukaan air yang tenang.
"Lihat menara mercusuar itu," bisik Nadia akhirnya. "Lampunya menyala lagi."

---

##Bab 2: Surat Tanpa Alamat
Di dalam ruang tunggu pelabuhan, sebuah meja kayu jati menyimpan amplop cokelat yang tepinya sudah menguning. Tidak ada nama pengirim di sana, hanya cap lilin berbentuk kompas tua.
> "Barang siapa yang masih mengingat jalur selatan, datanglah sebelum pasang naik."

Arga melipat kertas itu perlahan. "Ini tulisan kakekmu, Nad."
"Aku tahu," jawab Nadia dengan suara hampir tak terdengar. "Dan kita hanya punya waktu dua jam sebelum kabut turun."

---

##Bab 3: Jalan Menuju Mercusuar
Langkah mereka menyusuri jalan setapak berbatu yang menanjak ke arah tebing. Di bawah sana, ombak memecah karang dengan irama yang sabar, seolah mengiringi rahasia yang sebentar lagi akan terbuka.`
  };

  // DOM References
  const workspace = document.getElementById('workspace');
  const splitResizer = document.getElementById('splitResizer');
  const rawInput = document.getElementById('rawInput');
  const previewOutput = document.getElementById('previewOutput');
  const rawOutput = document.getElementById('rawOutput');
  const diffOutput = document.getElementById('diffOutput');
  const diagBadges = document.getElementById('diagBadges');
  const statWords = document.getElementById('statWords');
  const statChars = document.getElementById('statChars');
  const statParas = document.getElementById('statParas');
  const statCodes = document.getElementById('statCodes');
  const statRead = document.getElementById('statRead');
  const truncationBanner = document.getElementById('truncationBanner');
  const tocBar = document.getElementById('tocBar');

  const modePreviewBtn = document.getElementById('modePreviewBtn');
  const modeRawBtn = document.getElementById('modeRawBtn');
  const modeDiffBtn = document.getElementById('modeDiffBtn');
  const diffChangesOnlyBtn = document.getElementById('diffChangesOnlyBtn');
  const syncScrollBtn = document.getElementById('syncScrollBtn');

  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const fontSizeSlider = document.getElementById('fontSizeSlider');
  const fontSizeLabel = document.getElementById('fontSizeLabel');
  const shortcutsBtn = document.getElementById('shortcutsBtn');

  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const sampleBtn = document.getElementById('sampleBtn');
  const sampleMenu = document.getElementById('sampleMenu');
  const copyResultBtn = document.getElementById('copyResultBtn');
  const copyPlainBtn = document.getElementById('copyPlainBtn');
  const continuePromptBtn = document.getElementById('continuePromptBtn');
  const bannerContinueBtn = document.getElementById('bannerContinueBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const importFileBtn = document.getElementById('importFileBtn');
  const fileInput = document.getElementById('fileInput');
  const extractCodeBtn = document.getElementById('extractCodeBtn');
  const codeCountBadge = document.getElementById('codeCountBadge');
  const tocToggleBtn = document.getElementById('tocToggleBtn');
  const readerModeBtn = document.getElementById('readerModeBtn');
  const openWindowBtn = document.getElementById('openWindowBtn');

  // Code View Toolbar
  const codeBarToggleBtn = document.getElementById('codeBarToggleBtn');
  const codeToolbarBar = document.getElementById('codeToolbarBar');
  const expandAllCodeBtn = document.getElementById('expandAllCodeBtn');
  const collapseAllCodeBtn = document.getElementById('collapseAllCodeBtn');
  const toggleLineNumsBtn = document.getElementById('toggleLineNumsBtn');
  const toggleWrapAllBtn = document.getElementById('toggleWrapAllBtn');
  const codeFontDecBtn = document.getElementById('codeFontDecBtn');
  const codeFontIncBtn = document.getElementById('codeFontIncBtn');
  const codeFontSizeLabel = document.getElementById('codeFontSizeLabel');
  const codeThemeSelect = document.getElementById('codeThemeSelect');
  const codeLangFilters = document.getElementById('codeLangFilters');
  const downloadAllCodeBtn = document.getElementById('downloadAllCodeBtn');
  const copyAllCodeBtn = document.getElementById('copyAllCodeBtn');

  // Find & Replace
  const findToggleBtn = document.getElementById('findToggleBtn');
  const findBar = document.getElementById('findBar');
  const findInput = document.getElementById('findInput');
  const replaceInput = document.getElementById('replaceInput');
  const regexToggle = document.getElementById('regexToggle');
  const caseToggle = document.getElementById('caseToggle');
  const findCount = document.getElementById('findCount');
  const findPrevBtn = document.getElementById('findPrevBtn');
  const findNextBtn = document.getElementById('findNextBtn');
  const replaceNextBtn = document.getElementById('replaceNextBtn');
  const replaceAllBtn = document.getElementById('replaceAllBtn');

  // Dropdowns
  const rulesBtn = document.getElementById('rulesBtn');
  const rulesMenu = document.getElementById('rulesMenu');
  const historyBtn = document.getElementById('historyBtn');
  const historyMenu = document.getElementById('historyMenu');
  const historyCount = document.getElementById('historyCount');
  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');

  // Modals
  const continueModal = document.getElementById('continueModal');
  const continueStyleSelect = document.getElementById('continueStyleSelect');
  const continueLinesSelect = document.getElementById('continueLinesSelect');
  const continuePromptText = document.getElementById('continuePromptText');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const copyContinueBtn = document.getElementById('copyContinueBtn');

  const codeExtractModal = document.getElementById('codeExtractModal');
  const codeExplorerStats = document.getElementById('codeExplorerStats');
  const codeExtractBody = document.getElementById('codeExtractBody');
  const closeCodeModalBtn = document.getElementById('closeCodeModalBtn');
  const codeFilterInput = document.getElementById('codeFilterInput');
  const modalCompareToggleBtn = document.getElementById('modalCompareToggleBtn');
  const codeCompareBar = document.getElementById('codeCompareBar');
  const compareCodeA = document.getElementById('compareCodeA');
  const compareCodeB = document.getElementById('compareCodeB');
  const runCodeCompareBtn = document.getElementById('runCodeCompareBtn');
  const codeCompareResult = document.getElementById('codeCompareResult');
  const modalExpandAllBtn = document.getElementById('modalExpandAllBtn');
  const modalCollapseAllBtn = document.getElementById('modalCollapseAllBtn');
  const modalCopyAllCodeBtn = document.getElementById('modalCopyAllCodeBtn');

  const codeFocusModal = document.getElementById('codeFocusModal');
  const codeFocusTitle = document.getElementById('codeFocusTitle');
  const codeFocusBody = document.getElementById('codeFocusBody');
  const codeFocusWrapBtn = document.getElementById('codeFocusWrapBtn');
  const codeFocusCopyBtn = document.getElementById('codeFocusCopyBtn');
  const closeCodeFocusBtn = document.getElementById('closeCodeFocusBtn');

  const livePreviewModal = document.getElementById('livePreviewModal');
  const livePreviewTitle = document.getElementById('livePreviewTitle');
  const livePreviewFrame = document.getElementById('livePreviewFrame');
  const closeLivePreviewBtn = document.getElementById('closeLivePreviewBtn');

  const shortcutsModal = document.getElementById('shortcutsModal');
  const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');

  // Book Reader View
  const readerOverlay = document.getElementById('readerOverlay');
  const readerDimmer = document.getElementById('readerDimmer');
  const readerRuler = document.getElementById('readerRuler');
  const readerProgressFill = document.getElementById('readerProgressFill');
  const readerShowBarsBtn = document.getElementById('readerShowBarsBtn');
  const closeReaderBtn = document.getElementById('closeReaderBtn');
  const readerSidebarToggleBtn = document.getElementById('readerSidebarToggleBtn');
  const readerSidebar = document.getElementById('readerSidebar');
  const rsTabToc = document.getElementById('rsTabToc');
  const rsTabBookmarks = document.getElementById('rsTabBookmarks');
  const bookmarkCount = document.getElementById('bookmarkCount');
  const readerTocList = document.getElementById('readerTocList');
  const readerBookmarkList = document.getElementById('readerBookmarkList');
  const readerChapterTitle = document.getElementById('readerChapterTitle');
  const readerAddBookmarkBtn = document.getElementById('readerAddBookmarkBtn');
  const readerSettingsToggleBtn = document.getElementById('readerSettingsToggleBtn');
  const readerHideBarsBtn = document.getElementById('readerHideBarsBtn');
  const readerSettingsDrawer = document.getElementById('readerSettingsDrawer');
  const readerThemeSelect = document.getElementById('readerThemeSelect');
  const readerFontSelect = document.getElementById('readerFontSelect');
  const readerWidthSelect = document.getElementById('readerWidthSelect');
  const readerFontDecBtn = document.getElementById('readerFontDecBtn');
  const readerFontIncBtn = document.getElementById('readerFontIncBtn');
  const readerFontSizeLabel = document.getElementById('readerFontSizeLabel');
  const readerLineHeightSelect = document.getElementById('readerLineHeightSelect');
  const readerDimSlider = document.getElementById('readerDimSlider');
  const readerJustifyBtn = document.getElementById('readerJustifyBtn');
  const readerIndentBtn = document.getElementById('readerIndentBtn');
  const readerDropCapBtn = document.getElementById('readerDropCapBtn');
  const readerBionicBtn = document.getElementById('readerBionicBtn');
  const readerRulerBtn = document.getElementById('readerRulerBtn');
  const readerAutoScrollSelect = document.getElementById('readerAutoScrollSelect');
  const readerPopoutBtn = document.getElementById('readerPopoutBtn');
  const readerScroll = document.getElementById('readerScroll');
  const readerPage = document.getElementById('readerPage');
  const readerArticle = document.getElementById('readerArticle');
  const readerPrevChapBtn = document.getElementById('readerPrevChapBtn');
  const readerNextChapBtn = document.getElementById('readerNextChapBtn');
  const readerStatusText = document.getElementById('readerStatusText');
  const readerTtsLangSelect = document.getElementById('readerTtsLangSelect');
  const readerTtsRateSelect = document.getElementById('readerTtsRateSelect');
  const readerTtsBtn = document.getElementById('readerTtsBtn');
  const readerTopBtn = document.getElementById('readerTopBtn');

  // Mobile
  const mobTabInput = document.getElementById('mobTabInput');
  const mobTabOutput = document.getElementById('mobTabOutput');
  const mobBarPaste = document.getElementById('mobBarPaste');
  const mobBarInput = document.getElementById('mobBarInput');
  const mobBarOutput = document.getElementById('mobBarOutput');
  const mobBarReader = document.getElementById('mobBarReader');
  const mobBarCopy = document.getElementById('mobBarCopy');

  const inputPanel = document.getElementById('inputPanel');
  const outputPanel = document.getElementById('outputPanel');
  const toastContainer = document.getElementById('toastContainer');

  const state = {
    theme: 'dark',
    layout: 'split',
    syncScroll: false,
    viewMode: 'preview',
    diffChangesOnly: false,
    fixedMarkdown: '',
    totalWords: 0,
    isTruncated: false,
    useRegex: false,
    caseSensitive: false,
    findMatchIdx: -1,
    showToc: false,
    showCodeBar: false,
    activeLangFilter: 'all',
    codeBlocks: [],
    headings: [],
    history: [],
    historyQuery: '',
    bookmarks: [],
    undoStack: [],
    redoStack: [],
    rules: Object.assign({}, global.FixerParser.DEFAULT_RULES),
    codeOpts: {
      collapsedDefault: false,
      showLineNumbers: true,
      wrapLines: false,
      fontSize: 13,
      theme: 'auto'
    },
    reader: {
      theme: 'sepia',
      font: 'serif',
      width: 'medium',
      size: 18,
      lineHeight: '1.85',
      dimmer: 0,
      justify: true,
      indent: false,
      dropCap: true,
      bionic: false,
      ruler: false,
      scrollPos: 0
    }
  };

  function storageGet(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 220);
    }, 2300);
  }

  async function copyText(text, successMsg) {
    if (!text) {
      showToast('Tidak ada teks untuk disalin.', 'warning');
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showToast(successMsg || 'Berhasil disalin!', 'success');
        return;
      }
    } catch (e) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(successMsg || 'Berhasil disalin!', 'success');
    } catch (err) {
      showToast('Gagal menyalin ke clipboard.', 'warning');
    }
  }

  function getExtForLang(lang) {
    const map = {
      javascript: 'js', js: 'js', jsx: 'jsx', typescript: 'ts', ts: 'ts', tsx: 'tsx',
      python: 'py', py: 'py', html: 'html', svg: 'svg', css: 'css', scss: 'scss',
      json: 'json', yaml: 'yml', yml: 'yml', sql: 'sql', bash: 'sh', sh: 'sh',
      java: 'java', cpp: 'cpp', c: 'c', go: 'go', rust: 'rs', rs: 'rs', php: 'php',
      markdown: 'md', md: 'md'
    };
    return map[(lang || '').toLowerCase()] || 'txt';
  }

  // Debounced Undo Stack so typing doesn't exhaust 40 entries in 1 sentence
  let undoTimer = null;
  function pushUndo(val, immediate) {
    if (immediate) {
      clearTimeout(undoTimer);
      if (state.undoStack[state.undoStack.length - 1] === val) return;
      state.undoStack.push(val);
      if (state.undoStack.length > 50) state.undoStack.shift();
      state.redoStack = [];
      updateUndoRedoBtns();
      return;
    }
    clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      if (state.undoStack[state.undoStack.length - 1] === val) return;
      state.undoStack.push(val);
      if (state.undoStack.length > 50) state.undoStack.shift();
      state.redoStack = [];
      updateUndoRedoBtns();
    }, 450);
  }

  function updateUndoRedoBtns() {
    undoBtn.disabled = state.undoStack.length <= 1;
    redoBtn.disabled = state.redoStack.length === 0;
  }

  // =========================================================
  // DIAGNOSTICS, STATS, TOC, CORE PROCESSING
  // =========================================================
  function renderDiagnostics(stats) {
    const items = [];
    if (stats.codeBlocks > 0) items.push({ label: `${stats.codeBlocks} Code Block`, cls: 'active-fix' });
    if (stats.tables > 0) items.push({ label: `${stats.tables} Tabel`, cls: 'active-fix' });
    if (stats.inlineTags > 0) items.push({ label: `${stats.inlineTags} Tag/Link`, cls: 'active-fix' });
    if (stats.listsHeadings > 0) items.push({ label: `${stats.listsHeadings} List/Heading`, cls: 'active-fix' });
    if (stats.math > 0) items.push({ label: `${stats.math} LaTeX/Math`, cls: 'active-fix' });
    if (stats.sanitized > 0) items.push({ label: `${stats.sanitized} Sanitasi`, cls: 'active-fix' });
    if (stats.truncated) items.push({ label: 'Terpotong', cls: 'warn-fix' });

    diagBadges.innerHTML = `<span class="diag-title">Fix Log:</span>`;

    if (items.length === 0) {
      const b = document.createElement('span');
      b.className = 'badge';
      b.id = 'diagSummaryBadge';
      b.textContent = rawInput.value.trim() ? 'Format bersih (0 perbaikan)' : 'Menunggu input';
      diagBadges.appendChild(b);
    } else {
      items.forEach(it => {
        const b = document.createElement('span');
        b.className = 'badge ' + it.cls;
        b.textContent = it.label;
        diagBadges.appendChild(b);
      });
    }
  }

  function updateStats(text) {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const paras = trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0;
    state.totalWords = words;
    const chars = text.length;
    const mins = Math.max(1, Math.ceil(words / 200));
    statWords.textContent = words.toLocaleString('id-ID');
    statChars.textContent = chars.toLocaleString('id-ID');
    statParas.textContent = paras.toLocaleString('id-ID');
    statCodes.textContent = state.codeBlocks.length;
    statRead.textContent = words === 0 ? '0 mnt' : `${mins} mnt`;
  }

  function renderToc() {
    if (!state.showToc || state.headings.length === 0) {
      tocBar.classList.remove('open');
      return;
    }
    tocBar.classList.add('open');
    tocBar.innerHTML = state.headings.map((h, idx) =>
      `<button class="toc-chip" type="button" data-toc-id="toc-h-${idx}">${global.FixerRenderer.escapeHtml(h.text)}</button>`
    ).join('');
  }

  function renderCodeLangFilters() {
    if (!state.codeBlocks.length) {
      codeLangFilters.innerHTML = '';
      state.activeLangFilter = 'all';
      return;
    }
    const counts = {};
    state.codeBlocks.forEach(cb => {
      const l = cb.lang.toLowerCase();
      counts[l] = (counts[l] || 0) + 1;
    });
    const langs = Object.keys(counts);
    if (langs.length < 2) {
      codeLangFilters.innerHTML = '';
      state.activeLangFilter = 'all';
      return;
    }
    if (state.activeLangFilter !== 'all' && !counts[state.activeLangFilter]) {
      state.activeLangFilter = 'all';
    }
    const pills = [
      `<button type="button" class="lang-pill${state.activeLangFilter === 'all' ? ' active' : ''}" data-filter-lang="all">Semua (${state.codeBlocks.length})</button>`,
      ...langs.map(l =>
        `<button type="button" class="lang-pill${state.activeLangFilter === l ? ' active' : ''}" data-filter-lang="${global.FixerRenderer.escapeHtml(l)}">${global.FixerRenderer.escapeHtml(l.toUpperCase())} (${counts[l]})</button>`
      )
    ];
    codeLangFilters.innerHTML = pills.join('');
  }

  function applyCodeLangFilter() {
    previewOutput.querySelectorAll('.code-card').forEach(card => {
      const l = (card.getAttribute('data-lang') || '').toLowerCase();
      const hide = state.activeLangFilter !== 'all' && l !== state.activeLangFilter;
      card.classList.toggle('hidden-by-filter', hide);
    });
  }

  function renderPreviewOnly() {
    previewOutput.innerHTML = global.FixerRenderer.renderMarkdownToHtml(state.fixedMarkdown, {
      bookOrnament: state.theme === 'book',
      codeOpts: state.codeOpts
    });
    applyCodeLangFilter();
  }

  function renderDiffOnly() {
    diffOutput.innerHTML = global.FixerRenderer.renderDiffHtml(
      global.FixerParser.computeLineDiff(rawInput.value, state.fixedMarkdown),
      state.diffChangesOnly
    );
  }

  let processTimer = null;
  let saveTimer = null;

  function scheduleProcessInput(skipUndo) {
    const len = rawInput.value.length;
    if (len < 4000) {
      processInput(skipUndo, false);
    } else {
      clearTimeout(processTimer);
      processTimer = setTimeout(() => processInput(skipUndo, false), 90);
    }
  }

  function processInput(skipUndo, immediateUndo) {
    const inputVal = rawInput.value;
    if (!skipUndo) pushUndo(inputVal, Boolean(immediateUndo));

    const { fixed, stats, codeBlocks, headings } = global.FixerParser.autoHealMarkdown(inputVal, state.rules);
    state.fixedMarkdown = fixed;
    state.isTruncated = stats.truncated;
    state.codeBlocks = codeBlocks;
    state.headings = headings;
    codeCountBadge.textContent = codeBlocks.length;

    rawOutput.value = fixed;
    renderCodeLangFilters();
    renderPreviewOnly();
    if (state.viewMode === 'diff') renderDiffOnly();
    if (readerOverlay.classList.contains('open')) renderReaderContent();

    renderDiagnostics(stats);
    updateStats(fixed);
    renderToc();
    truncationBanner.classList.toggle('visible', stats.truncated);

    updateFindMatches();
    storageSet(STORAGE_DRAFT, inputVal);

    clearTimeout(saveTimer);
    if (inputVal.trim().length > 20) {
      saveTimer = setTimeout(() => saveToHistory(inputVal, stats), 1800);
    }
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    modePreviewBtn.classList.toggle('active', mode === 'preview');
    modeRawBtn.classList.toggle('active', mode === 'raw');
    modeDiffBtn.classList.toggle('active', mode === 'diff');
    diffChangesOnlyBtn.style.display = mode === 'diff' ? 'inline-flex' : 'none';

    previewOutput.style.display = mode === 'preview' ? 'block' : 'none';
    rawOutput.style.display = mode === 'raw' ? 'block' : 'none';
    diffOutput.style.display = mode === 'diff' ? 'block' : 'none';

    if (mode === 'diff') renderDiffOnly();
  }

  // =========================================================
  // RESIZABLE SPLIT PANE & LAYOUT MODES & SYNC SCROLL
  // =========================================================
  document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-layout');
      state.layout = mode;
      workspace.classList.remove('layout-input', 'layout-output');
      if (mode === 'input') workspace.classList.add('layout-input');
      if (mode === 'output') workspace.classList.add('layout-output');
      document.querySelectorAll('.layout-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  let isDraggingSplit = false;
  splitResizer.addEventListener('mousedown', () => {
    isDraggingSplit = true;
    splitResizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });
  splitResizer.addEventListener('dblclick', () => {
    inputPanel.style.flex = '1 1 50%';
    outputPanel.style.flex = '1 1 50%';
    showToast('Lebar panel direset ke 50/50.', 'info');
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDraggingSplit) return;
    const rect = workspace.getBoundingClientRect();
    const pct = Math.min(78, Math.max(22, ((e.clientX - rect.left) / rect.width) * 100));
    inputPanel.style.flex = `0 0 ${pct}%`;
    outputPanel.style.flex = `1 1 ${100 - pct}%`;
  });
  document.addEventListener('mouseup', () => {
    if (!isDraggingSplit) return;
    isDraggingSplit = false;
    splitResizer.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  let syncingScroll = false;
  syncScrollBtn.addEventListener('click', () => {
    state.syncScroll = !state.syncScroll;
    syncScrollBtn.classList.toggle('btn-primary', state.syncScroll);
    showToast(state.syncScroll ? 'Sync Scroll diaktifkan.' : 'Sync Scroll dimatikan.', 'info');
  });
  rawInput.addEventListener('scroll', () => {
    if (!state.syncScroll || syncingScroll) return;
    syncingScroll = true;
    const ratio = rawInput.scrollTop / Math.max(1, rawInput.scrollHeight - rawInput.clientHeight);
    const target = state.viewMode === 'raw' ? rawOutput : previewOutput;
    target.scrollTop = ratio * Math.max(0, target.scrollHeight - target.clientHeight);
    setTimeout(() => { syncingScroll = false; }, 20);
  }, { passive: true });
  previewOutput.addEventListener('scroll', () => {
    if (!state.syncScroll || syncingScroll) return;
    syncingScroll = true;
    const ratio = previewOutput.scrollTop / Math.max(1, previewOutput.scrollHeight - previewOutput.clientHeight);
    rawInput.scrollTop = ratio * Math.max(0, rawInput.scrollHeight - rawInput.clientHeight);
    setTimeout(() => { syncingScroll = false; }, 20);
  }, { passive: true });

  // =========================================================
  // CODE VIEW & CODE CARD INTERACTIONS
  // =========================================================
  let focusModalCurrentCode = '';

  function applyCodePreferences() {
    document.documentElement.style.setProperty('--code-font-size', state.codeOpts.fontSize + 'px');
    codeFontSizeLabel.textContent = state.codeOpts.fontSize + 'px';
    codeThemeSelect.value = state.codeOpts.theme;
    [previewOutput, codeExtractBody, codeFocusBody, readerArticle].forEach(el => {
      if (el) el.setAttribute('data-codetheme', state.codeOpts.theme);
    });
    toggleLineNumsBtn.classList.toggle('btn-primary', state.codeOpts.showLineNumbers);
    toggleWrapAllBtn.classList.toggle('btn-primary', state.codeOpts.wrapLines);
    storageSet(STORAGE_CODE_PREFS, JSON.stringify(state.codeOpts));
  }

  function highlightMatchesInCodeCard(card, query) {
    const codeEl = card.querySelector('pre code');
    const countEl = card.querySelector('.code-search-count');
    const copyBtn = card.querySelector('.copy-code-btn');
    if (!codeEl || !copyBtn) return;
    const rawCode = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
    const lang = card.getAttribute('data-lang') || 'code';
    const baseHtml = global.FixerRenderer.highlightCode(rawCode, lang);

    if (!query) {
      codeEl.innerHTML = baseHtml;
      if (countEl) countEl.textContent = '0 cocok';
      return;
    }

    const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escapedQ, 'gi');
    let hits = 0;
    // Only highlight outside HTML tags
    const parts = baseHtml.split(/(<[^>]+>)/g);
    const highlighted = parts.map(part => {
      if (part.startsWith('<')) return part;
      return part.replace(re, m => {
        hits++;
        return `<mark class="code-mark">${m}</mark>`;
      });
    }).join('');
    codeEl.innerHTML = highlighted;
    if (countEl) countEl.textContent = `${hits} cocok`;
  }

  function handleCodeCardClick(e, containerEl) {
    // Line number click highlight (supports Shift+click range!)
    const lineNumEl = e.target.closest('.code-line-num');
    if (lineNumEl) {
      const gutter = lineNumEl.parentElement;
      const num = Number(lineNumEl.getAttribute('data-line'));
      const lastNum = Number(gutter.getAttribute('data-last-line') || '0');
      if (e.shiftKey && lastNum > 0) {
        const min = Math.min(lastNum, num);
        const max = Math.max(lastNum, num);
        gutter.querySelectorAll('.code-line-num').forEach(el => {
          const n = Number(el.getAttribute('data-line'));
          if (n >= min && n <= max) el.classList.add('highlighted');
        });
      } else {
        lineNumEl.classList.toggle('highlighted');
      }
      gutter.setAttribute('data-last-line', String(num));
      return true;
    }

    // Collapse / Expand
    const collapseBtn = e.target.closest('.code-collapse-btn');
    const leftHeader = e.target.closest('.code-card-left');
    if (collapseBtn || leftHeader) {
      const card = e.target.closest('.code-card');
      if (!card) return true;
      const isCollapsed = card.classList.toggle('collapsed');
      const btn = card.querySelector('.code-collapse-btn');
      if (btn) btn.setAttribute('aria-expanded', String(!isCollapsed));
      return true;
    }

    // In-card Search Toggle
    const searchBtn = e.target.closest('.search-code-btn');
    if (searchBtn) {
      const card = e.target.closest('.code-card');
      if (!card) return true;
      card.classList.remove('collapsed');
      const bar = card.querySelector('.code-search-bar');
      if (bar) {
        const isOpen = bar.classList.toggle('open');
        searchBtn.classList.toggle('btn-primary', isOpen);
        const inp = bar.querySelector('.code-search-input');
        if (isOpen && inp) inp.focus();
        if (!isOpen && inp) {
          inp.value = '';
          highlightMatchesInCodeCard(card, '');
        }
      }
      return true;
    }

    // Live HTML / SVG Preview
    const prevBtn = e.target.closest('.preview-code-btn');
    if (prevBtn) {
      const code = decodeURIComponent(prevBtn.getAttribute('data-code') || '');
      const lang = prevBtn.getAttribute('data-lang') || 'html';
      livePreviewTitle.textContent = `Live Sandboxed Preview (${lang.toUpperCase()})`;
      livePreviewFrame.srcdoc = lang === 'svg'
        ? `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;">${code}</body></html>`
        : code;
      livePreviewModal.classList.add('open');
      return true;
    }

    // JSON Pretty-Print & Validate
    const jsonBtn = e.target.closest('.format-json-btn');
    if (jsonBtn) {
      const card = e.target.closest('.code-card');
      const copyBtn = card && card.querySelector('.copy-code-btn');
      if (!card || !copyBtn) return true;
      const raw = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
      try {
        const pretty = JSON.stringify(JSON.parse(raw), null, 2);
        const encoded = encodeURIComponent(pretty);
        copyBtn.setAttribute('data-code', encoded);
        const saveBtn = card.querySelector('.save-code-btn');
        if (saveBtn) saveBtn.setAttribute('data-code', encoded);
        const codeEl = card.querySelector('pre code');
        if (codeEl) codeEl.innerHTML = global.FixerRenderer.highlightCode(pretty, 'json');
        const gutter = card.querySelector('.code-gutter');
        if (gutter) {
          const cnt = pretty.split('\n').length;
          gutter.innerHTML = Array.from({ length: cnt }, (_, n) => `<span class="code-line-num" data-line="${n + 1}">${n + 1}</span>`).join('');
        }
        showToast('JSON valid & berhasil dirapikan!', 'success');
      } catch (err) {
        showToast(`JSON tidak valid: ${err.message}`, 'warning');
      }
      return true;
    }

    // Focus Fullscreen Code Modal
    const focusBtn = e.target.closest('.focus-code-btn');
    if (focusBtn) {
      const code = decodeURIComponent(focusBtn.getAttribute('data-code') || '');
      const lang = focusBtn.getAttribute('data-lang') || 'code';
      focusModalCurrentCode = code;
      codeFocusTitle.textContent = `Code Focus — ${lang.toUpperCase()} (${code.split('\n').length} baris)`;
      codeFocusBody.innerHTML = global.FixerRenderer.buildCodeCardHtml(code, lang, 999, Object.assign({}, state.codeOpts, { collapsedDefault: false }), 'focus-code-');
      codeFocusModal.classList.add('open');
      return true;
    }

    // Word Wrap
    const wrapBtn = e.target.closest('.wrap-code-btn');
    if (wrapBtn) {
      const card = e.target.closest('.code-card');
      if (!card) return true;
      const isWrapped = card.classList.toggle('wrap-lines');
      wrapBtn.classList.toggle('btn-primary', isWrapped);
      return true;
    }

    // Save Snippet
    const saveBtn = e.target.closest('.save-code-btn');
    if (saveBtn) {
      const code = decodeURIComponent(saveBtn.getAttribute('data-code') || '');
      const lang = saveBtn.getAttribute('data-lang') || 'txt';
      const card = e.target.closest('.code-card');
      const idx = card ? Number(card.getAttribute('data-code-idx') || '0') + 1 : 1;
      const ext = getExtForLang(lang);
      downloadFile(`snippet-${idx}.${ext}`, code, 'text/plain');
      return true;
    }

    // Copy Code
    const copyBtn = e.target.closest('.copy-code-btn');
    if (copyBtn) {
      const code = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
      copyText(code, 'Potongan kode disalin!');
      const orig = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = orig; }, 1400);
      return true;
    }

    // Jump from Code Explorer
    const jumpBtn = e.target.closest('.jump-code-btn');
    if (jumpBtn && containerEl === codeExtractBody) {
      const idx = jumpBtn.getAttribute('data-code-idx');
      codeExtractModal.classList.remove('open');
      setViewMode('preview');
      state.activeLangFilter = 'all';
      renderCodeLangFilters();
      applyCodeLangFilter();
      const target = document.getElementById('code-block-' + idx);
      if (target) {
        target.classList.remove('collapsed');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('code-card-highlight');
        setTimeout(() => target.classList.remove('code-card-highlight'), 1500);
      }
      return true;
    }

    return false;
  }

  function handleCodeCardInput(e) {
    const inp = e.target.closest('.code-search-input');
    if (!inp) return;
    const card = inp.closest('.code-card');
    if (card) highlightMatchesInCodeCard(card, inp.value.trim());
  }

  function setAllCodeCardsCollapsed(container, collapsed) {
    container.querySelectorAll('.code-card').forEach(card => {
      card.classList.toggle('collapsed', collapsed);
      const btn = card.querySelector('.code-collapse-btn');
      if (btn) btn.setAttribute('aria-expanded', String(!collapsed));
    });
  }

  function renderCodeExplorerList() {
    const q = (codeFilterInput.value || '').trim().toLowerCase();
    const totalLines = state.codeBlocks.reduce((s, c) => s + c.lines, 0);
    const langs = [...new Set(state.codeBlocks.map(c => c.lang.toUpperCase()))];
    codeExplorerStats.textContent = `${state.codeBlocks.length} blok • ${totalLines} baris total • Bahasa: ${langs.join(', ') || '-'}`;

    const filtered = state.codeBlocks
      .map((cb, idx) => ({ cb, idx }))
      .filter(({ cb }) => !q || cb.lang.toLowerCase().includes(q) || cb.code.toLowerCase().includes(q));

    if (!filtered.length) {
      codeExtractBody.innerHTML = '<div class="empty-state"><p>Tidak ada blok kode yang cocok.</p></div>';
      return;
    }

    codeExtractBody.innerHTML = filtered.map(({ cb, idx }) => {
      const html = global.FixerRenderer.buildCodeCardHtml(cb.code, cb.lang, idx, state.codeOpts, 'modal-code-');
      return html.replace(
        '<div class="code-card-actions">',
        `<div class="code-card-actions"><button class="btn btn-sm jump-code-btn" type="button" data-code-idx="${idx}" title="Lompat ke blok kode di Output">Jump</button>`
      );
    }).join('');
  }

  function populateCodeCompareSelects() {
    const opts = state.codeBlocks.map((cb, idx) =>
      `<option value="${idx}">#${idx + 1} ${cb.lang.toUpperCase()} (${cb.lines} baris)</option>`
    ).join('');
    compareCodeA.innerHTML = opts;
    compareCodeB.innerHTML = opts;
    if (state.codeBlocks.length >= 2) compareCodeB.value = '1';
  }

  function openCodeExtractModal() {
    if (!state.codeBlocks.length) {
      showToast('Tidak ada blok kode ditemukan.', 'warning');
      return;
    }
    codeFilterInput.value = '';
    codeCompareBar.style.display = 'none';
    codeCompareResult.style.display = 'none';
    modalCompareToggleBtn.classList.remove('btn-primary');
    populateCodeCompareSelects();
    renderCodeExplorerList();
    codeExtractModal.classList.add('open');
  }

  // =========================================================
  // HISTORY v2 & RULES v2
  // =========================================================
  function loadHistory() {
    try {
      const parsed = JSON.parse(storageGet(STORAGE_HISTORY, '[]'));
      if (Array.isArray(parsed)) state.history = parsed;
    } catch (e) {
      state.history = [];
    }
    renderHistoryMenu();
  }

  function saveToHistory(rawText, stats) {
    const snippet = rawText.trim().slice(0, 44).replace(/\s+/g, ' ');
    if (!snippet) return;
    if (state.history.length > 0 && state.history[0].raw === rawText) return;

    const totalFixes = stats.codeBlocks + stats.tables + stats.inlineTags + stats.listsHeadings + stats.math + stats.sanitized;
    const entry = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      snippet,
      fixes: totalFixes,
      pinned: false,
      raw: rawText
    };
    const pinned = state.history.filter(h => h.pinned && h.raw !== rawText);
    const unpinned = [entry, ...state.history.filter(h => !h.pinned && h.raw !== rawText)].slice(0, 15);
    state.history = [...pinned, ...unpinned];
    storageSet(STORAGE_HISTORY, JSON.stringify(state.history));
    renderHistoryMenu();
  }

  function renderHistoryMenu() {
    historyCount.textContent = state.history.length;
    const q = state.historyQuery.trim().toLowerCase();
    const list = state.history
      .map((h, idx) => ({ h, idx }))
      .filter(({ h }) => !q || h.snippet.toLowerCase().includes(q) || h.raw.toLowerCase().includes(q));

    const headerHtml = `
      <div class="history-controls">
        <input type="text" class="find-input" id="historySearchInput" placeholder="Cari riwayat..." value="${global.FixerRenderer.escapeHtml(state.historyQuery)}" style="min-height:28px;font-size:12px;">
        <button type="button" class="btn btn-sm btn-danger" id="clearHistoryBtn" title="Hapus semua riwayat tidak di-pin">Clear</button>
      </div>
    `;

    if (list.length === 0) {
      historyMenu.innerHTML = headerHtml + '<div style="padding:10px;font-size:12px;color:var(--text-muted);">Belum ada riwayat cocok.</div>';
      return;
    }

    historyMenu.innerHTML = headerHtml + list.map(({ h, idx }) => `
      <div class="history-row">
        <button class="dropdown-item" type="button" data-hist-idx="${idx}">
          <strong>${h.pinned ? '★ ' : ''}${global.FixerRenderer.escapeHtml(h.snippet)}...</strong>
          <small>${h.time} &bull; ${h.fixes} perbaikan</small>
        </button>
        <button class="hist-act-btn${h.pinned ? ' pinned' : ''}" type="button" data-hist-pin="${idx}" title="Pin / Unpin">&#9733;</button>
        <button class="hist-act-btn" type="button" data-hist-del="${idx}" title="Hapus">&times;</button>
      </div>
    `).join('');
  }

  function renderRulesMenu() {
    const labels = [
      ['sanitize', 'Sanitasi Karakter & Spasi'],
      ['codeBlocks', 'Auto-Close & Fix Code Blocks'],
      ['tables', 'Perbaiki Tabel Markdown'],
      ['listsHeadings', 'Fix List & Heading (Aman Desimal)'],
      ['math', 'Perbaiki LaTeX / Math'],
      ['inlineTags', 'Tutup Tag Inline (` ** ~~ _)'],
      ['htmlEntities', 'Bersihkan Entitas HTML (&amp; dll)'],
      ['brokenLinks', 'Perbaiki Spasi Link [a] (url)'],
      ['storyDialogue', 'Rapikan Paragraf Dialog Cerita'],
      ['smartTypography', 'Smart Typography (“ ” — …)']
    ];
    const presetsHtml = `
      <div class="rules-presets">
        <button type="button" class="btn btn-sm" data-preset="default">Default</button>
        <button type="button" class="btn btn-sm" data-preset="coding">Coding</button>
        <button type="button" class="btn btn-sm" data-preset="book">Novel/Book</button>
      </div>
    `;
    rulesMenu.innerHTML = presetsHtml + labels.map(([key, label]) => `
      <label class="rule-toggle">
        <span>${label}</span>
        <input type="checkbox" data-rule="${key}" ${state.rules[key] ? 'checked' : ''}>
      </label>
    `).join('');
  }

  // =========================================================
  // MASTERPIECE BOOK / FANFICTION READER VIEW
  // =========================================================
  let autoScrollTimer = null;
  let autoScrollPaused = false;
  let currentChapterIdx = 0;

  // Chunked TTS state
  let ttsActive = false;
  let ttsNodes = [];
  let ttsCursor = 0;

  function loadBookmarks() {
    try {
      const parsed = JSON.parse(storageGet(STORAGE_BOOKMARKS, '[]'));
      if (Array.isArray(parsed)) state.bookmarks = parsed;
    } catch (e) {
      state.bookmarks = [];
    }
    renderReaderBookmarks();
  }

  function saveBookmarks() {
    storageSet(STORAGE_BOOKMARKS, JSON.stringify(state.bookmarks));
    renderReaderBookmarks();
  }

  function renderReaderToc() {
    if (!state.headings.length) {
      readerTocList.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--reader-muted);">Tidak ada heading/bab terdeteksi.</div>';
      return;
    }
    readerTocList.innerHTML = state.headings.map((h, idx) => `
      <button type="button" class="rs-item lvl-${h.level}${idx === currentChapterIdx ? ' active' : ''}" data-reader-toc="${idx}">
        <span>${global.FixerRenderer.escapeHtml(h.text)}</span>
      </button>
    `).join('');
  }

  function renderReaderBookmarks() {
    bookmarkCount.textContent = state.bookmarks.length;
    if (!state.bookmarks.length) {
      readerBookmarkList.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--reader-muted);">Belum ada bookmark. Klik "+ Bookmark" atau tekan B saat membaca.</div>';
      return;
    }
    readerBookmarkList.innerHTML = state.bookmarks.map((bm, idx) => `
      <div class="rs-item" data-bm-jump="${idx}">
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${global.FixerRenderer.escapeHtml(bm.label)} (${bm.pct}%)</span>
        <button type="button" class="rs-del-btn" data-bm-del="${idx}" title="Hapus Bookmark">&times;</button>
      </div>
    `).join('');
  }

  function renderReaderContent() {
    readerArticle.innerHTML = global.FixerRenderer.renderMarkdownToHtml(state.fixedMarkdown, {
      bookOrnament: true,
      idPrefix: 'reader-h-',
      codeIdPrefix: 'reader-code-',
      codeOpts: state.codeOpts,
      bionic: state.reader.bionic
    });
    readerChapterTitle.textContent = state.headings.length ? state.headings[Math.min(currentChapterIdx, state.headings.length - 1)].text : 'Mode Buku & Fanfiksi';
    renderReaderToc();
  }

  function applyReaderPrefs() {
    const r = state.reader;
    readerOverlay.setAttribute('data-rtheme', r.theme);
    readerOverlay.classList.toggle('ruler-on', Boolean(r.ruler));
    readerDimmer.style.background = `rgba(22, 12, 0, ${(Number(r.dimmer) || 0) / 100})`;
    readerDimSlider.value = r.dimmer || 0;

    readerThemeSelect.value = r.theme;
    readerFontSelect.value = r.font;
    readerWidthSelect.value = r.width;
    readerLineHeightSelect.value = r.lineHeight;
    readerFontSizeLabel.textContent = r.size + 'px';

    readerPage.className = `reader-page width-${r.width}`;
    readerArticle.className = `reader-article font-${r.font} md-preview` +
      (r.justify ? ' align-justify' : '') +
      (r.indent ? ' book-indent' : '') +
      (r.dropCap ? ' drop-cap' : '');
    readerArticle.style.fontSize = r.size + 'px';
    readerArticle.style.lineHeight = r.lineHeight;

    readerJustifyBtn.classList.toggle('active', r.justify);
    readerIndentBtn.classList.toggle('active', r.indent);
    readerDropCapBtn.classList.toggle('active', r.dropCap);
    readerBionicBtn.classList.toggle('active', Boolean(r.bionic));
    readerRulerBtn.classList.toggle('active', Boolean(r.ruler));
    storageSet(STORAGE_READER, JSON.stringify(r));
  }

  function openReaderMode() {
    if (!state.fixedMarkdown.trim()) {
      showToast('Belum ada output untuk dibaca.', 'warning');
      return;
    }
    renderReaderContent();
    applyReaderPrefs();
    renderReaderBookmarks();
    readerSettingsDrawer.classList.remove('open');
    readerSettingsToggleBtn.classList.remove('active');
    readerOverlay.classList.remove('bars-hidden');
    readerOverlay.classList.add('open');
    const maxScroll = Math.max(0, readerScroll.scrollHeight - readerScroll.clientHeight);
    readerScroll.scrollTop = Math.min(state.reader.scrollPos || 0, maxScroll);
    updateReaderProgress();
  }

  function clearTtsHighlight() {
    readerArticle.querySelectorAll('.tts-speaking').forEach(el => el.classList.remove('tts-speaking'));
  }

  function stopTts() {
    ttsActive = false;
    ttsNodes = [];
    ttsCursor = 0;
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (e) {}
    clearTtsHighlight();
    readerTtsBtn.classList.remove('active');
    readerTtsBtn.textContent = 'Bacakan';
  }

  function detectLangForText(text) {
    const chosen = readerTtsLangSelect.value;
    if (chosen !== 'auto') return chosen;
    const idWords = (text.match(/\b(yang|dan|di|ke|dari|ini|itu|untuk|dengan|tidak|pada|adalah|saya|aku|kamu)\b/gi) || []).length;
    const enWords = (text.match(/\b(the|and|to|of|in|is|it|that|for|with|was|this|you|are)\b/gi) || []).length;
    return enWords > idWords ? 'en-US' : 'id-ID';
  }

  function speakNextChunk() {
    if (!ttsActive || ttsCursor >= ttsNodes.length) {
      stopTts();
      return;
    }
    const el = ttsNodes[ttsCursor];
    const txt = (el.textContent || '').trim();
    if (!txt) {
      ttsCursor++;
      speakNextChunk();
      return;
    }
    clearTtsHighlight();
    el.classList.add('tts-speaking');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const utt = new SpeechSynthesisUtterance(txt);
    utt.lang = detectLangForText(txt);
    utt.rate = Number(readerTtsRateSelect.value) || 1;
    utt.onend = () => {
      if (!ttsActive) return;
      ttsCursor++;
      speakNextChunk();
    };
    utt.onerror = () => stopTts();
    window.speechSynthesis.speak(utt);
  }

  function closeReaderMode() {
    stopAutoScroll();
    stopTts();
    readerAutoScrollSelect.value = '0';
    readerOverlay.classList.remove('open');
  }

  function syncActiveChapterOnScroll() {
    if (!state.headings.length) return;
    const topThreshold = readerScroll.getBoundingClientRect().top + 110;
    let activeIdx = 0;
    for (let i = 0; i < state.headings.length; i++) {
      const el = document.getElementById('reader-h-' + i);
      if (el && el.getBoundingClientRect().top <= topThreshold) {
        activeIdx = i;
      }
    }
    if (activeIdx !== currentChapterIdx) {
      currentChapterIdx = activeIdx;
      readerChapterTitle.textContent = state.headings[activeIdx].text;
      readerTocList.querySelectorAll('.rs-item').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === activeIdx);
      });
    }
  }

  function updateReaderProgress() {
    const max = readerScroll.scrollHeight - readerScroll.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.round((readerScroll.scrollTop / max) * 100)) : 100;
    readerProgressFill.style.width = pct + '%';

    const totalMins = Math.max(1, Math.ceil(state.totalWords / 200));
    const remMins = Math.max(0, Math.round(totalMins * (1 - pct / 100)));
    readerStatusText.textContent = `${pct}% \u2022 ~${remMins} mnt tersisa \u2022 ${state.totalWords.toLocaleString('id-ID')} kata`;

    syncActiveChapterOnScroll();
    state.reader.scrollPos = readerScroll.scrollTop;
    storageSet(STORAGE_READER, JSON.stringify(state.reader));
  }

  function stopAutoScroll() {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
    autoScrollPaused = false;
  }

  function startAutoScroll(speed) {
    stopAutoScroll();
    if (!speed || speed <= 0) return;
    autoScrollTimer = setInterval(() => {
      if (autoScrollPaused) return;
      readerScroll.scrollTop += speed;
      if (readerScroll.scrollTop + readerScroll.clientHeight >= readerScroll.scrollHeight - 2) {
        stopAutoScroll();
        readerAutoScrollSelect.value = '0';
      }
    }, 40);
  }

  function jumpChapter(delta) {
    if (!state.headings.length) return;
    currentChapterIdx = Math.max(0, Math.min(state.headings.length - 1, currentChapterIdx + delta));
    const el = document.getElementById('reader-h-' + currentChapterIdx);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      readerChapterTitle.textContent = state.headings[currentChapterIdx].text;
      renderReaderToc();
    }
  }

  function addCurrentBookmark() {
    const max = Math.max(1, readerScroll.scrollHeight - readerScroll.clientHeight);
    const pct = Math.min(100, Math.round((readerScroll.scrollTop / max) * 100));
    const chap = state.headings[currentChapterIdx] ? state.headings[currentChapterIdx].text : 'Posisi Baca';
    state.bookmarks.unshift({
      id: Date.now(),
      label: chap.slice(0, 32),
      pct,
      scrollTop: readerScroll.scrollTop
    });
    state.bookmarks = state.bookmarks.slice(0, 20);
    saveBookmarks();
    showToast(`Bookmark disimpan di ${pct}% (${chap.slice(0, 24)})`, 'success');
  }

  // Upgraded Interactive Offline Book HTML Export
  function buildStandaloneHtml() {
    const r = state.reader;
    const title = state.headings.length ? global.FixerRenderer.escapeHtml(state.headings[0].text) : 'Gemini Output Fixer — Book';
    const fontCss = r.font === 'serif' ? 'Georgia, "Palatino Linotype", serif' :
      r.font === 'classic' ? 'Cambria, Baskerville, serif' :
      r.font === 'dyslexic' ? 'Verdana, Tahoma, sans-serif' :
      r.font === 'mono' ? 'ui-monospace, monospace' : 'system-ui, sans-serif';
    const maxW = r.width === 'narrow' ? '56ch' : r.width === 'wide' ? '92ch' : r.width === 'full' ? '114ch' : '72ch';
    const bodyHtml = global.FixerRenderer.renderMarkdownToHtml(state.fixedMarkdown, {
      bookOrnament: true,
      codeOpts: state.codeOpts,
      bionic: r.bionic
    });
    return `<!DOCTYPE html><html lang="id" data-t="${r.theme}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title><style>
:root{--bg:#f7f1e3;--fg:#2f2419;--muted:#786552;--border:#d5c7ab;--accent:#9a5523;--code:#ece3d1;--kw:#9333ea;--str:#059669;--com:#64748b;--num:#d97706;--fn:#2563eb;}
html[data-t="dark"]{--bg:#131926;--fg:#dce3ee;--muted:#8b9bb4;--border:#263147;--accent:#60a5fa;--code:#0d111a;--kw:#c084fc;--str:#34d399;--com:#64748b;--num:#fbbf24;--fn:#60a5fa;}
html[data-t="cream"]{--bg:#fcfbf7;--fg:#262626;--muted:#737373;--border:#e2dfd7;--accent:#2563eb;--code:#f1f5f9;}
html[data-t="sage"]{--bg:#edf3ed;--fg:#1e2d24;--muted:#546e5d;--border:#c2d4c4;--accent:#2e7d52;--code:#e0eae0;}
html[data-t="amoled"]{--bg:#000;--fg:#d4d4d8;--muted:#71717a;--border:#27272a;--accent:#60a5fa;--code:#0b0b0f;--kw:#c084fc;--str:#34d399;--com:#64748b;--num:#fbbf24;--fn:#60a5fa;}
body{margin:0;padding:28px 18px 64px;background:var(--bg);color:var(--fg);font-family:${fontCss};font-size:${r.size}px;line-height:${r.lineHeight};}
main{max-width:${maxW};margin:0 auto;}
.bar{display:flex;justify-content:flex-end;gap:8px;margin-bottom:20px;}
.bar button{background:transparent;border:1px solid var(--border);color:var(--fg);padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;}
h1,h2,h3{text-align:center;}p{margin:0 0 1.15em;${r.justify ? 'text-align:justify;' : ''}${r.indent ? 'text-indent:1.7em;margin-bottom:0.5em;' : ''}}
.scene-break{text-align:center;margin:1.8em 0;letter-spacing:0.25em;opacity:0.7;}
.code-card{border:1px solid var(--border);border-radius:9px;overflow:hidden;margin:1em 0;background:var(--code);}
.code-card-header{padding:6px 12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;font-family:monospace;font-size:12px;}
.code-card-actions,.code-search-bar,.code-collapse-btn{display:none;}
.code-body{display:flex;overflow-x:auto;}.code-gutter{padding:12px 10px;border-right:1px solid var(--border);color:var(--muted);font-family:monospace;font-size:12px;line-height:1.55;user-select:none;}.code-gutter span{display:block;}
pre{margin:0;padding:12px 14px;font-family:monospace;font-size:13px;line-height:1.55;overflow-x:auto;}
.syn-kw{color:var(--kw);font-weight:600;}.syn-str{color:var(--str);}.syn-com{color:var(--com);font-style:italic;}.syn-num{color:var(--num);}.syn-fn{color:var(--fn);}
table{border-collapse:collapse;width:100%;margin:16px 0;}th,td{border:1px solid var(--border);padding:8px 12px;}
blockquote,.callout{border-left:3.5px solid var(--accent);margin:14px 0;padding:10px 14px;background:rgba(128,128,128,0.08);border-radius:0 8px 8px 0;}
.math-block{text-align:center;padding:12px;border:1px solid var(--border);border-radius:8px;margin:12px 0;font-family:"Times New Roman",serif;}
.math-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 3px;font-size:0.88em;}
.math-frac-num{border-bottom:1px solid currentColor;padding:0 3px 1px;}
</style></head><body><main><div class="bar"><button onclick="document.documentElement.dataset.t='sepia'">Sepia</button><button onclick="document.documentElement.dataset.t='cream'">Cream</button><button onclick="document.documentElement.dataset.t='sage'">Sage</button><button onclick="document.documentElement.dataset.t='dark'">Dark</button><button onclick="window.print()">Print</button></div>${bodyHtml}</main></body></html>`;
  }

  function openStandaloneWindow() {
    if (!state.fixedMarkdown.trim()) {
      showToast('Belum ada output untuk dibuka.', 'warning');
      return;
    }
    try {
      const blob = new Blob([buildStandaloneHtml()], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        URL.revokeObjectURL(url);
        openReaderMode();
        showToast('Popup diblokir browser. Dibuka di Book View layar penuh.', 'info');
      }
    } catch (e) {
      openReaderMode();
    }
  }

  // =========================================================
  // FIND & REPLACE v2 (WITH MATCH NAVIGATION)
  // =========================================================
  function buildFindRegex(globalFlag) {
    const query = findInput.value;
    if (!query) return null;
    const flags = (globalFlag ? 'g' : '') + (state.caseSensitive ? '' : 'i');
    try {
      if (state.useRegex) return new RegExp(query, flags);
      return new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    } catch (e) {
      return null;
    }
  }

  function getAllFindRanges() {
    const re = buildFindRegex(true);
    if (!re) return null;
    const ranges = [];
    const text = rawInput.value;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      ranges.push([m.index, m.index + m[0].length]);
      if (ranges.length > 5000) break;
    }
    return ranges;
  }

  function updateFindMatches() {
    if (!findBar.classList.contains('open')) return;
    const ranges = getAllFindRanges();
    if (!ranges) {
      findCount.textContent = findInput.value ? 'Regex invalid' : '0 cocok';
      state.findMatchIdx = -1;
      return;
    }
    if (state.findMatchIdx >= ranges.length) state.findMatchIdx = ranges.length - 1;
    findCount.textContent = ranges.length
      ? `${state.findMatchIdx >= 0 ? (state.findMatchIdx + 1) + '/' : ''}${ranges.length} cocok`
      : '0 cocok';
  }

  function navigateFind(delta) {
    const ranges = getAllFindRanges();
    if (!ranges || !ranges.length) {
      showToast('Tidak ada kecocokan ditemukan.', 'warning');
      return;
    }
    state.findMatchIdx = (state.findMatchIdx + delta + ranges.length) % ranges.length;
    const [start, end] = ranges[state.findMatchIdx];
    rawInput.focus();
    rawInput.setSelectionRange(start, end);
    updateFindMatches();
  }

  // =========================================================
  // SMART CONTINUATION PROMPT v2
  // =========================================================
  function updateContinuePromptText() {
    const clean = (state.fixedMarkdown || rawInput.value).trim();
    if (!clean) return;
    const style = continueStyleSelect.value;
    const count = Number(continueLinesSelect.value) || 4;
    const lines = clean.split('\n').filter(l => l.trim() !== '');
    const tail = lines.slice(-count).join('\n');

    const introMap = {
      general: 'Lanjutkan respons Anda sebelumnya tepat dari titik terakhir ini tanpa mengulang bagian yang sudah dijelaskan. Pastikan format Markdown, tabel, dan blok kode tetap konsisten.',
      coding: 'Lanjutkan kode Anda sebelumnya tepat dari baris terakhir di bawah ini tanpa mengulang kode dari awal. Pertahankan indentasi, nama variabel, dan tutup blok kode dengan benar.',
      story: 'Lanjutkan cerita/fanfiksi Anda tepat dari paragraf terakhir di bawah ini tanpa mengulang adegan sebelumnya. Pertahankan gaya bahasa, sudut pandang (POV), dan alur emosi yang sama.'
    };

    continuePromptText.value = `${introMap[style] || introMap.general}\n\nBagian terakhir sebelum terpotong:\n"""\n${tail}\n"""`;
  }

  function openContinuationModal() {
    if (!(state.fixedMarkdown || rawInput.value).trim()) {
      showToast('Masukkan teks terlebih dahulu.', 'warning');
      return;
    }
    updateContinuePromptText();
    continueModal.classList.add('open');
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Berhasil mengunduh ${filename}`, 'success');
  }

  function stripMarkdownToPlain(md) {
    return md
      .replace(/```[\s\S]*?```/g, m => m.replace(/```[a-zA-Z0-9_+-]*\n?/g, '').replace(/```/g, ''))
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  }

  function switchMobilePanel(target) {
    const isInput = target === 'input';
    mobTabInput.classList.toggle('active', isInput);
    mobTabOutput.classList.toggle('active', !isInput);
    mobBarInput.classList.toggle('active', isInput);
    mobBarOutput.classList.toggle('active', !isInput);
    inputPanel.classList.toggle('mobile-hidden', !isInput);
    outputPanel.classList.toggle('mobile-hidden', isInput);
  }

  async function handlePaste() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clip = await navigator.clipboard.readText();
        if (clip) {
          rawInput.value = clip;
          state.reader.scrollPos = 0;
          processInput(false, true);
          showToast('Teks berhasil di-paste dari clipboard!', 'success');
          return;
        }
      }
      showToast('Tempel langsung di area input.', 'info');
      switchMobilePanel('input');
      rawInput.focus();
    } catch (e) {
      showToast('Izin clipboard dibatasi browser. Tempel langsung di input.', 'info');
      switchMobilePanel('input');
      rawInput.focus();
    }
  }

  // =========================================================
  // EVENT LISTENERS
  // =========================================================
  rawInput.addEventListener('input', () => scheduleProcessInput(false));

  modePreviewBtn.addEventListener('click', () => setViewMode('preview'));
  modeRawBtn.addEventListener('click', () => setViewMode('raw'));
  modeDiffBtn.addEventListener('click', () => setViewMode('diff'));
  diffChangesOnlyBtn.addEventListener('click', () => {
    state.diffChangesOnly = !state.diffChangesOnly;
    diffChangesOnlyBtn.classList.toggle('btn-primary', state.diffChangesOnly);
    renderDiffOnly();
  });

  // Code View Toolbar Listeners
  codeBarToggleBtn.addEventListener('click', () => {
    state.showCodeBar = !state.showCodeBar;
    codeToolbarBar.classList.toggle('open', state.showCodeBar);
    codeBarToggleBtn.classList.toggle('btn-primary', state.showCodeBar);
  });
  expandAllCodeBtn.addEventListener('click', () => {
    state.codeOpts.collapsedDefault = false;
    setAllCodeCardsCollapsed(previewOutput, false);
  });
  collapseAllCodeBtn.addEventListener('click', () => {
    state.codeOpts.collapsedDefault = true;
    setAllCodeCardsCollapsed(previewOutput, true);
  });
  toggleLineNumsBtn.addEventListener('click', () => {
    state.codeOpts.showLineNumbers = !state.codeOpts.showLineNumbers;
    applyCodePreferences();
    renderPreviewOnly();
  });
  toggleWrapAllBtn.addEventListener('click', () => {
    state.codeOpts.wrapLines = !state.codeOpts.wrapLines;
    applyCodePreferences();
    renderPreviewOnly();
  });
  codeFontDecBtn.addEventListener('click', () => {
    state.codeOpts.fontSize = Math.max(10, state.codeOpts.fontSize - 1);
    applyCodePreferences();
  });
  codeFontIncBtn.addEventListener('click', () => {
    state.codeOpts.fontSize = Math.min(20, state.codeOpts.fontSize + 1);
    applyCodePreferences();
  });
  codeThemeSelect.addEventListener('change', (e) => {
    state.codeOpts.theme = e.target.value;
    applyCodePreferences();
  });
  codeLangFilters.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-filter-lang]');
    if (!pill) return;
    state.activeLangFilter = pill.getAttribute('data-filter-lang');
    renderCodeLangFilters();
    applyCodeLangFilter();
  });
  copyAllCodeBtn.addEventListener('click', () => {
    if (!state.codeBlocks.length) {
      showToast('Tidak ada blok kode ditemukan.', 'warning');
      return;
    }
    const combined = state.codeBlocks.map((cb, idx) => `// --- [${idx + 1}] ${cb.lang} ---\n${cb.code}`).join('\n\n');
    copyText(combined, `${state.codeBlocks.length} blok kode disalin!`);
  });
  downloadAllCodeBtn.addEventListener('click', () => {
    if (!state.codeBlocks.length) {
      showToast('Tidak ada blok kode ditemukan.', 'warning');
      return;
    }
    const combined = state.codeBlocks.map((cb, idx) => `// ===== [${idx + 1}] ${cb.lang.toUpperCase()} =====\n${cb.code}`).join('\n\n');
    downloadFile('all-code-snippets.txt', combined, 'text/plain');
  });

  // Code Explorer Modal Listeners
  extractCodeBtn.addEventListener('click', openCodeExtractModal);
  closeCodeModalBtn.addEventListener('click', () => codeExtractModal.classList.remove('open'));
  codeExtractModal.addEventListener('click', (e) => { if (e.target === codeExtractModal) codeExtractModal.classList.remove('open'); });
  codeFilterInput.addEventListener('input', renderCodeExplorerList);
  modalExpandAllBtn.addEventListener('click', () => setAllCodeCardsCollapsed(codeExtractBody, false));
  modalCollapseAllBtn.addEventListener('click', () => setAllCodeCardsCollapsed(codeExtractBody, true));
  modalCopyAllCodeBtn.addEventListener('click', () => {
    const combined = state.codeBlocks.map((cb, idx) => `// --- [${idx + 1}] ${cb.lang} ---\n${cb.code}`).join('\n\n');
    copyText(combined, 'Semua blok kode disalin!');
  });
  modalCompareToggleBtn.addEventListener('click', () => {
    if (state.codeBlocks.length < 2) {
      showToast('Butuh minimal 2 blok kode untuk dibandingkan.', 'warning');
      return;
    }
    const open = codeCompareBar.style.display === 'none';
    codeCompareBar.style.display = open ? 'flex' : 'none';
    if (!open) codeCompareResult.style.display = 'none';
    modalCompareToggleBtn.classList.toggle('btn-primary', open);
  });
  runCodeCompareBtn.addEventListener('click', () => {
    const a = state.codeBlocks[Number(compareCodeA.value)];
    const b = state.codeBlocks[Number(compareCodeB.value)];
    if (!a || !b) return;
    codeCompareResult.innerHTML = global.FixerRenderer.renderDiffHtml(
      global.FixerParser.computeLineDiff(a.code, b.code),
      false
    );
    codeCompareResult.style.display = 'block';
  });

  // Code Focus & Live Preview Modals
  closeCodeFocusBtn.addEventListener('click', () => codeFocusModal.classList.remove('open'));
  codeFocusModal.addEventListener('click', (e) => { if (e.target === codeFocusModal) codeFocusModal.classList.remove('open'); });
  codeFocusCopyBtn.addEventListener('click', () => copyText(focusModalCurrentCode, 'Kode disalin!'));
  codeFocusWrapBtn.addEventListener('click', () => {
    const card = codeFocusBody.querySelector('.code-card');
    if (card) {
      const wrapped = card.classList.toggle('wrap-lines');
      codeFocusWrapBtn.classList.toggle('btn-primary', wrapped);
    }
  });
  closeLivePreviewBtn.addEventListener('click', () => {
    livePreviewModal.classList.remove('open');
    livePreviewFrame.srcdoc = '';
  });
  livePreviewModal.addEventListener('click', (e) => {
    if (e.target === livePreviewModal) {
      livePreviewModal.classList.remove('open');
      livePreviewFrame.srcdoc = '';
    }
  });

  // Delegated Code Card Click & Search
  previewOutput.addEventListener('click', (e) => handleCodeCardClick(e, previewOutput));
  previewOutput.addEventListener('input', handleCodeCardInput);
  codeExtractBody.addEventListener('click', (e) => handleCodeCardClick(e, codeExtractBody));
  codeExtractBody.addEventListener('input', handleCodeCardInput);
  codeFocusBody.addEventListener('click', (e) => handleCodeCardClick(e, codeFocusBody));
  codeFocusBody.addEventListener('input', handleCodeCardInput);

  // Book Reader Listeners
  readerModeBtn.addEventListener('click', openReaderMode);
  mobBarReader.addEventListener('click', openReaderMode);
  openWindowBtn.addEventListener('click', openStandaloneWindow);
  readerPopoutBtn.addEventListener('click', openStandaloneWindow);
  closeReaderBtn.addEventListener('click', closeReaderMode);

  readerSidebarToggleBtn.addEventListener('click', () => {
    const open = readerSidebar.classList.toggle('open');
    readerSidebarToggleBtn.classList.toggle('active', open);
  });
  rsTabToc.addEventListener('click', () => {
    rsTabToc.classList.add('active');
    rsTabBookmarks.classList.remove('active');
    readerTocList.style.display = 'flex';
    readerBookmarkList.style.display = 'none';
  });
  rsTabBookmarks.addEventListener('click', () => {
    rsTabBookmarks.classList.add('active');
    rsTabToc.classList.remove('active');
    readerBookmarkList.style.display = 'flex';
    readerTocList.style.display = 'none';
  });
  readerTocList.addEventListener('click', (e) => {
    const item = e.target.closest('[data-reader-toc]');
    if (!item) return;
    currentChapterIdx = Number(item.getAttribute('data-reader-toc'));
    const el = document.getElementById('reader-h-' + currentChapterIdx);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      readerChapterTitle.textContent = state.headings[currentChapterIdx].text;
      renderReaderToc();
    }
  });
  readerBookmarkList.addEventListener('click', (e) => {
    const del = e.target.closest('[data-bm-del]');
    if (del) {
      e.stopPropagation();
      state.bookmarks.splice(Number(del.getAttribute('data-bm-del')), 1);
      saveBookmarks();
      return;
    }
    const jump = e.target.closest('[data-bm-jump]');
    if (jump) {
      const bm = state.bookmarks[Number(jump.getAttribute('data-bm-jump'))];
      if (bm) readerScroll.scrollTo({ top: bm.scrollTop, behavior: 'smooth' });
    }
  });
  readerAddBookmarkBtn.addEventListener('click', addCurrentBookmark);

  readerSettingsToggleBtn.addEventListener('click', () => {
    const isOpen = readerSettingsDrawer.classList.toggle('open');
    readerSettingsToggleBtn.classList.toggle('active', isOpen);
  });
  readerHideBarsBtn.addEventListener('click', () => {
    readerSettingsDrawer.classList.remove('open');
    readerSettingsToggleBtn.classList.remove('active');
    readerOverlay.classList.add('bars-hidden');
  });
  readerShowBarsBtn.addEventListener('click', () => readerOverlay.classList.remove('bars-hidden'));

  readerThemeSelect.addEventListener('change', (e) => { state.reader.theme = e.target.value; applyReaderPrefs(); });
  readerFontSelect.addEventListener('change', (e) => { state.reader.font = e.target.value; applyReaderPrefs(); });
  readerWidthSelect.addEventListener('change', (e) => { state.reader.width = e.target.value; applyReaderPrefs(); });
  readerLineHeightSelect.addEventListener('change', (e) => { state.reader.lineHeight = e.target.value; applyReaderPrefs(); });
  readerDimSlider.addEventListener('input', (e) => { state.reader.dimmer = Number(e.target.value); applyReaderPrefs(); });
  readerFontDecBtn.addEventListener('click', () => { state.reader.size = Math.max(13, state.reader.size - 1); applyReaderPrefs(); });
  readerFontIncBtn.addEventListener('click', () => { state.reader.size = Math.min(28, state.reader.size + 1); applyReaderPrefs(); });
  readerJustifyBtn.addEventListener('click', () => { state.reader.justify = !state.reader.justify; applyReaderPrefs(); });
  readerIndentBtn.addEventListener('click', () => { state.reader.indent = !state.reader.indent; applyReaderPrefs(); });
  readerDropCapBtn.addEventListener('click', () => { state.reader.dropCap = !state.reader.dropCap; applyReaderPrefs(); });
  readerBionicBtn.addEventListener('click', () => {
    state.reader.bionic = !state.reader.bionic;
    applyReaderPrefs();
    renderReaderContent();
  });
  readerRulerBtn.addEventListener('click', () => {
    state.reader.ruler = !state.reader.ruler;
    applyReaderPrefs();
  });
  readerOverlay.addEventListener('mousemove', (e) => {
    if (state.reader.ruler) readerRuler.style.top = e.clientY + 'px';
  });

  readerAutoScrollSelect.addEventListener('change', (e) => startAutoScroll(Number(e.target.value)));
  readerScroll.addEventListener('scroll', updateReaderProgress, { passive: true });
  readerPrevChapBtn.addEventListener('click', () => jumpChapter(-1));
  readerNextChapBtn.addEventListener('click', () => jumpChapter(1));
  readerTopBtn.addEventListener('click', () => readerScroll.scrollTo({ top: 0, behavior: 'smooth' }));

  readerArticle.addEventListener('click', (e) => {
    if (handleCodeCardClick(e, readerArticle)) return;
    if (e.target.closest('a, button, pre, code, input')) return;
    const sel = window.getSelection ? window.getSelection().toString() : '';
    if (sel.length > 0) return;
    readerOverlay.classList.toggle('bars-hidden');
  });
  readerArticle.addEventListener('input', handleCodeCardInput);

  readerTtsBtn.addEventListener('click', () => {
    try {
      if (!('speechSynthesis' in window)) {
        showToast('Browser tidak mendukung fitur baca suara.', 'warning');
        return;
      }
      if (ttsActive || window.speechSynthesis.speaking) {
        stopTts();
        return;
      }
      ttsNodes = Array.from(readerArticle.querySelectorAll('[data-tts-idx]'));
      if (!ttsNodes.length) return;
      ttsActive = true;
      ttsCursor = 0;
      readerTtsBtn.classList.add('active');
      readerTtsBtn.textContent = 'Stop';
      speakNextChunk();
    } catch (e) {
      showToast('Gagal memulai pembaca suara.', 'warning');
    }
  });

  // Theme & Font Size
  const THEME_ORDER = ['dark', 'book', 'light'];
  const THEME_NAMES = { dark: 'Dark', book: 'Book', light: 'Light' };

  function applyTheme(theme) {
    const valid = THEME_ORDER.includes(theme) ? theme : 'dark';
    state.theme = valid;
    document.documentElement.setAttribute('data-theme', valid);
    themeLabel.textContent = THEME_NAMES[valid];
    storageSet(STORAGE_THEME, valid);
    if (state.fixedMarkdown) renderPreviewOnly();
  }

  themeToggle.addEventListener('click', () => {
    const nextIdx = (THEME_ORDER.indexOf(state.theme) + 1) % THEME_ORDER.length;
    applyTheme(THEME_ORDER[nextIdx]);
  });

  function applyFontSize(size) {
    document.documentElement.style.setProperty('--editor-font-size', size + 'px');
    fontSizeLabel.textContent = size + 'px';
    fontSizeSlider.value = size;
    storageSet(STORAGE_FONT, size);
  }
  fontSizeSlider.addEventListener('input', (e) => applyFontSize(e.target.value));

  // Editor Actions
  pasteBtn.addEventListener('click', handlePaste);
  mobBarPaste.addEventListener('click', handlePaste);
  clearBtn.addEventListener('click', () => {
    rawInput.value = '';
    state.reader.scrollPos = 0;
    processInput(false, true);
    showToast('Editor dibersihkan.', 'info');
  });

  sampleMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-sample]');
    if (!item) return;
    const key = item.getAttribute('data-sample');
    rawInput.value = SAMPLES[key] || SAMPLES.mixed;
    state.reader.scrollPos = 0;
    processInput(false, true);
    closeAllDropdowns();
    showToast(`Sample "${key}" berhasil dimuat.`, 'info');
  });

  copyResultBtn.addEventListener('click', () => copyText(state.fixedMarkdown, 'Fixed Markdown berhasil disalin!'));
  mobBarCopy.addEventListener('click', () => copyText(state.fixedMarkdown, 'Fixed Markdown berhasil disalin!'));
  copyPlainBtn.addEventListener('click', () => copyText(stripMarkdownToPlain(state.fixedMarkdown), 'Teks polos berhasil disalin!'));

  undoBtn.addEventListener('click', () => {
    if (state.undoStack.length <= 1) return;
    state.redoStack.push(state.undoStack.pop());
    rawInput.value = state.undoStack[state.undoStack.length - 1];
    updateUndoRedoBtns();
    processInput(true);
  });

  redoBtn.addEventListener('click', () => {
    if (!state.redoStack.length) return;
    const next = state.redoStack.pop();
    state.undoStack.push(next);
    rawInput.value = next;
    updateUndoRedoBtns();
    processInput(true);
  });

  importFileBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      rawInput.value = String(reader.result || '');
      state.reader.scrollPos = 0;
      processInput(false, true);
      showToast(`File ${file.name} dimuat.`, 'success');
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  inputPanel.addEventListener('dragover', (e) => { e.preventDefault(); inputPanel.classList.add('drag-over'); });
  inputPanel.addEventListener('dragleave', () => inputPanel.classList.remove('drag-over'));
  inputPanel.addEventListener('drop', (e) => {
    e.preventDefault();
    inputPanel.classList.remove('drag-over');
    const file = e.dataTransfer && e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      rawInput.value = String(reader.result || '');
      state.reader.scrollPos = 0;
      processInput(false, true);
      showToast(`File ${file.name} dimuat.`, 'success');
    };
    reader.readAsText(file);
  });

  tocToggleBtn.addEventListener('click', () => {
    state.showToc = !state.showToc;
    tocToggleBtn.classList.toggle('btn-primary', state.showToc);
    renderToc();
  });
  tocBar.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-toc-id]');
    if (!chip) return;
    setViewMode('preview');
    const el = document.getElementById(chip.getAttribute('data-toc-id'));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Find & Replace Listeners
  findToggleBtn.addEventListener('click', () => {
    const open = findBar.classList.toggle('open');
    findToggleBtn.classList.toggle('btn-primary', open);
    if (open) {
      findInput.focus();
      updateFindMatches();
    }
  });
  findInput.addEventListener('input', () => { state.findMatchIdx = -1; updateFindMatches(); });
  findPrevBtn.addEventListener('click', () => navigateFind(-1));
  findNextBtn.addEventListener('click', () => navigateFind(1));
  regexToggle.addEventListener('click', () => {
    state.useRegex = !state.useRegex;
    regexToggle.classList.toggle('active', state.useRegex);
    state.findMatchIdx = -1;
    updateFindMatches();
  });
  caseToggle.addEventListener('click', () => {
    state.caseSensitive = !state.caseSensitive;
    caseToggle.classList.toggle('active', state.caseSensitive);
    state.findMatchIdx = -1;
    updateFindMatches();
  });
  replaceNextBtn.addEventListener('click', () => {
    const re = buildFindRegex(false);
    if (!re || !re.test(rawInput.value)) {
      showToast('Tidak ada kecocokan ditemukan.', 'warning');
      return;
    }
    rawInput.value = rawInput.value.replace(re, replaceInput.value);
    processInput(false, true);
    showToast('1 kecocokan diganti.', 'success');
  });
  replaceAllBtn.addEventListener('click', () => {
    const re = buildFindRegex(true);
    if (!re) { showToast('Pola pencarian tidak valid.', 'warning'); return; }
    const matches = rawInput.value.match(re);
    if (!matches) { showToast('Tidak ada kecocokan ditemukan.', 'warning'); return; }
    rawInput.value = rawInput.value.replace(re, replaceInput.value);
    processInput(false, true);
    showToast(`${matches.length} kecocokan diganti.`, 'success');
  });

  // Dropdowns
  function closeAllDropdowns() {
    rulesMenu.classList.remove('open');
    historyMenu.classList.remove('open');
    exportMenu.classList.remove('open');
    sampleMenu.classList.remove('open');
  }
  function bindDropdown(btn, menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) menu.classList.add('open');
    });
  }
  bindDropdown(rulesBtn, rulesMenu);
  bindDropdown(historyBtn, historyMenu);
  bindDropdown(exportBtn, exportMenu);
  bindDropdown(sampleBtn, sampleMenu);
  rulesMenu.addEventListener('click', (e) => e.stopPropagation());
  historyMenu.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', closeAllDropdowns);

  rulesMenu.addEventListener('click', (e) => {
    const presetBtn = e.target.closest('[data-preset]');
    if (!presetBtn) return;
    const key = presetBtn.getAttribute('data-preset');
    const preset = global.FixerParser.RULE_PRESETS[key];
    if (preset) {
      state.rules = Object.assign({}, preset);
      storageSet(STORAGE_RULES, JSON.stringify(state.rules));
      renderRulesMenu();
      processInput(true);
      showToast(`Preset aturan "${key}" diterapkan.`, 'success');
    }
  });
  rulesMenu.addEventListener('change', (e) => {
    const cb = e.target.closest('input[data-rule]');
    if (!cb) return;
    state.rules[cb.getAttribute('data-rule')] = cb.checked;
    storageSet(STORAGE_RULES, JSON.stringify(state.rules));
    processInput(true);
  });

  historyMenu.addEventListener('input', (e) => {
    if (e.target.id === 'historySearchInput') {
      state.historyQuery = e.target.value;
      renderHistoryMenu();
      const inp = document.getElementById('historySearchInput');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
  });
  historyMenu.addEventListener('click', (e) => {
    if (e.target.id === 'clearHistoryBtn') {
      state.history = state.history.filter(h => h.pinned);
      storageSet(STORAGE_HISTORY, JSON.stringify(state.history));
      renderHistoryMenu();
      showToast('Riwayat non-pin dibersihkan.', 'info');
      return;
    }
    const pinBtn = e.target.closest('[data-hist-pin]');
    if (pinBtn) {
      const idx = Number(pinBtn.getAttribute('data-hist-pin'));
      if (state.history[idx]) {
        state.history[idx].pinned = !state.history[idx].pinned;
        state.history.sort((a, b) => Number(b.pinned) - Number(a.pinned));
        storageSet(STORAGE_HISTORY, JSON.stringify(state.history));
        renderHistoryMenu();
      }
      return;
    }
    const delBtn = e.target.closest('[data-hist-del]');
    if (delBtn) {
      state.history.splice(Number(delBtn.getAttribute('data-hist-del')), 1);
      storageSet(STORAGE_HISTORY, JSON.stringify(state.history));
      renderHistoryMenu();
      return;
    }
    const item = e.target.closest('[data-hist-idx]');
    if (item) {
      const entry = state.history[Number(item.getAttribute('data-hist-idx'))];
      if (entry) {
        rawInput.value = entry.raw;
        state.reader.scrollPos = 0;
        processInput(false, true);
        closeAllDropdowns();
        showToast('Riwayat dimuat kembali.', 'info');
      }
    }
  });

  exportMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-export]');
    if (!btn) return;
    const type = btn.getAttribute('data-export');
    if (!state.fixedMarkdown.trim()) {
      showToast('Output masih kosong.', 'warning');
      return;
    }
    if (type === 'md') {
      downloadFile('fixed-output.md', state.fixedMarkdown, 'text/markdown');
    } else if (type === 'txt') {
      downloadFile('fixed-output.txt', stripMarkdownToPlain(state.fixedMarkdown), 'text/plain');
    } else if (type === 'json') {
      downloadFile('fixed-output.json', JSON.stringify({
        fixedMarkdown: state.fixedMarkdown,
        words: state.totalWords,
        codeBlocks: state.codeBlocks,
        headings: state.headings
      }, null, 2), 'application/json');
    } else if (type === 'html') {
      downloadFile('fixed-book.html', buildStandaloneHtml(), 'text/html');
    } else if (type === 'print') {
      closeAllDropdowns();
      setViewMode('preview');
      window.print();
    }
  });

  // Continuation & Shortcuts Modals
  continuePromptBtn.addEventListener('click', openContinuationModal);
  bannerContinueBtn.addEventListener('click', openContinuationModal);
  continueStyleSelect.addEventListener('change', updateContinuePromptText);
  continueLinesSelect.addEventListener('change', updateContinuePromptText);
  closeModalBtn.addEventListener('click', () => continueModal.classList.remove('open'));
  continueModal.addEventListener('click', (e) => { if (e.target === continueModal) continueModal.classList.remove('open'); });
  copyContinueBtn.addEventListener('click', () => copyText(continuePromptText.value, 'Prompt lanjutan berhasil disalin!'));

  shortcutsBtn.addEventListener('click', () => shortcutsModal.classList.add('open'));
  closeShortcutsBtn.addEventListener('click', () => shortcutsModal.classList.remove('open'));
  shortcutsModal.addEventListener('click', (e) => { if (e.target === shortcutsModal) shortcutsModal.classList.remove('open'); });

  // Mobile Tabs
  mobTabInput.addEventListener('click', () => switchMobilePanel('input'));
  mobTabOutput.addEventListener('click', () => switchMobilePanel('output'));
  mobBarInput.addEventListener('click', () => switchMobilePanel('input'));
  mobBarOutput.addEventListener('click', () => switchMobilePanel('output'));

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
    const inField = tag === 'input' || tag === 'textarea' || tag === 'select';

    if (mod && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      copyText(state.fixedMarkdown, 'Fixed Markdown berhasil disalin!');
      return;
    }
    if (mod && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      findBar.classList.add('open');
      findToggleBtn.classList.add('btn-primary');
      findInput.focus();
      updateFindMatches();
      return;
    }
    if (mod && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      if (readerOverlay.classList.contains('open')) closeReaderMode();
      else openReaderMode();
      return;
    }
    if (mod && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      openCodeExtractModal();
      return;
    }

    if (e.key === 'Escape') {
      closeAllDropdowns();
      continueModal.classList.remove('open');
      codeExtractModal.classList.remove('open');
      codeFocusModal.classList.remove('open');
      livePreviewModal.classList.remove('open');
      livePreviewFrame.srcdoc = '';
      shortcutsModal.classList.remove('open');
      if (readerOverlay.classList.contains('open')) closeReaderMode();
      return;
    }

    // Book Reader specific shortcuts
    if (readerOverlay.classList.contains('open') && !inField) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); jumpChapter(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); jumpChapter(1); }
      else if (e.key.toLowerCase() === 'f') { e.preventDefault(); readerOverlay.classList.toggle('bars-hidden'); }
      else if (e.key.toLowerCase() === 't') { e.preventDefault(); readerSidebar.classList.toggle('open'); }
      else if (e.key.toLowerCase() === 'b') { e.preventDefault(); addCurrentBookmark(); }
      else if (e.key === ' ' && autoScrollTimer) {
        e.preventDefault();
        autoScrollPaused = !autoScrollPaused;
        showToast(autoScrollPaused ? 'Auto-Scroll dijeda.' : 'Auto-Scroll dilanjutkan.', 'info');
      }
    } else if (!inField && e.key === '?') {
      shortcutsModal.classList.add('open');
    }
  });

  // Init
  try {
    const savedRules = JSON.parse(storageGet(STORAGE_RULES, 'null'));
    if (savedRules) state.rules = Object.assign({}, state.rules, savedRules);
    const savedReader = JSON.parse(storageGet(STORAGE_READER, 'null'));
    if (savedReader) state.reader = Object.assign({}, state.reader, savedReader);
    const savedCodePrefs = JSON.parse(storageGet(STORAGE_CODE_PREFS, 'null'));
    if (savedCodePrefs) state.codeOpts = Object.assign({}, state.codeOpts, savedCodePrefs);
  } catch (e) {}

  renderRulesMenu();
  applyCodePreferences();
  applyTheme(storageGet(STORAGE_THEME, 'dark'));
  applyFontSize(storageGet(STORAGE_FONT, '14'));
  loadHistory();
  loadBookmarks();

  const savedDraft = storageGet(STORAGE_DRAFT, null);
  rawInput.value = savedDraft !== null ? savedDraft : SAMPLES.mixed;
  processInput(false, true);
})(window);
