(function (global) {
  'use strict';

  const STORAGE_DRAFT = 'aistudio_fixer_draft_v2';
  const STORAGE_HISTORY = 'aistudio_fixer_history_v2';
  const STORAGE_THEME = 'aistudio_fixer_theme_v3';
  const STORAGE_FONT = 'aistudio_fixer_font_v2';
  const STORAGE_RULES = 'aistudio_fixer_rules_v2';
  const STORAGE_READER = 'aistudio_fixer_reader_v2';
  const STORAGE_CODE_PREFS = 'aistudio_fixer_codeprefs_v1';

  const SAMPLE_TEXT = `#Bab 1: Senja di Stasiun Lama\u200B\u200C
Angin sore berhembus pelan melewati peron yang hampir kosong. Raka menatap jam saku miliknya yang jarumnya berhenti tepat pada pukul lima lewat sepuluh.



"Kau masih menunggu kereta yang sama?" suara itu terdengar dari balik bayangan pilar batu.
Raka menoleh perlahan, mendapati Dina berdiri dengan mantel cokelat tuanya. **Matanya menyimpan rahasia yang belum sempat terucap selama tiga tahun terakhir.

---

###Catatan Penulis &amp; Implementasi Kode
-Latar tempat terinspirasi dari stasiun tua bergaya kolonial
-Gunakan \`Code View\` atau klik tanda panah di kartu kode untuk **Collapse/Expand**

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
    return max(1, (kata + wpm - 1) // wpm)`;

  const rawInput = document.getElementById('rawInput');
  const previewOutput = document.getElementById('previewOutput');
  const rawOutput = document.getElementById('rawOutput');
  const diffOutput = document.getElementById('diffOutput');
  const diagBadges = document.getElementById('diagBadges');
  const statWords = document.getElementById('statWords');
  const statChars = document.getElementById('statChars');
  const statRead = document.getElementById('statRead');
  const truncationBanner = document.getElementById('truncationBanner');
  const tocBar = document.getElementById('tocBar');

  const modePreviewBtn = document.getElementById('modePreviewBtn');
  const modeRawBtn = document.getElementById('modeRawBtn');
  const modeDiffBtn = document.getElementById('modeDiffBtn');

  const themeToggle = document.getElementById('themeToggle');
  const themeLabel = document.getElementById('themeLabel');
  const fontSizeSlider = document.getElementById('fontSizeSlider');
  const fontSizeLabel = document.getElementById('fontSizeLabel');

  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const sampleBtn = document.getElementById('sampleBtn');
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

  // Coding Toolbar Elements
  const codeBarToggleBtn = document.getElementById('codeBarToggleBtn');
  const codeToolbarBar = document.getElementById('codeToolbarBar');
  const expandAllCodeBtn = document.getElementById('expandAllCodeBtn');
  const collapseAllCodeBtn = document.getElementById('collapseAllCodeBtn');
  const toggleLineNumsBtn = document.getElementById('toggleLineNumsBtn');
  const toggleWrapAllBtn = document.getElementById('toggleWrapAllBtn');
  const copyAllCodeBtn = document.getElementById('copyAllCodeBtn');

  const findToggleBtn = document.getElementById('findToggleBtn');
  const findBar = document.getElementById('findBar');
  const findInput = document.getElementById('findInput');
  const replaceInput = document.getElementById('replaceInput');
  const regexToggle = document.getElementById('regexToggle');
  const caseToggle = document.getElementById('caseToggle');
  const findCount = document.getElementById('findCount');
  const replaceNextBtn = document.getElementById('replaceNextBtn');
  const replaceAllBtn = document.getElementById('replaceAllBtn');

  const rulesBtn = document.getElementById('rulesBtn');
  const rulesMenu = document.getElementById('rulesMenu');
  const historyBtn = document.getElementById('historyBtn');
  const historyMenu = document.getElementById('historyMenu');
  const historyCount = document.getElementById('historyCount');
  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');

  const continueModal = document.getElementById('continueModal');
  const continuePromptText = document.getElementById('continuePromptText');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const copyContinueBtn = document.getElementById('copyContinueBtn');

  const codeExtractModal = document.getElementById('codeExtractModal');
  const codeExtractBody = document.getElementById('codeExtractBody');
  const closeCodeModalBtn = document.getElementById('closeCodeModalBtn');
  const codeFilterInput = document.getElementById('codeFilterInput');
  const modalExpandAllBtn = document.getElementById('modalExpandAllBtn');
  const modalCollapseAllBtn = document.getElementById('modalCollapseAllBtn');
  const modalCopyAllCodeBtn = document.getElementById('modalCopyAllCodeBtn');

  // Reader View Elements
  const readerOverlay = document.getElementById('readerOverlay');
  const readerProgressFill = document.getElementById('readerProgressFill');
  const readerShowBarsBtn = document.getElementById('readerShowBarsBtn');
  const closeReaderBtn = document.getElementById('closeReaderBtn');
  const readerChapterTitle = document.getElementById('readerChapterTitle');
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
  const readerJustifyBtn = document.getElementById('readerJustifyBtn');
  const readerIndentBtn = document.getElementById('readerIndentBtn');
  const readerDropCapBtn = document.getElementById('readerDropCapBtn');
  const readerAutoScrollSelect = document.getElementById('readerAutoScrollSelect');
  const readerPopoutBtn = document.getElementById('readerPopoutBtn');
  const readerScroll = document.getElementById('readerScroll');
  const readerPage = document.getElementById('readerPage');
  const readerArticle = document.getElementById('readerArticle');
  const readerPrevChapBtn = document.getElementById('readerPrevChapBtn');
  const readerNextChapBtn = document.getElementById('readerNextChapBtn');
  const readerStatusText = document.getElementById('readerStatusText');
  const readerTtsBtn = document.getElementById('readerTtsBtn');
  const readerTopBtn = document.getElementById('readerTopBtn');

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
    viewMode: 'preview',
    fixedMarkdown: '',
    totalWords: 0,
    isTruncated: false,
    useRegex: false,
    caseSensitive: false,
    showToc: false,
    showCodeBar: false,
    codeBlocks: [],
    headings: [],
    history: [],
    undoStack: [],
    redoStack: [],
    rules: Object.assign({}, global.FixerParser.DEFAULT_RULES),
    codeOpts: {
      collapsedDefault: false,
      showLineNumbers: true,
      wrapLines: false
    },
    reader: {
      theme: 'sepia',
      font: 'serif',
      width: 'medium',
      size: 18,
      lineHeight: '1.85',
      justify: true,
      indent: false,
      dropCap: true,
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
    }, 2200);
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
      javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts',
      python: 'py', py: 'py', html: 'html', css: 'css',
      json: 'json', sql: 'sql', bash: 'sh', sh: 'sh',
      java: 'java', cpp: 'cpp', c: 'c', go: 'go', rust: 'rs', php: 'php'
    };
    return map[(lang || '').toLowerCase()] || 'txt';
  }

  function pushUndo(val) {
    if (state.undoStack[state.undoStack.length - 1] === val) return;
    state.undoStack.push(val);
    if (state.undoStack.length > 40) state.undoStack.shift();
    state.redoStack = [];
    updateUndoRedoBtns();
  }

  function updateUndoRedoBtns() {
    undoBtn.disabled = state.undoStack.length <= 1;
    redoBtn.disabled = state.redoStack.length === 0;
  }

  function renderDiagnostics(stats) {
    const items = [];
    if (stats.codeBlocks > 0) items.push({ label: `${stats.codeBlocks} Code Block`, cls: 'active-fix' });
    if (stats.tables > 0) items.push({ label: `${stats.tables} Tabel`, cls: 'active-fix' });
    if (stats.inlineTags > 0) items.push({ label: `${stats.inlineTags} Tag Inline`, cls: 'active-fix' });
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
    state.totalWords = words;
    const chars = text.length;
    const mins = Math.max(1, Math.ceil(words / 200));
    statWords.textContent = words.toLocaleString('id-ID');
    statChars.textContent = chars.toLocaleString('id-ID');
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

  function renderPreviewOnly() {
    previewOutput.innerHTML = global.FixerRenderer.renderMarkdownToHtml(state.fixedMarkdown, {
      bookOrnament: state.theme === 'book',
      codeOpts: state.codeOpts
    });
  }

  let processTimer = null;
  let saveTimer = null;

  function scheduleProcessInput(skipUndo) {
    const len = rawInput.value.length;
    if (len < 3500) {
      processInput(skipUndo);
    } else {
      clearTimeout(processTimer);
      processTimer = setTimeout(() => processInput(skipUndo), 95);
    }
  }

  function processInput(skipUndo) {
    const inputVal = rawInput.value;
    if (!skipUndo) pushUndo(inputVal);

    const { fixed, stats, codeBlocks, headings } = global.FixerParser.autoHealMarkdown(inputVal, state.rules);
    state.fixedMarkdown = fixed;
    state.isTruncated = stats.truncated;
    state.codeBlocks = codeBlocks;
    state.headings = headings;
    codeCountBadge.textContent = codeBlocks.length;

    rawOutput.value = fixed;
    renderPreviewOnly();
    if (state.viewMode === 'diff') {
      diffOutput.innerHTML = global.FixerRenderer.renderDiffHtml(global.FixerParser.computeLineDiff(inputVal, fixed));
    }
    if (readerOverlay.classList.contains('open')) {
      renderReaderContent();
    }

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

    previewOutput.style.display = mode === 'preview' ? 'block' : 'none';
    rawOutput.style.display = mode === 'raw' ? 'block' : 'none';
    diffOutput.style.display = mode === 'diff' ? 'block' : 'none';

    if (mode === 'diff') {
      diffOutput.innerHTML = global.FixerRenderer.renderDiffHtml(
        global.FixerParser.computeLineDiff(rawInput.value, state.fixedMarkdown)
      );
    }
  }

  // =========================================================
  // CODE CARD INTERACTIONS (COLLAPSE / EXPAND / WRAP / SAVE)
  // =========================================================
  function handleCodeCardClick(e, containerEl) {
    const collapseBtn = e.target.closest('.code-collapse-btn');
    const leftHeader = e.target.closest('.code-card-left');
    if (collapseBtn || leftHeader) {
      const card = e.target.closest('.code-card');
      if (!card) return;
      const isCollapsed = card.classList.toggle('collapsed');
      const btn = card.querySelector('.code-collapse-btn');
      if (btn) btn.setAttribute('aria-expanded', String(!isCollapsed));
      return true;
    }

    const wrapBtn = e.target.closest('.wrap-code-btn');
    if (wrapBtn) {
      const card = e.target.closest('.code-card');
      if (!card) return;
      const isWrapped = card.classList.toggle('wrap-lines');
      wrapBtn.classList.toggle('btn-primary', isWrapped);
      return true;
    }

    const saveBtn = e.target.closest('.save-code-btn');
    if (saveBtn) {
      const code = decodeURIComponent(saveBtn.getAttribute('data-code') || '');
      const lang = saveBtn.getAttribute('data-lang') || 'txt';
      const ext = getExtForLang(lang);
      downloadFile(`snippet.${ext}`, code, 'text/plain');
      return true;
    }

    const copyBtn = e.target.closest('.copy-code-btn');
    if (copyBtn) {
      const code = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
      copyText(code, 'Potongan kode disalin!');
      const orig = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = orig; }, 1400);
      return true;
    }

    const jumpBtn = e.target.closest('.jump-code-btn');
    if (jumpBtn && containerEl === codeExtractBody) {
      const idx = jumpBtn.getAttribute('data-code-idx');
      codeExtractModal.classList.remove('open');
      setViewMode('preview');
      const target = document.getElementById('code-block-' + idx);
      if (target) {
        target.classList.remove('collapsed');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('code-card-highlight');
        setTimeout(() => target.classList.remove('code-card-highlight'), 1400);
      }
      return true;
    }

    return false;
  }

  function setAllCodeCardsCollapsed(container, collapsed) {
    container.querySelectorAll('.code-card').forEach(card => {
      card.classList.toggle('collapsed', collapsed);
      const btn = card.querySelector('.code-collapse-btn');
      if (btn) btn.setAttribute('aria-expanded', String(!collapsed));
    });
  }

  function updateCodeToolbarButtons() {
    toggleLineNumsBtn.classList.toggle('btn-primary', state.codeOpts.showLineNumbers);
    toggleWrapAllBtn.classList.toggle('btn-primary', state.codeOpts.wrapLines);
    storageSet(STORAGE_CODE_PREFS, JSON.stringify(state.codeOpts));
  }

  function renderCodeExplorerList() {
    const q = (codeFilterInput.value || '').trim().toLowerCase();
    const filtered = state.codeBlocks
      .map((cb, idx) => ({ cb, idx }))
      .filter(({ cb }) => !q || cb.lang.toLowerCase().includes(q) || cb.code.toLowerCase().includes(q));

    if (!filtered.length) {
      codeExtractBody.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:13px;">Tidak ada blok kode yang cocok.</div>';
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

  function openCodeExtractModal() {
    if (!state.codeBlocks.length) {
      showToast('Tidak ada blok kode ditemukan.', 'warning');
      return;
    }
    codeFilterInput.value = '';
    renderCodeExplorerList();
    codeExtractModal.classList.add('open');
  }

  // =========================================================
  // HISTORY & RULES
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
      raw: rawText
    };
    state.history = [entry, ...state.history.filter(h => h.raw !== rawText)].slice(0, 10);
    storageSet(STORAGE_HISTORY, JSON.stringify(state.history));
    renderHistoryMenu();
  }

  function renderHistoryMenu() {
    historyCount.textContent = state.history.length;
    if (state.history.length === 0) {
      historyMenu.innerHTML = '<div style="padding:10px;font-size:12px;color:var(--text-muted);">Belum ada riwayat perbaikan.</div>';
      return;
    }
    historyMenu.innerHTML = state.history.map((h, idx) => `
      <button class="dropdown-item" type="button" data-hist-idx="${idx}">
        <strong>${global.FixerRenderer.escapeHtml(h.snippet)}...</strong>
        <small>${h.time} &bull; ${h.fixes} perbaikan</small>
      </button>
    `).join('');
  }

  function renderRulesMenu() {
    const labels = [
      ['sanitize', 'Sanitasi Karakter & Spasi'],
      ['codeBlocks', 'Auto-Close Code Blocks'],
      ['tables', 'Perbaiki Tabel Markdown'],
      ['listsHeadings', 'Fix List & Heading'],
      ['math', 'Bersihkan LaTeX / Math'],
      ['inlineTags', 'Tutup Tag Inline (` ** _)'],
      ['storyDialogue', 'Rapikan Paragraf Dialog Cerita']
    ];
    rulesMenu.innerHTML = labels.map(([key, label]) => `
      <label class="rule-toggle">
        <span>${label}</span>
        <input type="checkbox" data-rule="${key}" ${state.rules[key] ? 'checked' : ''}>
      </label>
    `).join('');
  }

  // =========================================================
  // BOOK / FANFICTION READER VIEW
  // =========================================================
  let autoScrollTimer = null;
  let currentChapterIdx = 0;

  function renderReaderContent() {
    readerArticle.innerHTML = global.FixerRenderer.renderMarkdownToHtml(state.fixedMarkdown, {
      bookOrnament: true,
      idPrefix: 'reader-h-',
      codeIdPrefix: 'reader-code-',
      codeOpts: state.codeOpts
    });
    readerChapterTitle.textContent = state.headings.length ? state.headings[0].text : 'Mode Buku & Fanfiksi';
  }

  function applyReaderPrefs() {
    const r = state.reader;
    readerOverlay.setAttribute('data-rtheme', r.theme);
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
    storageSet(STORAGE_READER, JSON.stringify(r));
  }

  function openReaderMode() {
    if (!state.fixedMarkdown.trim()) {
      showToast('Belum ada output untuk dibaca.', 'warning');
      return;
    }
    renderReaderContent();
    applyReaderPrefs();
    readerSettingsDrawer.classList.remove('open');
    readerSettingsToggleBtn.classList.remove('active');
    readerOverlay.classList.remove('bars-hidden');
    readerOverlay.classList.add('open');
    readerScroll.scrollTop = state.reader.scrollPos || 0;
    updateReaderProgress();
  }

  function stopTts() {
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (e) {}
    readerTtsBtn.classList.remove('active');
    readerTtsBtn.textContent = 'Bacakan';
  }

  function closeReaderMode() {
    stopAutoScroll();
    stopTts();
    readerAutoScrollSelect.value = '0';
    readerOverlay.classList.remove('open');
  }

  function updateReaderProgress() {
    const max = readerScroll.scrollHeight - readerScroll.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.round((readerScroll.scrollTop / max) * 100)) : 100;
    readerProgressFill.style.width = pct + '%';

    const totalMins = Math.max(1, Math.ceil(state.totalWords / 200));
    const remMins = Math.max(0, Math.round(totalMins * (1 - pct / 100)));
    readerStatusText.textContent = `${pct}% \u2022 ~${remMins} mnt tersisa`;

    state.reader.scrollPos = readerScroll.scrollTop;
    storageSet(STORAGE_READER, JSON.stringify(state.reader));
  }

  function stopAutoScroll() {
    if (autoScrollTimer) {
      clearInterval(autoScrollTimer);
      autoScrollTimer = null;
    }
  }

  function startAutoScroll(speed) {
    stopAutoScroll();
    if (!speed || speed <= 0) return;
    autoScrollTimer = setInterval(() => {
      readerScroll.scrollTop += speed;
      if (readerScroll.scrollTop + readerScroll.clientHeight >= readerScroll.scrollHeight - 2) {
        stopAutoScroll();
        readerAutoScrollSelect.value = '0';
      }
    }, 45);
  }

  function jumpChapter(delta) {
    if (!state.headings.length) return;
    currentChapterIdx = Math.max(0, Math.min(state.headings.length - 1, currentChapterIdx + delta));
    const el = document.getElementById('reader-h-' + currentChapterIdx);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      readerChapterTitle.textContent = state.headings[currentChapterIdx].text;
    }
  }

  function buildStandaloneHtml() {
    const r = state.reader;
    const bgMap = { sepia: '#f7f1e3', cream: '#fcfbf7', dark: '#131926', amoled: '#000000' };
    const fgMap = { sepia: '#2f2419', cream: '#262626', dark: '#dce3ee', amoled: '#d4d4d8' };
    const fontCss = r.font === 'serif' ? 'Georgia, "Palatino Linotype", serif' : r.font === 'mono' ? 'ui-monospace, monospace' : 'system-ui, sans-serif';
    const maxW = r.width === 'narrow' ? '56ch' : r.width === 'wide' ? '92ch' : '72ch';
    const bodyHtml = global.FixerRenderer.renderMarkdownToHtml(state.fixedMarkdown, { bookOrnament: true, codeOpts: state.codeOpts });
    return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Book Reader</title><style>body{margin:0;padding:28px 18px 64px;background:${bgMap[r.theme] || '#f7f1e3'};color:${fgMap[r.theme] || '#2f2419'};font-family:${fontCss};font-size:${r.size}px;line-height:${r.lineHeight};}main{max-width:${maxW};margin:0 auto;}h1,h2,h3{text-align:center;}p{margin:0 0 1.15em;${r.justify ? 'text-align:justify;' : ''}${r.indent ? 'text-indent:1.7em;margin-bottom:0.5em;' : ''}}.scene-break{text-align:center;margin:1.8em 0;letter-spacing:0.25em;opacity:0.7;}pre{background:rgba(128,128,128,0.12);padding:14px;border-radius:8px;overflow-x:auto;}table{border-collapse:collapse;width:100%;margin:16px 0;}th,td{border:1px solid rgba(128,128,128,0.3);padding:8px 12px;text-align:left;}blockquote{border-left:3px solid #9a5523;margin:14px 0;padding:8px 14px;background:rgba(154,85,35,0.08);}</style></head><body><main>${bodyHtml}</main></body></html>`;
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
        showToast('Popup diblokir browser. Dibuka di Book Reader layar penuh.', 'info');
      }
    } catch (e) {
      openReaderMode();
    }
  }

  // =========================================================
  // FIND & REPLACE, EXPORTS, HELPERS
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

  function updateFindMatches() {
    if (!findBar.classList.contains('open')) return;
    const re = buildFindRegex(true);
    if (!re) {
      findCount.textContent = findInput.value ? 'Regex invalid' : '0 cocok';
      return;
    }
    const matches = rawInput.value.match(re);
    findCount.textContent = `${matches ? matches.length : 0} cocok`;
  }

  function openContinuationModal() {
    const clean = (state.fixedMarkdown || rawInput.value).trim();
    if (!clean) {
      showToast('Masukkan teks terlebih dahulu.', 'warning');
      return;
    }
    const sentences = clean.split(/(?<=[.!?])\s+/).filter(Boolean);
    const tail = sentences.length >= 2 ? sentences.slice(-2).join(' ') : clean.slice(-220);
    continuePromptText.value = `Lanjutkan respons Anda sebelumnya tepat dari titik terakhir ini tanpa mengulang bagian yang sudah dijelaskan. Pastikan format Markdown dan blok kode tetap konsisten.\n\nDua kalimat / bagian terakhir sebelum terpotong:\n"${tail}"`;
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
          processInput(false);
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

  // Event Listeners
  rawInput.addEventListener('input', () => scheduleProcessInput(false));

  modePreviewBtn.addEventListener('click', () => setViewMode('preview'));
  modeRawBtn.addEventListener('click', () => setViewMode('raw'));
  modeDiffBtn.addEventListener('click', () => setViewMode('diff'));

  // Coding Toolbar Listeners
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
    updateCodeToolbarButtons();
    renderPreviewOnly();
  });
  toggleWrapAllBtn.addEventListener('click', () => {
    state.codeOpts.wrapLines = !state.codeOpts.wrapLines;
    updateCodeToolbarButtons();
    renderPreviewOnly();
  });
  copyAllCodeBtn.addEventListener('click', () => {
    if (!state.codeBlocks.length) {
      showToast('Tidak ada blok kode ditemukan.', 'warning');
      return;
    }
    const combined = state.codeBlocks.map((cb, idx) => `// --- [${idx + 1}] ${cb.lang} ---\n${cb.code}`).join('\n\n');
    copyText(combined, `${state.codeBlocks.length} blok kode disalin!`);
  });

  // Code Explorer Modal Listeners
  extractCodeBtn.addEventListener('click', openCodeExtractModal);
  closeCodeModalBtn.addEventListener('click', () => codeExtractModal.classList.remove('open'));
  codeExtractModal.addEventListener('click', (e) => {
    if (e.target === codeExtractModal) codeExtractModal.classList.remove('open');
  });
  codeFilterInput.addEventListener('input', renderCodeExplorerList);
  modalExpandAllBtn.addEventListener('click', () => setAllCodeCardsCollapsed(codeExtractBody, false));
  modalCollapseAllBtn.addEventListener('click', () => setAllCodeCardsCollapsed(codeExtractBody, true));
  modalCopyAllCodeBtn.addEventListener('click', () => {
    const combined = state.codeBlocks.map((cb, idx) => `// --- [${idx + 1}] ${cb.lang} ---\n${cb.code}`).join('\n\n');
    copyText(combined, 'Semua blok kode disalin!');
  });

  previewOutput.addEventListener('click', (e) => handleCodeCardClick(e, previewOutput));
  codeExtractBody.addEventListener('click', (e) => handleCodeCardClick(e, codeExtractBody));

  // Reader View Listeners
  readerModeBtn.addEventListener('click', openReaderMode);
  mobBarReader.addEventListener('click', openReaderMode);
  openWindowBtn.addEventListener('click', openStandaloneWindow);
  readerPopoutBtn.addEventListener('click', openStandaloneWindow);
  closeReaderBtn.addEventListener('click', closeReaderMode);

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
  readerFontDecBtn.addEventListener('click', () => { state.reader.size = Math.max(13, state.reader.size - 1); applyReaderPrefs(); });
  readerFontIncBtn.addEventListener('click', () => { state.reader.size = Math.min(26, state.reader.size + 1); applyReaderPrefs(); });
  readerJustifyBtn.addEventListener('click', () => { state.reader.justify = !state.reader.justify; applyReaderPrefs(); });
  readerIndentBtn.addEventListener('click', () => { state.reader.indent = !state.reader.indent; applyReaderPrefs(); });
  readerDropCapBtn.addEventListener('click', () => { state.reader.dropCap = !state.reader.dropCap; applyReaderPrefs(); });
  readerAutoScrollSelect.addEventListener('change', (e) => startAutoScroll(Number(e.target.value)));
  readerScroll.addEventListener('scroll', updateReaderProgress, { passive: true });
  readerPrevChapBtn.addEventListener('click', () => jumpChapter(-1));
  readerNextChapBtn.addEventListener('click', () => jumpChapter(1));
  readerTopBtn.addEventListener('click', () => readerScroll.scrollTo({ top: 0, behavior: 'smooth' }));

  readerArticle.addEventListener('click', (e) => {
    if (handleCodeCardClick(e, readerArticle)) return;
    if (e.target.closest('a, button, pre, code')) return;
    const sel = window.getSelection ? window.getSelection().toString() : '';
    if (sel.length > 0) return;
    readerOverlay.classList.toggle('bars-hidden');
  });

  readerTtsBtn.addEventListener('click', () => {
    try {
      if (!('speechSynthesis' in window)) {
        showToast('Browser tidak mendukung fitur baca suara.', 'warning');
        return;
      }
      if (window.speechSynthesis.speaking) {
        stopTts();
        return;
      }
      const text = stripMarkdownToPlain(state.fixedMarkdown);
      if (!text.trim()) return;
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'id-ID';
      utt.onend = stopTts;
      utt.onerror = stopTts;
      window.speechSynthesis.speak(utt);
      readerTtsBtn.classList.add('active');
      readerTtsBtn.textContent = 'Stop';
    } catch (e) {
      showToast('Gagal memulai pembaca suara.', 'warning');
    }
  });

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

  pasteBtn.addEventListener('click', handlePaste);
  mobBarPaste.addEventListener('click', handlePaste);
  clearBtn.addEventListener('click', () => {
    rawInput.value = '';
    state.reader.scrollPos = 0;
    processInput(false);
    showToast('Editor dibersihkan.', 'info');
  });
  sampleBtn.addEventListener('click', () => {
    rawInput.value = SAMPLE_TEXT;
    state.reader.scrollPos = 0;
    processInput(false);
    showToast('Sample cerita & kode dimuat.', 'info');
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
      processInput(false);
      showToast(`File ${file.name} dimuat.`, 'success');
    };
    reader.readAsText(file);
    fileInput.value = '';
  });

  inputPanel.addEventListener('dragover', (e) => {
    e.preventDefault();
    inputPanel.classList.add('drag-over');
  });
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
      processInput(false);
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
    const el = document.getElementById(chip.getAttribute('data-toc-id'));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  findToggleBtn.addEventListener('click', () => {
    findBar.classList.toggle('open');
    if (findBar.classList.contains('open')) {
      findInput.focus();
      updateFindMatches();
    }
  });
  findInput.addEventListener('input', updateFindMatches);
  regexToggle.addEventListener('click', () => {
    state.useRegex = !state.useRegex;
    regexToggle.classList.toggle('active', state.useRegex);
    updateFindMatches();
  });
  caseToggle.addEventListener('click', () => {
    state.caseSensitive = !state.caseSensitive;
    caseToggle.classList.toggle('active', state.caseSensitive);
    updateFindMatches();
  });
  replaceNextBtn.addEventListener('click', () => {
    const re = buildFindRegex(false);
    if (!re || !re.test(rawInput.value)) {
      showToast('Tidak ada kecocokan ditemukan.', 'warning');
      return;
    }
    rawInput.value = rawInput.value.replace(re, replaceInput.value);
    processInput(false);
    showToast('1 kecocokan diganti.', 'success');
  });
  replaceAllBtn.addEventListener('click', () => {
    const re = buildFindRegex(true);
    if (!re) {
      showToast('Pola pencarian tidak valid.', 'warning');
      return;
    }
    const matches = rawInput.value.match(re);
    if (!matches) {
      showToast('Tidak ada kecocokan ditemukan.', 'warning');
      return;
    }
    rawInput.value = rawInput.value.replace(re, replaceInput.value);
    processInput(false);
    showToast(`${matches.length} kecocokan diganti.`, 'success');
  });

  function closeAllDropdowns() {
    rulesMenu.classList.remove('open');
    historyMenu.classList.remove('open');
    exportMenu.classList.remove('open');
  }
  rulesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = rulesMenu.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen) rulesMenu.classList.add('open');
  });
  historyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = historyMenu.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen) historyMenu.classList.add('open');
  });
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = exportMenu.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen) exportMenu.classList.add('open');
  });
  rulesMenu.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', closeAllDropdowns);

  rulesMenu.addEventListener('change', (e) => {
    const cb = e.target.closest('input[data-rule]');
    if (!cb) return;
    state.rules[cb.getAttribute('data-rule')] = cb.checked;
    storageSet(STORAGE_RULES, JSON.stringify(state.rules));
    processInput(true);
  });

  historyMenu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-hist-idx]');
    if (!item) return;
    const entry = state.history[Number(item.getAttribute('data-hist-idx'))];
    if (entry) {
      rawInput.value = entry.raw;
      state.reader.scrollPos = 0;
      processInput(false);
      showToast('Riwayat dimuat kembali.', 'info');
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
      downloadFile('fixed-output.json', JSON.stringify({ fixedMarkdown: state.fixedMarkdown, codeBlocks: state.codeBlocks, headings: state.headings }, null, 2), 'application/json');
    } else if (type === 'html') {
      downloadFile('fixed-output.html', buildStandaloneHtml(), 'text/html');
    }
  });

  continuePromptBtn.addEventListener('click', openContinuationModal);
  bannerContinueBtn.addEventListener('click', openContinuationModal);
  closeModalBtn.addEventListener('click', () => continueModal.classList.remove('open'));
  continueModal.addEventListener('click', (e) => {
    if (e.target === continueModal) continueModal.classList.remove('open');
  });
  copyContinueBtn.addEventListener('click', () => copyText(continuePromptText.value, 'Prompt lanjutan berhasil disalin!'));

  mobTabInput.addEventListener('click', () => switchMobilePanel('input'));
  mobTabOutput.addEventListener('click', () => switchMobilePanel('output'));
  mobBarInput.addEventListener('click', () => switchMobilePanel('input'));
  mobBarOutput.addEventListener('click', () => switchMobilePanel('output'));

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      copyText(state.fixedMarkdown, 'Fixed Markdown berhasil disalin!');
    } else if (e.key === 'Escape') {
      closeAllDropdowns();
      continueModal.classList.remove('open');
      codeExtractModal.classList.remove('open');
      if (readerOverlay.classList.contains('open')) closeReaderMode();
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
  updateCodeToolbarButtons();
  applyTheme(storageGet(STORAGE_THEME, 'book'));
  applyFontSize(storageGet(STORAGE_FONT, '14'));
  loadHistory();

  const savedDraft = storageGet(STORAGE_DRAFT, null);
  rawInput.value = savedDraft !== null ? savedDraft : SAMPLE_TEXT;
  processInput(false);
})(window);
