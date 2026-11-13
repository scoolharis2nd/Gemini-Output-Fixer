(function (global) {
  'use strict';

  const STORAGE_DRAFT = 'aistudio_fixer_draft_v2';
  const STORAGE_HISTORY = 'aistudio_fixer_history_v2';
  const STORAGE_THEME = 'aistudio_fixer_theme_v2';
  const STORAGE_FONT = 'aistudio_fixer_font_v2';
  const STORAGE_RULES = 'aistudio_fixer_rules_v2';
  const STORAGE_READER = 'aistudio_fixer_reader_v1';

  const SAMPLE_TEXT = `#Laporan Analisis Performa API\u200B\u200C
Berikut adalah ringkasan hasil uji coba sistem yang mengalami â€œbottleneckâ€ pada jam sibuk.



-Peningkatan latensi sebesar **42% pada endpoint \`/v1/generate
-Penggunaan memori melonjak hingga __92% sebelum restart

1.Lakukan optimasi query database
3.Aktifkan caching Redis untuk respons statis
7.Tambahkan rate limiter per pengguna

###Tabel Perbandingan Metrik
| Metrik | Sebelum | Sesudah
|---|---|
| Rata-rata Latensi | 840 ms | 210 ms
| Error Rate | 4.8% | 0.2% |

Rumus perhitungan efisiensi cache:
\\[ E = \\frac{H_{hit}}{H_{hit} + M_{miss}} \\times 100\\%

Contoh implementasi middleware caching di JavaScript:
\`\`\`javascript
async function cacheMiddleware(req, res, next) {
  // Cek apakah key tersedia di Redis
  const key = \`cache:\${req.originalUrl}\`;
  const cached = await redis.get(key);
  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }
  next();`;

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
  const themeIconSun = document.getElementById('themeIconSun');
  const themeIconMoon = document.getElementById('themeIconMoon');
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
  const tocToggleBtn = document.getElementById('tocToggleBtn');
  const readerModeBtn = document.getElementById('readerModeBtn');
  const openWindowBtn = document.getElementById('openWindowBtn');

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

  // Reader Mode Elements
  const readerOverlay = document.getElementById('readerOverlay');
  const readerProgressFill = document.getElementById('readerProgressFill');
  const closeReaderBtn = document.getElementById('closeReaderBtn');
  const readerThemeSelect = document.getElementById('readerThemeSelect');
  const readerFontSelect = document.getElementById('readerFontSelect');
  const readerWidthSelect = document.getElementById('readerWidthSelect');
  const readerFontDecBtn = document.getElementById('readerFontDecBtn');
  const readerFontIncBtn = document.getElementById('readerFontIncBtn');
  const readerJustifyBtn = document.getElementById('readerJustifyBtn');
  const readerAutoScrollSelect = document.getElementById('readerAutoScrollSelect');
  const readerPopoutBtn = document.getElementById('readerPopoutBtn');
  const readerScroll = document.getElementById('readerScroll');
  const readerArticle = document.getElementById('readerArticle');
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
    viewMode: 'preview',
    fixedMarkdown: '',
    isTruncated: false,
    useRegex: false,
    caseSensitive: false,
    showToc: false,
    codeBlocks: [],
    headings: [],
    history: [],
    undoStack: [],
    redoStack: [],
    rules: Object.assign({}, global.FixerParser.DEFAULT_RULES),
    reader: {
      theme: 'dark',
      font: 'serif',
      width: 'medium',
      size: 18,
      justify: false,
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

  let processTimer = null;
  let saveTimer = null;

  function scheduleProcessInput(skipUndo) {
    const len = rawInput.value.length;
    if (len < 3000) {
      processInput(skipUndo);
    } else {
      clearTimeout(processTimer);
      processTimer = setTimeout(() => processInput(skipUndo), 90);
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

    rawOutput.value = fixed;
    previewOutput.innerHTML = global.FixerRenderer.renderMarkdownToHtml(fixed);
    if (state.viewMode === 'diff') {
      diffOutput.innerHTML = global.FixerRenderer.renderDiffHtml(global.FixerParser.computeLineDiff(inputVal, fixed));
    }
    if (readerOverlay.classList.contains('open')) {
      readerArticle.innerHTML = previewOutput.innerHTML;
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
  // STORY / FANFICTION READER MODE & POP-OUT WINDOW
  // =========================================================
  let autoScrollTimer = null;

  function applyReaderPrefs() {
    const r = state.reader;
    readerOverlay.setAttribute('data-rtheme', r.theme);
    readerThemeSelect.value = r.theme;
    readerFontSelect.value = r.font;
    readerWidthSelect.value = r.width;
    readerArticle.className = `reader-article font-${r.font} width-${r.width} md-preview` + (r.justify ? ' align-justify' : '');
    readerArticle.style.fontSize = r.size + 'px';
    readerJustifyBtn.classList.toggle('active', r.justify);
    storageSet(STORAGE_READER, JSON.stringify(r));
  }

  function openReaderMode() {
    if (!state.fixedMarkdown.trim()) {
      showToast('Belum ada output untuk dibaca.', 'warning');
      return;
    }
    readerArticle.innerHTML = previewOutput.innerHTML;
    applyReaderPrefs();
    readerOverlay.classList.add('open');
    readerOverlay.classList.remove('bars-hidden');
    readerScroll.scrollTop = state.reader.scrollPos || 0;
    updateReaderProgress();
  }

  function closeReaderMode() {
    stopAutoScroll();
    readerAutoScrollSelect.value = '0';
    readerOverlay.classList.remove('open');
  }

  function updateReaderProgress() {
    const max = readerScroll.scrollHeight - readerScroll.clientHeight;
    const pct = max > 0 ? Math.min(100, Math.round((readerScroll.scrollTop / max) * 100)) : 0;
    readerProgressFill.style.width = pct + '%';
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

  function buildStandaloneHtml() {
    const r = state.reader;
    const bgMap = { dark: '#111622', amoled: '#000000', sepia: '#f4ecd8', light: '#ffffff' };
    const fgMap = { dark: '#dde5f0', amoled: '#d4d4d8', sepia: '#3e2f20', light: '#1e293b' };
    const fontCss = r.font === 'serif' ? 'Georgia, "Times New Roman", serif' : r.font === 'mono' ? 'ui-monospace, monospace' : 'system-ui, -apple-system, sans-serif';
    const maxW = r.width === 'narrow' ? '54ch' : r.width === 'wide' ? '88ch' : '68ch';
    return `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Story Reader — Fixed Output</title><style>body{margin:0;padding:28px 20px 64px;background:${bgMap[r.theme] || '#111622'};color:${fgMap[r.theme] || '#dde5f0'};font-family:${fontCss};font-size:${r.size}px;line-height:1.8;}main{max-width:${maxW};margin:0 auto;}p{margin:0 0 1.15em;${r.justify ? 'text-align:justify;' : ''}}pre{background:rgba(128,128,128,0.12);padding:14px;border-radius:8px;overflow-x:auto;}table{border-collapse:collapse;width:100%;margin:16px 0;}th,td{border:1px solid rgba(128,128,128,0.3);padding:8px 12px;text-align:left;}blockquote{border-left:3px solid #3b82f6;margin:14px 0;padding:8px 14px;background:rgba(59,130,246,0.08);}</style></head><body><main>${previewOutput.innerHTML}</main></body></html>`;
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
        showToast('Popup diblokir browser. Dibuka di Reader View layar penuh.', 'info');
      }
    } catch (e) {
      openReaderMode();
    }
  }

  // =========================================================
  // FIND & REPLACE, MODALS, EXPORTS
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

  function openCodeExtractModal() {
    if (!state.codeBlocks.length) {
      showToast('Tidak ada blok kode ditemukan.', 'warning');
      return;
    }
    codeExtractBody.innerHTML = state.codeBlocks.map((cb, idx) => `
      <div class="code-card">
        <div class="code-card-header">
          <span class="code-lang">#${idx + 1} ${global.FixerRenderer.escapeHtml(cb.lang)}</span>
          <button class="btn btn-sm extract-copy-btn" type="button" data-code="${encodeURIComponent(cb.code)}">Copy</button>
        </div>
        <pre style="max-height:180px;"><code>${global.FixerRenderer.escapeHtml(cb.code)}</code></pre>
      </div>
    `).join('');
    codeExtractModal.classList.add('open');
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

  readerModeBtn.addEventListener('click', openReaderMode);
  mobBarReader.addEventListener('click', openReaderMode);
  openWindowBtn.addEventListener('click', openStandaloneWindow);
  readerPopoutBtn.addEventListener('click', openStandaloneWindow);
  closeReaderBtn.addEventListener('click', closeReaderMode);

  readerThemeSelect.addEventListener('change', (e) => { state.reader.theme = e.target.value; applyReaderPrefs(); });
  readerFontSelect.addEventListener('change', (e) => { state.reader.font = e.target.value; applyReaderPrefs(); });
  readerWidthSelect.addEventListener('change', (e) => { state.reader.width = e.target.value; applyReaderPrefs(); });
  readerFontDecBtn.addEventListener('click', () => { state.reader.size = Math.max(13, state.reader.size - 1); applyReaderPrefs(); });
  readerFontIncBtn.addEventListener('click', () => { state.reader.size = Math.min(26, state.reader.size + 1); applyReaderPrefs(); });
  readerJustifyBtn.addEventListener('click', () => { state.reader.justify = !state.reader.justify; applyReaderPrefs(); });
  readerAutoScrollSelect.addEventListener('change', (e) => startAutoScroll(Number(e.target.value)));
  readerScroll.addEventListener('scroll', updateReaderProgress, { passive: true });
  readerArticle.addEventListener('click', () => readerOverlay.classList.toggle('bars-hidden'));
  readerTopBtn.addEventListener('click', () => readerScroll.scrollTo({ top: 0, behavior: 'smooth' }));

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIconSun.style.display = theme === 'dark' ? 'none' : 'block';
    themeIconMoon.style.display = theme === 'dark' ? 'block' : 'none';
    storageSet(STORAGE_THEME, theme);
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
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
    processInput(false);
    showToast('Editor dibersihkan.', 'info');
  });
  sampleBtn.addEventListener('click', () => {
    rawInput.value = SAMPLE_TEXT;
    processInput(false);
    showToast('Sample output rusak dimuat.', 'info');
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
      processInput(false);
      showToast(`File ${file.name} dimuat.`, 'success');
    };
    reader.readAsText(file);
  });

  previewOutput.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-code-btn');
    if (!btn) return;
    const code = decodeURIComponent(btn.getAttribute('data-code') || '');
    copyText(code, 'Potongan kode disalin!');
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1400);
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

  extractCodeBtn.addEventListener('click', openCodeExtractModal);
  closeCodeModalBtn.addEventListener('click', () => codeExtractModal.classList.remove('open'));
  codeExtractModal.addEventListener('click', (e) => {
    if (e.target === codeExtractModal) codeExtractModal.classList.remove('open');
  });
  codeExtractBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.extract-copy-btn');
    if (!btn) return;
    copyText(decodeURIComponent(btn.getAttribute('data-code') || ''), 'Kode disalin!');
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
  } catch (e) {}

  renderRulesMenu();
  applyTheme(storageGet(STORAGE_THEME, 'dark'));
  applyFontSize(storageGet(STORAGE_FONT, '14'));
  loadHistory();

  const savedDraft = storageGet(STORAGE_DRAFT, null);
  rawInput.value = savedDraft !== null ? savedDraft : SAMPLE_TEXT;
  processInput(false);
})(window);
