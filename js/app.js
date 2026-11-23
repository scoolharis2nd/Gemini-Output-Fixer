/**
 * Google AI Studio Output Fixer & Book Reader — Application Controller
 * Full-featured offline controller with:
 * - Resizable Split-Pane, Presets, Persistent History & Draft Auto-Save
 * - Smart Stitch Append Paste, Undo/Redo, Safe Regex Find & Replace
 * - IDE Code View, Code Explorer, Focus Lightbox & Live Sandboxed HTML/SVG Preview
 * - Masterpiece Book Reader (6 themes, 5 fonts, Chapter/Bookmark Drawer, Auto-Resume,
 *   Smooth Auto-Scroll, Focus Mode, Dialogue Highlight & Chunked Audiobook TTS)
 */
(function () {
  'use strict';

  const Parser = window.OutputParser;
  const Renderer = window.OutputRenderer;

  const STORAGE_KEYS = {
    DRAFT: 'aisof_draft_v2',
    RULES: 'aisof_rules_v2',
    SETTINGS: 'aisof_settings_v2',
    READER: 'aisof_reader_v2',
    HISTORY: 'aisof_history_v2',
    POSITIONS: 'aisof_read_pos_v2',
    BOOKMARKS: 'aisof_bookmarks_v2'
  };

  /* =========================================================
     SAFE LOCALSTORAGE HELPERS
     ========================================================= */
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {}
  }

  function hashText(str) {
    let h = 2166136261;
    const len = Math.min(str.length, 4000);
    for (let i = 0; i < len; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `doc_${(h >>> 0).toString(16)}_${str.length}`;
  }

  /* =========================================================
     APPLICATION STATE
     ========================================================= */
  const savedSettings = loadJSON(STORAGE_KEYS.SETTINGS, {});
  const savedReader = loadJSON(STORAGE_KEYS.READER, {});

  const state = {
    rules: Object.assign({}, Parser.DEFAULT_RULES, loadJSON(STORAGE_KEYS.RULES, {})),
    activePreset: savedSettings.activePreset || 'balanced',
    theme: savedSettings.theme || 'dark',
    fontSize: savedSettings.fontSize || 14,
    layout: savedSettings.layout || 'split',
    splitRatio: savedSettings.splitRatio || 50,
    outputMode: 'preview', // 'preview' | 'code' | 'raw' | 'diff'
    diffOnlyChanges: false,
    scrollSync: Boolean(savedSettings.scrollSync),
    codeBarOpen: false,
    tocOpen: false,
    mobilePanel: 'input',

    codeView: {
      showLineNumbers: true,
      wrapAll: false,
      collapsedSet: new Set(),
      filterLang: 'all',
      filterQuery: '',
      activeIdx: 0
    },

    find: {
      open: false,
      regex: false,
      caseSensitive: false,
      wholeWord: false,
      matches: [],
      currentIndex: -1
    },

    reader: Object.assign({
      open: false,
      theme: 'sepia',
      font: 'serif',
      fontSize: 18,
      lineHeight: '1.85',
      width: 'medium',
      sceneBreak: '✦  ✦  ✦',
      justify: false,
      indent: false,
      dropCap: true,
      highlightDialogue: false,
      focusMode: false,
      autoScrollSpeed: 0,
      barsHidden: false,
      ttsRate: 1,
      ttsVoiceURI: ''
    }, savedReader),

    focusModal: {
      codeIdx: -1,
      fontSize: 14,
      wrap: false,
      mode: 'code' // 'code' | 'split' | 'live'
    },

    history: loadJSON(STORAGE_KEYS.HISTORY, []),
    readPositions: loadJSON(STORAGE_KEYS.POSITIONS, {}),
    bookmarks: loadJSON(STORAGE_KEYS.BOOKMARKS, {}),

    undoStack: [],
    redoStack: [],
    lastResult: Parser.parseAndFix('', Parser.DEFAULT_RULES),
    lastDiff: null,
    currentDocHash: '',
    renderTimer: null,
    isSyncingScroll: false,

    // Auto-scroll & TTS runtime handles
    autoScrollRaf: null,
    autoScrollCarry: 0,
    ttsActive: false,
    ttsPaused: false,
    ttsNodes: [],
    ttsIndex: 0
  };

  /* =========================================================
     DOM REFERENCES
     ========================================================= */
  const $ = (id) => document.getElementById(id);
  const el = {
    workspace: $('workspace'),
    inputPanel: $('inputPanel'),
    outputPanel: $('outputPanel'),
    splitResizer: $('splitResizer'),
    rawInput: $('rawInput'),
    cursorPosLabel: $('cursorPosLabel'),

    // Header
    fontSizeSlider: $('fontSizeSlider'),
    fontSizeLabel: $('fontSizeLabel'),
    rulesBtn: $('rulesBtn'),
    rulesMenu: $('rulesMenu'),
    historyBtn: $('historyBtn'),
    historyMenu: $('historyMenu'),
    historyCount: $('historyCount'),
    exportBtn: $('exportBtn'),
    exportMenu: $('exportMenu'),
    shortcutsBtn: $('shortcutsBtn'),
    themeToggle: $('themeToggle'),
    themeLabel: $('themeLabel'),

    // Diagnostics & Stats
    diagBadges: $('diagBadges'),
    commitFixBtn: $('commitFixBtn'),
    statWords: $('statWords'),
    statChars: $('statChars'),
    statLines: $('statLines'),
    statCode: $('statCode'),
    statRead: $('statRead'),

    // Input Actions
    undoBtn: $('undoBtn'),
    redoBtn: $('redoBtn'),
    pasteBtn: $('pasteBtn'),
    appendPasteBtn: $('appendPasteBtn'),
    importFileBtn: $('importFileBtn'),
    fileInput: $('fileInput'),
    findToggleBtn: $('findToggleBtn'),
    sampleBtn: $('sampleBtn'),
    sampleMenu: $('sampleMenu'),
    clearBtn: $('clearBtn'),

    // Find Bar
    findBar: $('findBar'),
    findInput: $('findInput'),
    replaceInput: $('replaceInput'),
    regexToggle: $('regexToggle'),
    caseToggle: $('caseToggle'),
    wordToggle: $('wordToggle'),
    findCount: $('findCount'),
    findPrevBtn: $('findPrevBtn'),
    findNextBtn: $('findNextBtn'),
    replaceNextBtn: $('replaceNextBtn'),
    replaceAllBtn: $('replaceAllBtn'),
    closeFindBtn: $('closeFindBtn'),

    // Output Modes & Actions
    modePreviewBtn: $('modePreviewBtn'),
    modeCodeBtn: $('modeCodeBtn'),
    modeRawBtn: $('modeRawBtn'),
    modeDiffBtn: $('modeDiffBtn'),
    codeCountBadge: $('codeCountBadge'),
    readerModeBtn: $('readerModeBtn'),
    tocToggleBtn: $('tocToggleBtn'),
    codeBarToggleBtn: $('codeBarToggleBtn'),
    scrollSyncBtn: $('scrollSyncBtn'),
    openWindowBtn: $('openWindowBtn'),
    continuePromptBtn: $('continuePromptBtn'),
    copyPlainBtn: $('copyPlainBtn'),
    copyResultBtn: $('copyResultBtn'),

    // Sub-toolbars & Output Containers
    codeToolbarBar: $('codeToolbarBar'),
    expandAllCodeBtn: $('expandAllCodeBtn'),
    collapseAllCodeBtn: $('collapseAllCodeBtn'),
    toggleLineNumsBtn: $('toggleLineNumsBtn'),
    toggleWrapAllBtn: $('toggleWrapAllBtn'),
    extractCodeBtn: $('extractCodeBtn'),
    codeQuickFilter: $('codeQuickFilter'),
    copyAllCodeBtn: $('copyAllCodeBtn'),
    downloadAllCodeBtn: $('downloadAllCodeBtn'),

    diffToolbarBar: $('diffToolbarBar'),
    diffModeFullBtn: $('diffModeFullBtn'),
    diffModeChangesBtn: $('diffModeChangesBtn'),
    diffCounters: $('diffCounters'),

    tocBar: $('tocBar'),
    previewOutput: $('previewOutput'),
    codeOnlyView: $('codeOnlyView'),
    codeSidebarCount: $('codeSidebarCount'),
    codeLangPills: $('codeLangPills'),
    codeFileList: $('codeFileList'),
    codeStage: $('codeStage'),
    rawOutput: $('rawOutput'),
    diffOutput: $('diffOutput'),

    truncationBanner: $('truncationBanner'),
    truncationReason: $('truncationReason'),
    bannerContinueBtn: $('bannerContinueBtn'),

    // Mobile Nav
    mobTabInput: $('mobTabInput'),
    mobTabOutput: $('mobTabOutput'),
    mobBarPaste: $('mobBarPaste'),
    mobBarInput: $('mobBarInput'),
    mobBarOutput: $('mobBarOutput'),
    mobBarCode: $('mobBarCode'),
    mobBarReader: $('mobBarReader'),
    mobBarCopy: $('mobBarCopy'),

    // Book Reader
    readerOverlay: $('readerOverlay'),
    readerProgressFill: $('readerProgressFill'),
    readerShowBarsBtn: $('readerShowBarsBtn'),
    closeReaderBtn: $('closeReaderBtn'),
    readerDrawerToggleBtn: $('readerDrawerToggleBtn'),
    readerChapterTitle: $('readerChapterTitle'),
    readerBookmarkBtn: $('readerBookmarkBtn'),
    readerSettingsToggleBtn: $('readerSettingsToggleBtn'),
    readerFullscreenBtn: $('readerFullscreenBtn'),
    readerHideBarsBtn: $('readerHideBarsBtn'),
    readerPopoutBtn: $('readerPopoutBtn'),
    readerSettingsDrawer: $('readerSettingsDrawer'),
    readerFontSelect: $('readerFontSelect'),
    readerFontDecBtn: $('readerFontDecBtn'),
    readerFontIncBtn: $('readerFontIncBtn'),
    readerFontSizeLabel: $('readerFontSizeLabel'),
    readerLineHeightSelect: $('readerLineHeightSelect'),
    readerWidthSelect: $('readerWidthSelect'),
    readerSceneBreakSelect: $('readerSceneBreakSelect'),
    readerJustifyBtn: $('readerJustifyBtn'),
    readerIndentBtn: $('readerIndentBtn'),
    readerDropCapBtn: $('readerDropCapBtn'),
    readerDialogueBtn: $('readerDialogueBtn'),
    readerFocusModeBtn: $('readerFocusModeBtn'),
    readerAutoScrollSelect: $('readerAutoScrollSelect'),
    readerTtsVoiceSelect: $('readerTtsVoiceSelect'),
    readerTtsRateSelect: $('readerTtsRateSelect'),
    readerDrawerBackdrop: $('readerDrawerBackdrop'),
    readerDrawer: $('readerDrawer'),
    closeReaderDrawerBtn: $('closeReaderDrawerBtn'),
    readerBmCount: $('readerBmCount'),
    readerChaptersList: $('readerChaptersList'),
    readerBookmarksList: $('readerBookmarksList'),
    readerScroll: $('readerScroll'),
    readerPage: $('readerPage'),
    readerArticle: $('readerArticle'),
    readerPrevChapBtn: $('readerPrevChapBtn'),
    readerNextChapBtn: $('readerNextChapBtn'),
    readerStatusText: $('readerStatusText'),
    readerTtsBtn: $('readerTtsBtn'),
    readerTtsStopBtn: $('readerTtsStopBtn'),
    readerTopBtn: $('readerTopBtn'),

    // Modals
    continueModal: $('continueModal'),
    closeModalBtn: $('closeModalBtn'),
    continueLangSelect: $('continueLangSelect'),
    continueStyleSelect: $('continueStyleSelect'),
    continueLinesSelect: $('continueLinesSelect'),
    continuePromptText: $('continuePromptText'),
    copyContinueBtn: $('copyContinueBtn'),

    codeExtractModal: $('codeExtractModal'),
    closeCodeModalBtn: $('closeCodeModalBtn'),
    codeFilterInput: $('codeFilterInput'),
    modalExpandAllBtn: $('modalExpandAllBtn'),
    modalCollapseAllBtn: $('modalCollapseAllBtn'),
    modalCopyAllCodeBtn: $('modalCopyAllCodeBtn'),
    codeExtractBody: $('codeExtractBody'),

    codeFocusModal: $('codeFocusModal'),
    closeFocusModalBtn: $('closeFocusModalBtn'),
    focusLangDot: $('focusLangDot'),
    codeFocusTitle: $('codeFocusTitle'),
    focusMetaBadge: $('focusMetaBadge'),
    focusPreviewSwitch: $('focusPreviewSwitch'),
    focusFontDecBtn: $('focusFontDecBtn'),
    focusFontIncBtn: $('focusFontIncBtn'),
    focusWrapBtn: $('focusWrapBtn'),
    focusDownloadBtn: $('focusDownloadBtn'),
    focusCopyBtn: $('focusCopyBtn'),
    focusStage: $('focusStage'),
    focusCodePane: $('focusCodePane'),
    focusLivePane: $('focusLivePane'),
    focusLiveIframe: $('focusLiveIframe'),
    refreshLiveBtn: $('refreshLiveBtn'),

    shortcutsModal: $('shortcutsModal'),
    closeShortcutsBtn: $('closeShortcutsBtn'),
    commandSearchInput: $('commandSearchInput'),
    commandList: $('commandList'),

    toastContainer: $('toastContainer')
  };

  /* =========================================================
     TOAST & CLIPBOARD HELPERS
     ========================================================= */
  function showToast(message, type = 'info') {
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.textContent = message;
    el.toastContainer.appendChild(div);
    setTimeout(() => {
      div.style.opacity = '0';
      div.style.transform = 'translateY(8px)';
      div.style.transition = 'opacity 0.2s, transform 0.2s';
      setTimeout(() => div.remove(), 220);
    }, 2600);
  }

  async function copyToClipboard(text, successMsg) {
    if (!text) {
      showToast('Tidak ada teks untuk disalin.', 'warning');
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMsg || 'Berhasil disalin ke clipboard!', 'success');
      return true;
    } catch (_) {
      // Fallback for file:// or restricted contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast(successMsg || 'Berhasil disalin ke clipboard!', 'success');
        return true;
      } catch (err) {
        showToast('Gagal menyalin otomatis. Salin manual dari panel.', 'warning');
        return false;
      } finally {
        ta.remove();
      }
    }
  }

  async function copyRichHtmlToClipboard() {
    const html = el.previewOutput.innerHTML;
    const plain = Parser.stripMarkdownToPlain(state.lastResult.fixed);
    if (!plain) return showToast('Tidak ada hasil untuk disalin.', 'warning');
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobPlain = new Blob([plain], { type: 'text/plain' });
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobPlain })]);
        showToast('Rich Text disalin! Siap paste ke Google Docs / Word / Notion.', 'success');
        return;
      }
    } catch (_) {}
    copyToClipboard(plain, 'Disalin sebagai Plain Text (browser membatasi Rich Copy).');
  }

  function downloadBlob(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  }

  function getDocTitle() {
    if (state.lastResult.headings.length) return state.lastResult.headings[0].text;
    const firstLine = (state.lastResult.fixed || '').split('\n').find(l => l.trim());
    return firstLine ? firstLine.replace(/[#*`_]/g, '').trim().slice(0, 52) : 'AI Studio Document';
  }

  /* =========================================================
     PERSISTENCE & THEME / LAYOUT SETTINGS
     ========================================================= */
  function saveSettings() {
    saveJSON(STORAGE_KEYS.SETTINGS, {
      activePreset: state.activePreset,
      theme: state.theme,
      fontSize: state.fontSize,
      layout: state.layout,
      splitRatio: state.splitRatio,
      scrollSync: state.scrollSync
    });
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const labels = { dark: 'Dark', book: 'Book', light: 'Light' };
    el.themeLabel.textContent = labels[theme] || 'Dark';
    saveSettings();
  }

  function applyFontSize(px) {
    state.fontSize = Math.max(12, Math.min(22, Number(px) || 14));
    document.documentElement.style.setProperty('--editor-font-size', `${state.fontSize}px`);
    el.fontSizeSlider.value = state.fontSize;
    el.fontSizeLabel.textContent = `${state.fontSize}px`;
    saveSettings();
  }

  function applyLayout(layout) {
    state.layout = layout;
    el.workspace.classList.remove('layout-input', 'layout-output');
    if (layout === 'input') el.workspace.classList.add('layout-input');
    if (layout === 'output') el.workspace.classList.add('layout-output');
    if (layout === 'split') applySplitRatio(state.splitRatio);

    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layout === layout);
    });
    saveSettings();
  }

  function applySplitRatio(pct) {
    const clamped = Math.max(22, Math.min(78, pct));
    state.splitRatio = clamped;
    el.inputPanel.style.flex = `0 0 calc(${clamped}% - 6px)`;
    el.outputPanel.style.flex = `1 1 calc(${100 - clamped}% - 6px)`;
  }

  function applyPreset(presetKey) {
    if (!Parser.PRESETS[presetKey]) return;
    state.activePreset = presetKey;
    state.rules = Object.assign({}, Parser.PRESETS[presetKey]);
    saveJSON(STORAGE_KEYS.RULES, state.rules);
    saveSettings();
    updatePresetButtons();
    renderRulesMenu();
    processInputNow();
    const names = { balanced: 'Auto (Balanced)', coding: 'Strict Coding', book: 'Novel & Fanfiksi', minimal: 'Minimal' };
    showToast(`Preset aktif: ${names[presetKey]}`, 'info');
  }

  function updatePresetButtons() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === state.activePreset);
    });
  }

  /* =========================================================
     UNDO / REDO HISTORY STACK
     ========================================================= */
  function pushUndo(prevValue) {
    if (state.undoStack.length && state.undoStack[state.undoStack.length - 1] === prevValue) return;
    state.undoStack.push(prevValue);
    if (state.undoStack.length > 60) state.undoStack.shift();
    state.redoStack = [];
    updateUndoRedoButtons();
  }

  function setInputValue(newVal, recordUndo = true) {
    if (recordUndo && el.rawInput.value !== newVal) {
      pushUndo(el.rawInput.value);
    }
    el.rawInput.value = newVal;
    updateCursorPos();
    processInputNow();
  }

  function doUndo() {
    if (!state.undoStack.length) return;
    state.redoStack.push(el.rawInput.value);
    el.rawInput.value = state.undoStack.pop();
    updateUndoRedoButtons();
    processInputNow();
  }

  function doRedo() {
    if (!state.redoStack.length) return;
    state.undoStack.push(el.rawInput.value);
    el.rawInput.value = state.redoStack.pop();
    updateUndoRedoButtons();
    processInputNow();
  }

  function updateUndoRedoButtons() {
    el.undoBtn.disabled = state.undoStack.length === 0;
    el.redoBtn.disabled = state.redoStack.length === 0;
  }

  /* =========================================================
     CORE PROCESSING & RENDERING PIPELINE
     ========================================================= */
  function scheduleProcess() {
    clearTimeout(state.renderTimer);
    const delay = el.rawInput.value.length > 35000 ? 260 : 110;
    state.renderTimer = setTimeout(processInputNow, delay);
  }

  function processInputNow() {
    const raw = el.rawInput.value;
    saveDraft(raw);

    const res = Parser.parseAndFix(raw, state.rules);
    state.lastResult = res;
    state.currentDocHash = hashText(res.fixed);
    state.lastDiff = null; // Lazy-computed when diff view is active

    renderDiagnostics(res);
    renderStats(res);
    renderToc(res.headings);
    renderTruncationBanner(res.truncation);

    el.codeCountBadge.textContent = res.codeBlocks.length;
    el.commitFixBtn.disabled = !raw.trim() || raw.trim() === res.fixed.trim();

    // Render Raw Output
    el.rawOutput.value = res.fixed;

    // Render Preview
    const rendered = Renderer.renderMarkdown(res.fixed, {
      mode: 'preview',
      showLineNumbers: state.codeView.showLineNumbers,
      wrapLines: state.codeView.wrapAll,
      collapsedSet: state.codeView.collapsedSet,
      codeBlocksMeta: res.codeBlocks
    });
    el.previewOutput.innerHTML = rendered.html;

    // Render Code-Only View if active
    if (state.outputMode === 'code') {
      renderCodeOnlyView();
    }

    // Render Diff if active
    if (state.outputMode === 'diff') {
      renderDiffView();
    }

    // Re-sync Book Reader if open
    if (state.reader.open) {
      renderBookReaderContent(false);
    }

    // Update Find counts if find bar open
    if (state.find.open) {
      updateFindMatches();
    }
  }

  function saveDraft(val) {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT, val);
    } catch (_) {}
  }

  function renderDiagnostics(res) {
    let html = '<span class="diag-title">Fix Log:</span>';
    if (!res.raw.trim()) {
      html += '<span class="badge">Siap menerima teks</span>';
    } else if (!res.fixDetails.length) {
      html += '<span class="badge active-fix">Bersih &bull; Tanpa kerusakan</span>';
    } else {
      html += res.fixDetails.map(d => `<span class="badge ${d.type}">${Renderer.escapeHtml(d.label)}</span>`).join('');
    }
    el.diagBadges.innerHTML = html;
  }

  function renderStats(res) {
    el.statWords.textContent = res.stats.words.toLocaleString('id-ID');
    el.statChars.textContent = res.stats.chars.toLocaleString('id-ID');
    el.statLines.textContent = res.stats.lines.toLocaleString('id-ID');
    el.statCode.textContent = res.stats.codeBlocksCount;
    el.statRead.textContent = `${res.stats.readMinutes} mnt`;
  }

  function renderToc(headings) {
    if (!headings.length) {
      el.tocBar.innerHTML = '<span style="font-size:12px;color:var(--text-muted)">Tidak ada heading terdeteksi.</span>';
      return;
    }
    el.tocBar.innerHTML = headings.map(h =>
      `<button type="button" class="toc-chip toc-h${h.level}" data-jump-id="${h.id}">${Renderer.escapeHtml(h.text)}</button>`
    ).join('');
  }

  function renderTruncationBanner(trunc) {
    if (trunc && trunc.isTruncated) {
      el.truncationBanner.classList.add('visible');
      el.truncationReason.textContent = trunc.reasons.join(' · ');
    } else {
      el.truncationBanner.classList.remove('visible');
    }
  }

  /* =========================================================
     OUTPUT VIEW SWITCHING (PREVIEW / CODE VIEW / RAW / DIFF)
     ========================================================= */
  function setOutputMode(mode) {
    state.outputMode = mode;

    el.modePreviewBtn.classList.toggle('active', mode === 'preview');
    el.modeCodeBtn.classList.toggle('active', mode === 'code');
    el.modeRawBtn.classList.toggle('active', mode === 'raw');
    el.modeDiffBtn.classList.toggle('active', mode === 'diff');

    el.previewOutput.style.display = mode === 'preview' ? 'block' : 'none';
    el.codeOnlyView.classList.toggle('active', mode === 'code');
    el.rawOutput.style.display = mode === 'raw' ? 'block' : 'none';
    el.diffOutput.style.display = mode === 'diff' ? 'block' : 'none';

    el.diffToolbarBar.classList.toggle('open', mode === 'diff');
    if (mode === 'code') {
      el.codeToolbarBar.classList.add('open');
      renderCodeOnlyView();
    } else {
      el.codeToolbarBar.classList.toggle('open', state.codeBarOpen && mode === 'preview');
    }

    if (mode === 'diff') {
      renderDiffView();
    }
  }

  function renderDiffView() {
    if (!state.lastDiff) {
      state.lastDiff = Parser.computeLineDiff(state.lastResult.raw, state.lastResult.fixed);
    }
    el.diffCounters.innerHTML = `<span class="diff-stat-add">+${state.lastDiff.added} ditambah</span><span class="diff-stat-rem">−${state.lastDiff.removed} dihapus</span>`;
    el.diffOutput.innerHTML = Renderer.renderDiff(state.lastDiff, state.diffOnlyChanges);
  }

  /* =========================================================
     MASTERPIECE IDE CODE-ONLY VIEW & CODE EXPLORER
     ========================================================= */
  function getFilteredCodeBlocks(queryOverride) {
    const blocks = state.lastResult.codeBlocks || [];
    const q = (queryOverride !== undefined ? queryOverride : state.codeView.filterQuery).trim().toLowerCase();
    const langFilter = state.codeView.filterLang;

    return blocks.filter(b => {
      if (langFilter !== 'all' && b.lang !== langFilter) return false;
      if (!q) return true;
      return (
        b.lang.toLowerCase().includes(q) ||
        (b.filename && b.filename.toLowerCase().includes(q)) ||
        b.code.toLowerCase().includes(q)
      );
    });
  }

  function renderCodeOnlyView() {
    const allBlocks = state.lastResult.codeBlocks || [];
    el.codeSidebarCount.textContent = allBlocks.length;

    if (!allBlocks.length) {
      el.codeLangPills.innerHTML = '';
      el.codeFileList.innerHTML = '';
      el.codeStage.innerHTML = `<div class="empty-state"><h3>Tidak ada blok kode</h3><p>Tempel output AI yang memuat blok kode (<code>\`\`\`</code>), atau pilih <strong>Sample &rarr; Full-Stack Coding Dump</strong> untuk mencoba IDE Code View dan Live Preview.</p></div>`;
      return;
    }

    // Build language filter pills
    const langCounts = {};
    allBlocks.forEach(b => { langCounts[b.lang] = (langCounts[b.lang] || 0) + 1; });
    const langs = Object.keys(langCounts);
    if (state.codeView.filterLang !== 'all' && !langCounts[state.codeView.filterLang]) {
      state.codeView.filterLang = 'all';
    }

    let pillsHtml = `<button type="button" class="lang-filter-pill ${state.codeView.filterLang === 'all' ? 'active' : ''}" data-lang-filter="all">Semua (${allBlocks.length})</button>`;
    langs.forEach(l => {
      const meta = Renderer.getLanguageMeta(l);
      pillsHtml += `<button type="button" class="lang-filter-pill ${state.codeView.filterLang === l ? 'active' : ''}" data-lang-filter="${l}">${Renderer.escapeHtml(meta.label)} (${langCounts[l]})</button>`;
    });
    el.codeLangPills.innerHTML = pillsHtml;

    const filtered = getFilteredCodeBlocks();
    if (!filtered.length) {
      el.codeFileList.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--text-muted)">Tidak ada hasil cocok.</div>';
      el.codeStage.innerHTML = '<div class="empty-state"><h3>Filter kosong</h3><p>Ubah kata kunci pencarian atau pilih "Semua" bahasa.</p></div>';
      return;
    }

    // Sidebar file/block navigation list
    el.codeFileList.innerHTML = filtered.map(b => {
      const meta = Renderer.getLanguageMeta(b.lang);
      const title = b.filename || `Block #${b.index + 1} (.${meta.ext})`;
      const active = state.codeView.activeIdx === b.index ? 'active' : '';
      return `
        <button type="button" class="code-file-item ${active}" data-select-code="${b.index}">
          <div class="code-file-top">
            <span class="lang-dot" style="background:${meta.color}"></span>
            <span class="code-file-name">${Renderer.escapeHtml(title)}</span>
          </div>
          <div class="code-file-meta">${Renderer.escapeHtml(meta.label)} &middot; ${b.lines} baris</div>
        </button>`;
    }).join('');

    // Render all filtered cards inside Code Stage
    el.codeStage.innerHTML = filtered.map(b =>
      Renderer.renderCodeCard(b, {
        showLineNumbers: state.codeView.showLineNumbers,
        wrapLines: state.codeView.wrapAll,
        collapsed: state.codeView.collapsedSet.has(b.index),
        showJump: true
      })
    ).join('');
  }

  function renderCodeExplorerModal() {
    const filtered = getFilteredCodeBlocks(el.codeFilterInput.value);
    if (!filtered.length) {
      el.codeExtractBody.innerHTML = '<div class="empty-state"><p>Tidak ada blok kode yang cocok.</p></div>';
      return;
    }
    el.codeExtractBody.innerHTML = filtered.map(b =>
      Renderer.renderCodeCard(b, {
        showLineNumbers: state.codeView.showLineNumbers,
        wrapLines: state.codeView.wrapAll,
        collapsed: state.codeView.collapsedSet.has(b.index),
        showJump: true
      })
    ).join('');
  }

  /* =========================================================
     CODE FOCUS LIGHTBOX & LIVE SANDBOXED HTML/SVG PREVIEW
     ========================================================= */
  function openCodeFocusModal(codeIdx, startInLive = false) {
    const block = state.lastResult.codeBlocks[codeIdx];
    if (!block) return;
    const meta = Renderer.getLanguageMeta(block.lang);

    state.focusModal.codeIdx = codeIdx;
    state.focusModal.wrap = state.codeView.wrapAll;
    state.focusModal.mode = (startInLive && meta.previewable) ? 'split' : 'code';

    el.focusLangDot.style.background = meta.color;
    el.codeFocusTitle.textContent = block.filename || `${meta.label} — Block #${block.index + 1}`;
    el.focusMetaBadge.textContent = `${block.lines} baris`;
    el.focusPreviewSwitch.classList.toggle('hidden', !meta.previewable);
    el.focusWrapBtn.classList.toggle('active-toggle', state.focusModal.wrap);

    renderCodeFocusBody();
    el.codeFocusModal.classList.add('open');
  }

  function renderCodeFocusBody() {
    const block = state.lastResult.codeBlocks[state.focusModal.codeIdx];
    if (!block) return;
    const meta = Renderer.getLanguageMeta(block.lang);
    const mode = meta.previewable ? state.focusModal.mode : 'code';

    el.focusCodePane.style.fontSize = `${state.focusModal.fontSize}px`;
    el.focusCodePane.innerHTML = Renderer.renderCodeCard(block, {
      showLineNumbers: true,
      wrapLines: state.focusModal.wrap,
      inFocusModal: true
    });

    el.focusCodePane.classList.toggle('hidden', mode === 'live');
    el.focusLivePane.classList.toggle('hidden', mode === 'code');

    el.focusPreviewSwitch.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.fmode === mode);
    });

    if (meta.previewable && mode !== 'code') {
      loadLivePreviewIframe(block);
    }
  }

  function loadLivePreviewIframe(block) {
    if (!block) return;
    let docContent = block.code;
    if (block.lang === 'svg' && !/<html/i.test(docContent)) {
      docContent = `<!DOCTYPE html><html><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#f8fafc;">${block.code}</body></html>`;
    }
    el.focusLiveIframe.srcdoc = docContent;
  }

  function downloadSingleCodeBlock(codeIdx) {
    const block = state.lastResult.codeBlocks[codeIdx];
    if (!block) return;
    const meta = Renderer.getLanguageMeta(block.lang);
    const name = block.filename
      ? block.filename.split('/').pop()
      : `snippet-${block.index + 1}.${meta.ext}`;
    downloadBlob(name, block.code, 'text/plain;charset=utf-8');
    showToast(`Mengunduh ${name}`, 'success');
  }

  function copyAllCodeBlocks() {
    const blocks = state.lastResult.codeBlocks || [];
    if (!blocks.length) return showToast('Tidak ada blok kode.', 'warning');
    const joined = blocks.map((b, i) => {
      const header = `// ===== Block #${i + 1}: ${b.filename || b.lang} =====`;
      return `${header}\n${b.code}`;
    }).join('\n\n');
    copyToClipboard(joined, `${blocks.length} blok kode disalin!`);
  }

  function downloadAllCodeBundle() {
    const blocks = state.lastResult.codeBlocks || [];
    if (!blocks.length) return showToast('Tidak ada blok kode untuk diunduh.', 'warning');
    const joined = blocks.map((b, i) => {
      const meta = Renderer.getLanguageMeta(b.lang);
      return `/* ========================================\n   File #${i + 1}: ${b.filename || `snippet-${i + 1}.${meta.ext}`} (${meta.label})\n   ======================================== */\n${b.code}`;
    }).join('\n\n\n');
    downloadBlob('ai-studio-code-bundle.txt', joined, 'text/plain;charset=utf-8');
    showToast('Bundle semua blok kode diunduh!', 'success');
  }

  /* =========================================================
     UNIFIED EVENT DELEGATION FOR CODE CARDS
     ========================================================= */
  function handleCodeCardClick(e) {
    // 1. Clickable Line Number Highlighting (supports Shift-click range!)
    const lnCell = e.target.closest('[data-action="highlight-line"]');
    if (lnCell) {
      const card = lnCell.closest('.code-card');
      const row = lnCell.closest('.code-line-row');
      const lineNum = Number(lnCell.dataset.line);
      if (e.shiftKey && card.dataset.lastLine) {
        const start = Math.min(Number(card.dataset.lastLine), lineNum);
        const end = Math.max(Number(card.dataset.lastLine), lineNum);
        card.querySelectorAll('.code-line-row').forEach(r => {
          const n = Number(r.dataset.line);
          if (n >= start && n <= end) r.classList.add('code-line-active');
        });
      } else {
        row.classList.toggle('code-line-active');
      }
      card.dataset.lastLine = String(lineNum);
      return;
    }

    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx = Number(btn.dataset.codeIdx);
    const card = btn.closest('.code-card');

    if (action === 'copy-code') {
      const block = state.lastResult.codeBlocks[idx];
      if (!block) return;
      copyToClipboard(block.code, `Kode #${idx + 1} (${block.lang}) disalin!`);
      const orig = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = orig; }, 1200);
    } else if (action === 'toggle-collapse') {
      if (state.codeView.collapsedSet.has(idx)) {
        state.codeView.collapsedSet.delete(idx);
        card.classList.remove('collapsed');
      } else {
        state.codeView.collapsedSet.add(idx);
        card.classList.add('collapsed');
      }
    } else if (action === 'toggle-wrap') {
      card.classList.toggle('wrap-lines');
      btn.classList.toggle('active-toggle', card.classList.contains('wrap-lines'));
    } else if (action === 'download-code') {
      downloadSingleCodeBlock(idx);
    } else if (action === 'focus-code') {
      openCodeFocusModal(idx, false);
    } else if (action === 'live-code') {
      openCodeFocusModal(idx, true);
    } else if (action === 'jump-code') {
      el.codeExtractModal.classList.remove('open');
      setOutputMode('preview');
      const target = el.previewOutput.querySelector(`#code-block-${idx}`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('code-card-highlight');
        setTimeout(() => target.classList.remove('code-card-highlight'), 1600);
      }
    }
  }

  /* =========================================================
     RULES MENU & HISTORY SNAPSHOTS
     ========================================================= */
  function renderRulesMenu() {
    let html = `<div class="dropdown-section-title">Preset Cepat</div>
      <div style="display:flex;gap:4px;padding:0 8px 6px;flex-wrap:wrap;">
        <button class="btn btn-xs ${state.activePreset === 'balanced' ? 'btn-primary' : ''}" data-menu-preset="balanced">Auto</button>
        <button class="btn btn-xs ${state.activePreset === 'coding' ? 'btn-primary' : ''}" data-menu-preset="coding">Coding</button>
        <button class="btn btn-xs ${state.activePreset === 'book' ? 'btn-primary' : ''}" data-menu-preset="book">Novel</button>
        <button class="btn btn-xs ${state.activePreset === 'minimal' ? 'btn-primary' : ''}" data-menu-preset="minimal">Minimal</button>
      </div>
      <div class="dropdown-divider"></div>`;

    let lastCat = '';
    Parser.RULE_METADATA.forEach(rule => {
      if (rule.category !== lastCat) {
        html += `<div class="dropdown-section-title">${rule.category}</div>`;
        lastCat = rule.category;
      }
      const checked = state.rules[rule.key] ? 'checked' : '';
      html += `
        <label class="rule-toggle">
          <span class="rule-toggle-text">
            <strong>${rule.label}</strong>
            <small>${rule.desc}</small>
          </span>
          <input type="checkbox" data-rule-key="${rule.key}" ${checked}>
        </label>`;
    });

    el.rulesMenu.innerHTML = html;
  }

  function saveToHistory(force = false) {
    const raw = el.rawInput.value.trim();
    if (!raw || (!force && raw.length < 25)) return;

    const existingIdx = state.history.findIndex(item => item.text === raw);
    if (existingIdx !== -1 && !force) return;

    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: getDocTitle(),
      text: raw,
      words: state.lastResult.stats.words,
      timestamp: Date.now(),
      pinned: false
    };

    if (existingIdx !== -1) {
      entry.pinned = state.history[existingIdx].pinned;
      state.history.splice(existingIdx, 1);
    }

    state.history.unshift(entry);
    // Keep pinned items + up to 30 total
    const pinned = state.history.filter(h => h.pinned);
    const unpinned = state.history.filter(h => !h.pinned).slice(0, Math.max(5, 30 - pinned.length));
    state.history = pinned.concat(unpinned);
    saveJSON(STORAGE_KEYS.HISTORY, state.history);
    renderHistoryMenu();
  }

  function renderHistoryMenu() {
    el.historyCount.textContent = state.history.length;
    let html = `
      <div class="history-header-bar">
        <button class="btn btn-xs btn-primary" style="flex:1" data-hist-action="save-now">+ Simpan Snapshot</button>
        <button class="btn btn-xs btn-danger-ghost" data-hist-action="clear-all">Hapus Semua</button>
      </div>`;

    if (!state.history.length) {
      html += '<div style="padding:14px;text-align:center;font-size:12px;color:var(--text-muted)">Belum ada riwayat tersimpan.</div>';
    } else {
      const sorted = state.history.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.timestamp - a.timestamp);
      html += sorted.map(item => {
        const dt = new Date(item.timestamp);
        const timeStr = dt.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        return `
          <div class="history-item" data-hist-load="${item.id}">
            <div class="history-item-main">
              <div class="history-item-title">${item.pinned ? '📌 ' : ''}${Renderer.escapeHtml(item.title)}</div>
              <div class="history-item-meta">${timeStr} &middot; ${item.words} kata</div>
            </div>
            <div class="history-item-actions">
              <button type="button" class="btn btn-xs" data-hist-pin="${item.id}" title="Pin / Unpin">${item.pinned ? 'Unpin' : 'Pin'}</button>
              <button type="button" class="btn btn-xs btn-danger-ghost" data-hist-del="${item.id}" title="Hapus">&times;</button>
            </div>
          </div>`;
      }).join('');
    }
    el.historyMenu.innerHTML = html;
  }

  /* =========================================================
     FIND & REPLACE (SAFE REGEX ENGINE)
     ========================================================= */
  function buildFindRegex() {
    const query = el.findInput.value;
    if (!query) return null;
    try {
      let pattern = state.find.regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (state.find.wholeWord) pattern = `\\b(?:${pattern})\\b`;
      const flags = state.find.caseSensitive ? 'g' : 'gi';
      const re = new RegExp(pattern, flags);
      el.findInput.classList.remove('input-error');
      return re;
    } catch (_) {
      el.findInput.classList.add('input-error');
      el.findCount.textContent = 'Regex invalid';
      return 'ERROR';
    }
  }

  function updateFindMatches() {
    const re = buildFindRegex();
    state.find.matches = [];
    if (re === 'ERROR') return;
    if (!re) {
      el.findCount.textContent = '0 cocok';
      state.find.currentIndex = -1;
      return;
    }

    const text = el.rawInput.value;
    let m;
    let guard = 0;
    while ((m = re.exec(text)) !== null && guard < 15000) {
      guard++;
      state.find.matches.push({ start: m.index, end: m.index + m[0].length });
      if (m[0].length === 0) re.lastIndex++;
    }

    const total = state.find.matches.length;
    if (total === 0) {
      state.find.currentIndex = -1;
      el.findCount.textContent = '0 cocok';
    } else {
      if (state.find.currentIndex < 0 || state.find.currentIndex >= total) state.find.currentIndex = 0;
      el.findCount.textContent = `${state.find.currentIndex + 1} / ${total}`;
    }
  }

  function jumpToFindMatch(delta) {
    if (!state.find.matches.length) updateFindMatches();
    const total = state.find.matches.length;
    if (!total) return;
    state.find.currentIndex = (state.find.currentIndex + delta + total) % total;
    const match = state.find.matches[state.find.currentIndex];
    el.rawInput.focus();
    el.rawInput.setSelectionRange(match.start, match.end);
    el.findCount.textContent = `${state.find.currentIndex + 1} / ${total}`;
  }

  function replaceOneMatch() {
    if (!state.find.matches.length) updateFindMatches();
    if (!state.find.matches.length) return showToast('Tidak ada teks cocok.', 'warning');

    const idx = Math.max(0, state.find.currentIndex);
    const match = state.find.matches[idx];
    const val = el.rawInput.value;
    const rep = el.replaceInput.value;
    const newVal = val.slice(0, match.start) + rep + val.slice(match.end);
    setInputValue(newVal, true);
    updateFindMatches();
  }

  function replaceAllMatches() {
    const re = buildFindRegex();
    if (!re || re === 'ERROR') return;
    const val = el.rawInput.value;
    const count = state.find.matches.length;
    if (!count) return showToast('Tidak ada teks cocok untuk diganti.', 'warning');
    const newVal = val.replace(re, el.replaceInput.value);
    setInputValue(newVal, true);
    showToast(`${count} kecocokan berhasil diganti!`, 'success');
  }

  /* =========================================================
     MASTERPIECE BOOK & FANFICTION READER CONTROLLER
     ========================================================= */
  function saveReaderSettings() {
    const toSave = Object.assign({}, state.reader);
    delete toSave.open;
    delete toSave.barsHidden;
    saveJSON(STORAGE_KEYS.READER, toSave);
  }

  function openBookReader() {
    if (!state.lastResult.fixed.trim()) {
      showToast('Tempel cerita atau dokumen terlebih dahulu.', 'warning');
      return;
    }
    state.reader.open = true;
    el.readerOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    applyReaderAppearance();
    renderBookReaderContent(true);
    populateTtsVoices();
  }

  function closeBookReader() {
    stopAutoScroll();
    stopTts();
    saveCurrentReadingPosition();
    state.reader.open = false;
    el.readerOverlay.classList.remove('open');
    closeReaderDrawer();
    el.readerSettingsDrawer.classList.remove('open');
    document.body.style.overflow = '';
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function applyReaderAppearance() {
    const r = state.reader;
    el.readerOverlay.setAttribute('data-rtheme', r.theme);
    el.readerOverlay.classList.toggle('bars-hidden', r.barsHidden);

    document.querySelectorAll('.swatch-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.rtheme === r.theme);
    });

    el.readerPage.className = `reader-page width-${r.width}`;
    el.readerArticle.className = [
      'reader-article',
      `font-${r.font}`,
      r.justify ? 'align-justify' : '',
      r.indent ? 'book-indent' : '',
      r.dropCap ? 'drop-cap' : '',
      r.highlightDialogue ? 'highlight-dialogue' : '',
      r.focusMode ? 'focus-reading' : '',
      'md-preview'
    ].filter(Boolean).join(' ');

    el.readerArticle.style.fontSize = `${r.fontSize}px`;
    el.readerArticle.style.lineHeight = r.lineHeight;

    el.readerFontSelect.value = r.font;
    el.readerFontSizeLabel.textContent = `${r.fontSize}px`;
    el.readerLineHeightSelect.value = r.lineHeight;
    el.readerWidthSelect.value = r.width;
    el.readerSceneBreakSelect.value = r.sceneBreak;
    el.readerJustifyBtn.classList.toggle('active', r.justify);
    el.readerIndentBtn.classList.toggle('active', r.indent);
    el.readerDropCapBtn.classList.toggle('active', r.dropCap);
    el.readerDialogueBtn.classList.toggle('active', r.highlightDialogue);
    el.readerFocusModeBtn.classList.toggle('active', r.focusMode);
    el.readerAutoScrollSelect.value = String(r.autoScrollSpeed);
    el.readerTtsRateSelect.value = String(r.ttsRate);
    saveReaderSettings();
  }

  function renderBookReaderContent(restoreScroll) {
    const rendered = Renderer.renderMarkdown(state.lastResult.fixed, {
      mode: 'book',
      showLineNumbers: state.codeView.showLineNumbers,
      wrapLines: state.codeView.wrapAll,
      sceneBreakStyle: state.reader.sceneBreak,
      highlightDialogue: state.reader.highlightDialogue,
      codeBlocksMeta: state.lastResult.codeBlocks
    });

    el.readerArticle.innerHTML = rendered.html;
    el.readerChapterTitle.textContent = getDocTitle();
    renderReaderDrawerLists(rendered.headings);

    if (restoreScroll) {
      const savedRatio = state.readPositions[state.currentDocHash];
      requestAnimationFrame(() => {
        if (savedRatio && savedRatio > 0.02 && savedRatio < 0.99) {
          const maxScroll = el.readerScroll.scrollHeight - el.readerScroll.clientHeight;
          el.readerScroll.scrollTop = Math.round(maxScroll * savedRatio);
          showToast(`Melanjutkan baca dari ${Math.round(savedRatio * 100)}%`, 'info');
        } else {
          el.readerScroll.scrollTop = 0;
        }
        updateReaderProgress();
      });
    } else {
      updateReaderProgress();
    }
  }

  function renderReaderDrawerLists(headings) {
    const list = headings || state.lastResult.headings || [];
    if (!list.length) {
      el.readerChaptersList.innerHTML = '<div style="padding:14px;font-size:12.5px;color:var(--reader-muted)">Tidak ada judul bab (# / ##) pada dokumen ini.</div>';
    } else {
      el.readerChaptersList.innerHTML = list.map((h, i) =>
        `<button type="button" class="reader-chap-item chap-h${h.level}" data-rchap="${h.id}"><span>${Renderer.escapeHtml(h.text)}</span><small>#${i + 1}</small></button>`
      ).join('');
    }

    const docBms = state.bookmarks[state.currentDocHash] || [];
    el.readerBmCount.textContent = docBms.length;
    if (!docBms.length) {
      el.readerBookmarksList.innerHTML = '<div style="padding:14px;font-size:12.5px;color:var(--reader-muted)">Belum ada bookmark. Klik ikon bookmark di bilah atas untuk menandai posisi baca.</div>';
    } else {
      el.readerBookmarksList.innerHTML = docBms.map((bm, i) =>
        `<div class="reader-chap-item" data-rbm-jump="${bm.ratio}">
          <span>${Renderer.escapeHtml(bm.label)} (${Math.round(bm.ratio * 100)}%)</span>
          <button type="button" class="reader-btn btn-xs-r" data-rbm-del="${i}">&times;</button>
        </div>`
      ).join('');
    }
  }

  function addReaderBookmark() {
    const maxScroll = Math.max(1, el.readerScroll.scrollHeight - el.readerScroll.clientHeight);
    const ratio = Math.min(1, Math.max(0, el.readerScroll.scrollTop / maxScroll));
    const docBms = state.bookmarks[state.currentDocHash] || [];
    const label = el.readerChapterTitle.textContent.slice(0, 32) || 'Posisi Baca';
    docBms.unshift({ ratio, label, time: Date.now() });
    state.bookmarks[state.currentDocHash] = docBms.slice(0, 20);
    saveJSON(STORAGE_KEYS.BOOKMARKS, state.bookmarks);
    renderReaderDrawerLists();
    showToast(`Bookmark disimpan di ${Math.round(ratio * 100)}%!`, 'success');
  }

  function updateReaderProgress() {
    const sc = el.readerScroll;
    const maxScroll = Math.max(1, sc.scrollHeight - sc.clientHeight);
    const ratio = Math.min(1, Math.max(0, sc.scrollTop / maxScroll));
    const pct = Math.round(ratio * 100);
    el.readerProgressFill.style.width = `${pct}%`;

    const totalMins = state.lastResult.stats.readMinutes || 1;
    const remMins = Math.max(0, Math.ceil(totalMins * (1 - ratio)));

    // Detect current visible chapter heading
    const headings = Array.from(el.readerArticle.querySelectorAll('h1, h2, h3'));
    let activeChapter = getDocTitle();
    let chapIdx = -1;
    const scRect = sc.getBoundingClientRect();

    for (let i = 0; i < headings.length; i++) {
      const r = headings[i].getBoundingClientRect();
      if (r.top - scRect.top <= 110) {
        activeChapter = headings[i].textContent.trim();
        chapIdx = i;
      }
    }

    el.readerChapterTitle.textContent = activeChapter;
    const chapStat = headings.length ? ` · Bab ${Math.max(1, chapIdx + 1)}/${headings.length}` : '';
    el.readerStatusText.textContent = `${pct}% · ~${remMins} mnt tersisa${chapStat}`;

    // Highlight active chapter in drawer
    el.readerChaptersList.querySelectorAll('.reader-chap-item').forEach((btn, i) => {
      btn.classList.toggle('current', i === chapIdx);
    });
  }

  function saveCurrentReadingPosition() {
    if (!state.currentDocHash) return;
    const sc = el.readerScroll;
    const maxScroll = sc.scrollHeight - sc.clientHeight;
    if (maxScroll <= 0) return;
    state.readPositions[state.currentDocHash] = Number((sc.scrollTop / maxScroll).toFixed(4));
    // Cap stored keys to 50 docs
    const keys = Object.keys(state.readPositions);
    if (keys.length > 50) delete state.readPositions[keys[0]];
    saveJSON(STORAGE_KEYS.POSITIONS, state.readPositions);
  }

  function navigateReaderChapter(delta) {
    const headings = Array.from(el.readerArticle.querySelectorAll('h1, h2, h3'));
    if (!headings.length) {
      showToast('Tidak ada bab/heading di dokumen ini.', 'info');
      return;
    }
    const scTop = el.readerScroll.getBoundingClientRect().top;
    let current = 0;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top - scTop <= 95) current = i;
    }
    const targetIdx = Math.max(0, Math.min(headings.length - 1, current + delta));
    headings[targetIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openReaderDrawer() {
    el.readerDrawer.classList.add('open');
    el.readerDrawerBackdrop.classList.add('open');
  }

  function closeReaderDrawer() {
    el.readerDrawer.classList.remove('open');
    el.readerDrawerBackdrop.classList.remove('open');
  }

  /* Smooth Sub-Pixel Auto-Scroll */
  function startAutoScroll(speed) {
    stopAutoScroll();
    const spd = Number(speed) || 0;
    state.reader.autoScrollSpeed = spd;
    saveReaderSettings();
    if (spd <= 0) return;

    state.autoScrollCarry = 0;
    const step = () => {
      if (!state.reader.open || state.reader.autoScrollSpeed <= 0) return;
      const sc = el.readerScroll;
      if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2) {
        el.readerAutoScrollSelect.value = '0';
        stopAutoScroll();
        showToast('Auto-Scroll selesai di akhir halaman.', 'info');
        return;
      }
      state.autoScrollCarry += state.reader.autoScrollSpeed * 0.45;
      if (state.autoScrollCarry >= 1) {
        const px = Math.floor(state.autoScrollCarry);
        sc.scrollTop += px;
        state.autoScrollCarry -= px;
      }
      state.autoScrollRaf = requestAnimationFrame(step);
    };
    state.autoScrollRaf = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (state.autoScrollRaf) {
      cancelAnimationFrame(state.autoScrollRaf);
      state.autoScrollRaf = null;
    }
  }

  /* =========================================================
     CHUNKED AUDIOBOOK TTS ENGINE (ANTI-CHROME 15s CUTOFF BUG!)
     ========================================================= */
  function populateTtsVoices() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return;

    // Prioritize Indonesian & English voices at top
    const sorted = voices.slice().sort((a, b) => {
      const aPrio = /^(id|en)/i.test(a.lang) ? 0 : 1;
      const bPrio = /^(id|en)/i.test(b.lang) ? 0 : 1;
      return aPrio - bPrio || a.lang.localeCompare(b.lang);
    });

    el.readerTtsVoiceSelect.innerHTML = '<option value="">Default Sistem</option>' +
      sorted.map(v => `<option value="${Renderer.escapeHtml(v.voiceURI)}">${Renderer.escapeHtml(v.name)} (${Renderer.escapeHtml(v.lang)})</option>`).join('');

    if (state.reader.ttsVoiceURI) {
      el.readerTtsVoiceSelect.value = state.reader.ttsVoiceURI;
    }
  }

  function toggleTts() {
    if (!('speechSynthesis' in window)) {
      showToast('Browser ini tidak mendukung Text-to-Speech.', 'warning');
      return;
    }

    if (state.ttsActive && !state.ttsPaused) {
      // Pause cleanly
      state.ttsPaused = true;
      window.speechSynthesis.cancel();
      el.readerTtsBtn.textContent = 'Lanjut';
      el.readerTtsBtn.classList.remove('active');
      return;
    }

    if (state.ttsActive && state.ttsPaused) {
      // Resume from exact current paragraph cleanly
      state.ttsPaused = false;
      el.readerTtsBtn.textContent = 'Jeda';
      el.readerTtsBtn.classList.add('active');
      speakCurrentParagraph();
      return;
    }

    // Fresh start: collect readable text blocks
    const nodes = Array.from(el.readerArticle.querySelectorAll('h1, h2, h3, h4, p, li, blockquote')).filter(n => n.textContent.trim().length > 0);
    if (!nodes.length) {
      showToast('Tidak ada teks cerita untuk dibacakan.', 'warning');
      return;
    }

    // Start from first paragraph visible in viewport!
    const scTop = el.readerScroll.getBoundingClientRect().top;
    let startIndex = 0;
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].getBoundingClientRect().bottom > scTop + 20) {
        startIndex = i;
        break;
      }
    }

    state.ttsNodes = nodes;
    state.ttsIndex = startIndex;
    state.ttsActive = true;
    state.ttsPaused = false;
    el.readerTtsBtn.textContent = 'Jeda';
    el.readerTtsBtn.classList.add('active');
    el.readerTtsStopBtn.classList.remove('hidden');
    speakCurrentParagraph();
  }

  function speakCurrentParagraph() {
    if (!state.ttsActive || state.ttsPaused) return;
    clearTtsHighlight();

    if (state.ttsIndex >= state.ttsNodes.length) {
      stopTts();
      showToast('Pembacaan selesai.', 'success');
      return;
    }

    const node = state.ttsNodes[state.ttsIndex];
    const text = node.textContent.trim();
    if (!text) {
      state.ttsIndex++;
      speakCurrentParagraph();
      return;
    }

    node.classList.add('tts-speaking');
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = Number(state.reader.ttsRate) || 1;

    const voices = window.speechSynthesis.getVoices() || [];
    if (state.reader.ttsVoiceURI) {
      const chosen = voices.find(v => v.voiceURI === state.reader.ttsVoiceURI);
      if (chosen) utter.voice = chosen;
    } else {
      // Auto-pick Indonesian voice if available
      const idVoice = voices.find(v => /^id/i.test(v.lang));
      if (idVoice) utter.voice = idVoice;
    }

    utter.onend = () => {
      if (state.ttsActive && !state.ttsPaused) {
        state.ttsIndex++;
        speakCurrentParagraph();
      }
    };
    utter.onerror = (ev) => {
      if (ev.error !== 'interrupted' && ev.error !== 'canceled') {
        stopTts();
      }
    };

    window.speechSynthesis.speak(utter);
  }

  function clearTtsHighlight() {
    el.readerArticle.querySelectorAll('.tts-speaking').forEach(n => n.classList.remove('tts-speaking'));
  }

  function stopTts() {
    state.ttsActive = false;
    state.ttsPaused = false;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    clearTtsHighlight();
    el.readerTtsBtn.textContent = 'Bacakan';
    el.readerTtsBtn.classList.remove('active');
    el.readerTtsStopBtn.classList.add('hidden');
  }

  /* =========================================================
     COMMAND PALETTE & SHORTCUTS
     ========================================================= */
  const COMMANDS = [
    { name: 'Buka Book & Fanfiction Reader', hint: 'Ctrl+Shift+B', run: () => openBookReader() },
    { name: 'Buka IDE Code View', hint: 'Alt+2', run: () => setOutputMode('code') },
    { name: 'Buka Diff Perbandingan', hint: 'Alt+4', run: () => setOutputMode('diff') },
    { name: 'Copy Fixed Markdown', hint: 'Ctrl+Shift+C', run: () => copyToClipboard(state.lastResult.fixed, 'Fixed Markdown disalin!') },
    { name: 'Copy Rich Text (Google Docs / Word)', hint: 'Rich HTML', run: () => copyRichHtmlToClipboard() },
    { name: 'Smart Append Paste (+ Sambung Part 2)', hint: 'Clipboard', run: () => doAppendPaste() },
    { name: 'Preset: Strict Coding Mode', hint: 'Preset', run: () => applyPreset('coding') },
    { name: 'Preset: Novel & Fanfic Mode', hint: 'Preset', run: () => applyPreset('book') },
    { name: 'Preset: Auto Balanced Mode', hint: 'Preset', run: () => applyPreset('balanced') },
    { name: 'Apply Hasil Perbaikan ke Input', hint: 'Commit', run: () => commitFixToInput() },
    { name: 'Download Standalone Book HTML', hint: '.html', run: () => doExport('html') },
    { name: 'Generate Smart Continuation Prompt', hint: 'AI Studio', run: () => openContinueModal() },
    { name: 'Muat Demo: Mixed Broken AI Output', hint: 'Sample', run: () => loadSample('mixed') },
    { name: 'Muat Demo: Full-Stack Live Coding', hint: 'Sample', run: () => loadSample('coding') },
    { name: 'Muat Demo: Cerita / Fanfiksi', hint: 'Sample', run: () => loadSample('fanfic') },
    { name: 'Ganti Tema Workspace (Dark / Book / Light)', hint: 'Tema', run: () => cycleTheme() }
  ];

  function renderCommandList(filter = '') {
    const q = filter.trim().toLowerCase();
    const list = q ? COMMANDS.filter(c => c.name.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q)) : COMMANDS;
    el.commandList.innerHTML = list.map((cmd, idx) =>
      `<button type="button" class="command-item" data-cmd-idx="${COMMANDS.indexOf(cmd)}"><span>${Renderer.escapeHtml(cmd.name)}</span><small>${Renderer.escapeHtml(cmd.hint)}</small></button>`
    ).join('') || '<div style="padding:10px;font-size:12px;color:var(--text-muted)">Perintah tidak ditemukan.</div>';
  }

  function openShortcutsModal() {
    el.commandSearchInput.value = '';
    renderCommandList('');
    el.shortcutsModal.classList.add('open');
    setTimeout(() => el.commandSearchInput.focus(), 40);
  }

  /* =========================================================
     HELPER ACTIONS (PASTE, APPEND, EXPORTS, CONTINUE, SAMPLE)
     ========================================================= */
  async function doPaste() {
    try {
      const txt = await navigator.clipboard.readText();
      if (!txt) return showToast('Clipboard kosong.', 'warning');
      setInputValue(txt, true);
      saveToHistory(false);
      showToast('Teks ditempel & diperbaiki otomatis!', 'success');
      if (window.innerWidth <= 960) switchMobilePanel('output');
    } catch (_) {
      el.rawInput.focus();
      showToast('Gunakan Ctrl+V / Tempel langsung di kotak Input.', 'info');
    }
  }

  async function doAppendPaste() {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip || !clip.trim()) return showToast('Clipboard kosong.', 'warning');
      const stitched = Parser.smartStitchAppend(el.rawInput.value, clip);
      setInputValue(stitched.text, true);
      saveToHistory(false);
      showToast(stitched.message, 'success');
    } catch (_) {
      showToast('Izin clipboard ditolak browser. Paste manual di bagian akhir teks.', 'warning');
    }
  }

  function commitFixToInput() {
    if (!state.lastResult.fixed) return;
    setInputValue(state.lastResult.fixed, true);
    showToast('Hasil perbaikan diterapkan ke panel Input!', 'success');
  }

  function loadSample(type) {
    closeAllDropdowns();
    const sample = Parser.getSampleText(type);
    if (type === 'fanfic') applyPreset('book');
    else if (type === 'coding') applyPreset('coding');
    else applyPreset('balanced');

    setInputValue(sample, true);
    if (type === 'coding') setOutputMode('code');
    else setOutputMode('preview');

    if (window.innerWidth <= 960) switchMobilePanel('output');
    showToast(`Demo "${type}" dimuat!`, 'success');
  }

  function openContinueModal() {
    if (!state.lastResult.fixed.trim()) {
      showToast('Belum ada teks untuk dibuatkan prompt lanjutan.', 'warning');
      return;
    }
    refreshContinuePrompt();
    el.continueModal.classList.add('open');
  }

  function refreshContinuePrompt() {
    el.continuePromptText.value = Parser.generateContinuationPrompt(
      state.lastResult.fixed,
      state.lastResult.truncation,
      {
        lang: el.continueLangSelect.value,
        style: el.continueStyleSelect.value,
        tailLines: Number(el.continueLinesSelect.value) || 5
      }
    );
  }

  function doExport(type) {
    closeAllDropdowns();
    const fixed = state.lastResult.fixed;
    if (!fixed.trim()) return showToast('Tidak ada konten untuk diekspor.', 'warning');
    const slug = getDocTitle().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ai-output';

    if (type === 'md') {
      downloadBlob(`${slug}.md`, fixed, 'text/markdown;charset=utf-8');
      showToast(`Diunduh: ${slug}.md`, 'success');
    } else if (type === 'txt') {
      downloadBlob(`${slug}.txt`, Parser.stripMarkdownToPlain(fixed), 'text/plain;charset=utf-8');
      showToast(`Diunduh: ${slug}.txt`, 'success');
    } else if (type === 'html') {
      const html = Renderer.buildStandaloneHtml(getDocTitle(), fixed, state.theme === 'dark' ? 'dark' : 'sepia', state.lastResult.codeBlocks);
      downloadBlob(`${slug}.html`, html, 'text/html;charset=utf-8');
      showToast(`Diunduh: ${slug}.html`, 'success');
    } else if (type === 'json') {
      const payload = {
        title: getDocTitle(),
        exportedAt: new Date().toISOString(),
        stats: state.lastResult.stats,
        fixes: state.lastResult.fixes,
        headings: state.lastResult.headings,
        codeBlocks: state.lastResult.codeBlocks.map(({ index, lang, filename, lines, code }) => ({ index, lang, filename, lines, code })),
        fixedMarkdown: fixed
      };
      downloadBlob(`${slug}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
      showToast(`Diunduh: ${slug}.json`, 'success');
    } else if (type === 'richcopy') {
      copyRichHtmlToClipboard();
    } else if (type === 'print') {
      setOutputMode('preview');
      setTimeout(() => window.print(), 120);
    }
  }

  function openInPopoutWindow() {
    if (!state.lastResult.fixed.trim()) return showToast('Belum ada konten untuk dibuka.', 'warning');
    const html = Renderer.buildStandaloneHtml(
      getDocTitle(),
      state.lastResult.fixed,
      state.reader.open ? (state.reader.theme === 'dark' || state.reader.theme === 'amoled' ? 'dark' : 'sepia') : (state.theme === 'dark' ? 'dark' : 'sepia'),
      state.lastResult.codeBlocks
    );
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      showToast('Pop-up diblokir browser. Gunakan Export HTML sebagai alternatif.', 'warning');
    } else {
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    }
  }

  function cycleTheme() {
    const order = ['dark', 'book', 'light'];
    const next = order[(order.indexOf(state.theme) + 1) % order.length];
    applyTheme(next);
  }

  function updateCursorPos() {
    const pos = el.rawInput.selectionStart || 0;
    const before = el.rawInput.value.slice(0, pos);
    const lines = before.split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    const selLen = (el.rawInput.selectionEnd || 0) - pos;
    el.cursorPosLabel.textContent = selLen > 0 ? `Ln ${ln}, Col ${col} (${selLen} dipilih)` : `Ln ${ln}, Col ${col}`;
  }

  /* =========================================================
     MOBILE NAVIGATION & DROPDOWN HELPERS
     ========================================================= */
  function switchMobilePanel(panel) {
    state.mobilePanel = panel;
    const isInput = panel === 'input';
    el.inputPanel.classList.toggle('mobile-hidden', !isInput);
    el.outputPanel.classList.toggle('mobile-hidden', isInput);
    el.mobTabInput.classList.toggle('active', isInput);
    el.mobTabOutput.classList.toggle('active', !isInput);
    el.mobBarInput.classList.toggle('active', isInput);
    el.mobBarOutput.classList.toggle('active', !isInput && state.outputMode !== 'code');
    el.mobBarCode.classList.toggle('active', !isInput && state.outputMode === 'code');
  }

  function closeAllDropdowns(exceptEl) {
    [el.rulesMenu, el.historyMenu, el.exportMenu, el.sampleMenu].forEach(menu => {
      if (menu !== exceptEl) menu.classList.remove('open');
    });
  }

  function toggleDropdown(menu) {
    const willOpen = !menu.classList.contains('open');
    closeAllDropdowns(menu);
    menu.classList.toggle('open', willOpen);
  }

  /* =========================================================
     DRAGGABLE SPLIT-PANE RESIZER
     ========================================================= */
  function initSplitResizer() {
    let dragging = false;
    el.splitResizer.addEventListener('pointerdown', (e) => {
      if (state.layout !== 'split' || window.innerWidth <= 960) return;
      dragging = true;
      el.splitResizer.classList.add('dragging');
      el.splitResizer.setPointerCapture(e.pointerId);
    });

    el.splitResizer.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const rect = el.workspace.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      applySplitRatio(pct);
    });

    const stopDrag = () => {
      if (!dragging) return;
      dragging = false;
      el.splitResizer.classList.remove('dragging');
      saveSettings();
    };
    el.splitResizer.addEventListener('pointerup', stopDrag);
    el.splitResizer.addEventListener('pointercancel', stopDrag);
    el.splitResizer.addEventListener('dblclick', () => {
      applySplitRatio(50);
      saveSettings();
    });
  }

  /* =========================================================
     FILE IMPORT & DRAG-AND-DROP
     ========================================================= */
  function readDroppedOrSelectedFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('File terlalu besar (>5MB).', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      let content = String(reader.result || '');
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      // If user drops a pure code file (not md/txt), wrap cleanly in a labeled code fence!
      const codeExts = ['js','ts','py','html','css','json','sql','xml','yaml','yml','sh','java','cpp','c','rs','go','php'];
      if (codeExts.includes(ext) && !content.includes('```')) {
        const lang = Parser.detectLanguage(content) || ext;
        content = `**${file.name}**\n\`\`\`${lang}\n${content}\n\`\`\``;
      }
      setInputValue(content, true);
      saveToHistory(false);
      showToast(`File "${file.name}" berhasil dimuat!`, 'success');
    };
    reader.readAsText(file);
  }

  /* =========================================================
     WIRE UP ALL EVENTS
     ========================================================= */
  function bindEvents() {
    // Raw Input typing, Tab indent, cursor tracking
    let lastTypingSnapshot = el.rawInput.value;
    let undoTimer = null;

    el.rawInput.addEventListener('input', () => {
      clearTimeout(undoTimer);
      undoTimer = setTimeout(() => {
        if (el.rawInput.value !== lastTypingSnapshot) {
          pushUndo(lastTypingSnapshot);
          lastTypingSnapshot = el.rawInput.value;
        }
      }, 650);
      updateCursorPos();
      scheduleProcess();
    });

    el.rawInput.addEventListener('click', updateCursorPos);
    el.rawInput.addEventListener('keyup', updateCursorPos);

    // Support Tab indentation cleanly inside editor
    el.rawInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const start = el.rawInput.selectionStart;
        const end = el.rawInput.selectionEnd;
        const val = el.rawInput.value;
        el.rawInput.value = val.slice(0, start) + '  ' + val.slice(end);
        el.rawInput.selectionStart = el.rawInput.selectionEnd = start + 2;
        scheduleProcess();
      }
    });

    // Save to history automatically on paste
    el.rawInput.addEventListener('paste', () => {
      setTimeout(() => saveToHistory(false), 450);
    });

    // Drag & Drop onto Input Panel
    ['dragenter', 'dragover'].forEach(ev => {
      el.inputPanel.addEventListener(ev, (e) => {
        e.preventDefault();
        el.inputPanel.classList.add('drag-over');
      });
    });
    ['dragleave', 'drop'].forEach(ev => {
      el.inputPanel.addEventListener(ev, (e) => {
        e.preventDefault();
        el.inputPanel.classList.remove('drag-over');
      });
    });
    el.inputPanel.addEventListener('drop', (e) => {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      readDroppedOrSelectedFile(file);
    });

    // Header Controls
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => applyLayout(btn.dataset.layout));
    });

    el.fontSizeSlider.addEventListener('input', (e) => applyFontSize(e.target.value));
    el.themeToggle.addEventListener('click', cycleTheme);
    el.shortcutsBtn.addEventListener('click', openShortcutsModal);
    el.commitFixBtn.addEventListener('click', commitFixToInput);

    // Dropdown toggles
    el.rulesBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(el.rulesMenu); });
    el.historyBtn.addEventListener('click', (e) => { e.stopPropagation(); renderHistoryMenu(); toggleDropdown(el.historyMenu); });
    el.exportBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(el.exportMenu); });
    el.sampleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(el.sampleMenu); });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-wrap')) closeAllDropdowns();
    });

    // Rules Menu interactions
    el.rulesMenu.addEventListener('change', (e) => {
      const key = e.target.dataset.ruleKey;
      if (!key) return;
      state.rules[key] = e.target.checked;
      state.activePreset = 'custom';
      updatePresetButtons();
      saveJSON(STORAGE_KEYS.RULES, state.rules);
      processInputNow();
    });
    el.rulesMenu.addEventListener('click', (e) => {
      const pBtn = e.target.closest('[data-menu-preset]');
      if (pBtn) applyPreset(pBtn.dataset.menuPreset);
    });

    // History Menu interactions
    el.historyMenu.addEventListener('click', (e) => {
      const act = e.target.closest('[data-hist-action]');
      if (act) {
        if (act.dataset.histAction === 'save-now') {
          saveToHistory(true);
          showToast('Snapshot disimpan ke History!', 'success');
        } else if (act.dataset.histAction === 'clear-all') {
          state.history = state.history.filter(h => h.pinned);
          saveJSON(STORAGE_KEYS.HISTORY, state.history);
          renderHistoryMenu();
          showToast('Riwayat (non-pin) dibersihkan.', 'info');
        }
        return;
      }

      const pinBtn = e.target.closest('[data-hist-pin]');
      if (pinBtn) {
        e.stopPropagation();
        const item = state.history.find(h => h.id === pinBtn.dataset.histPin);
        if (item) {
          item.pinned = !item.pinned;
          saveJSON(STORAGE_KEYS.HISTORY, state.history);
          renderHistoryMenu();
        }
        return;
      }

      const delBtn = e.target.closest('[data-hist-del]');
      if (delBtn) {
        e.stopPropagation();
        state.history = state.history.filter(h => h.id !== delBtn.dataset.histDel);
        saveJSON(STORAGE_KEYS.HISTORY, state.history);
        renderHistoryMenu();
        return;
      }

      const loadEl = e.target.closest('[data-hist-load]');
      if (loadEl) {
        const item = state.history.find(h => h.id === loadEl.dataset.histLoad);
        if (item) {
          setInputValue(item.text, true);
          closeAllDropdowns();
          showToast(`Memuat: ${item.title}`, 'info');
        }
      }
    });

    // Export Menu
    el.exportMenu.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-export]');
      if (btn) doExport(btn.dataset.export);
    });

    // Sample Menu
    el.sampleMenu.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sample]');
      if (btn) loadSample(btn.dataset.sample);
    });

    // Input Actions
    el.undoBtn.addEventListener('click', doUndo);
    el.redoBtn.addEventListener('click', doRedo);
    el.pasteBtn.addEventListener('click', doPaste);
    el.appendPasteBtn.addEventListener('click', doAppendPaste);
    el.importFileBtn.addEventListener('click', () => el.fileInput.click());
    el.fileInput.addEventListener('change', (e) => {
      readDroppedOrSelectedFile(e.target.files[0]);
      el.fileInput.value = '';
    });
    el.clearBtn.addEventListener('click', () => {
      if (!el.rawInput.value) return;
      saveToHistory(false);
      setInputValue('', true);
      showToast('Input dibersihkan (bisa Undo jika tidak sengaja).', 'info');
    });

    // Find & Replace
    el.findToggleBtn.addEventListener('click', () => {
      state.find.open = !state.find.open;
      el.findBar.classList.toggle('open', state.find.open);
      if (state.find.open) {
        el.findInput.focus();
        updateFindMatches();
      }
    });
    el.closeFindBtn.addEventListener('click', () => {
      state.find.open = false;
      el.findBar.classList.remove('open');
    });
    el.findInput.addEventListener('input', updateFindMatches);
    el.findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        jumpToFindMatch(e.shiftKey ? -1 : 1);
      }
    });
    el.regexToggle.addEventListener('click', () => {
      state.find.regex = !state.find.regex;
      el.regexToggle.classList.toggle('active', state.find.regex);
      updateFindMatches();
    });
    el.caseToggle.addEventListener('click', () => {
      state.find.caseSensitive = !state.find.caseSensitive;
      el.caseToggle.classList.toggle('active', state.find.caseSensitive);
      updateFindMatches();
    });
    el.wordToggle.addEventListener('click', () => {
      state.find.wholeWord = !state.find.wholeWord;
      el.wordToggle.classList.toggle('active', state.find.wholeWord);
      updateFindMatches();
    });
    el.findPrevBtn.addEventListener('click', () => jumpToFindMatch(-1));
    el.findNextBtn.addEventListener('click', () => jumpToFindMatch(1));
    el.replaceNextBtn.addEventListener('click', replaceOneMatch);
    el.replaceAllBtn.addEventListener('click', replaceAllMatches);

    // Output View Mode Switching
    el.modePreviewBtn.addEventListener('click', () => setOutputMode('preview'));
    el.modeCodeBtn.addEventListener('click', () => setOutputMode('code'));
    el.modeRawBtn.addEventListener('click', () => setOutputMode('raw'));
    el.modeDiffBtn.addEventListener('click', () => setOutputMode('diff'));

    el.tocToggleBtn.addEventListener('click', () => {
      state.tocOpen = !state.tocOpen;
      el.tocBar.classList.toggle('open', state.tocOpen);
      el.tocToggleBtn.classList.toggle('active-toggle', state.tocOpen);
    });

    el.tocBar.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-jump-id]');
      if (!chip) return;
      if (state.outputMode !== 'preview') setOutputMode('preview');
      const target = el.previewOutput.querySelector(`#${CSS.escape(chip.dataset.jumpId)}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    el.codeBarToggleBtn.addEventListener('click', () => {
      state.codeBarOpen = !state.codeBarOpen;
      el.codeBarToggleBtn.classList.toggle('active-toggle', state.codeBarOpen);
      el.codeToolbarBar.classList.toggle('open', state.codeBarOpen || state.outputMode === 'code');
    });

    el.scrollSyncBtn.addEventListener('click', () => {
      state.scrollSync = !state.scrollSync;
      el.scrollSyncBtn.classList.toggle('active-toggle', state.scrollSync);
      saveSettings();
      showToast(`Scroll Sync: ${state.scrollSync ? 'ON' : 'OFF'}`, 'info');
    });

    // Synchronized Scroll between Input & Preview/Raw
    const syncScroll = (src, dst) => {
      if (!state.scrollSync || state.isSyncingScroll) return;
      state.isSyncingScroll = true;
      const ratio = src.scrollTop / Math.max(1, src.scrollHeight - src.clientHeight);
      dst.scrollTop = ratio * (dst.scrollHeight - dst.clientHeight);
      requestAnimationFrame(() => { state.isSyncingScroll = false; });
    };
    el.rawInput.addEventListener('scroll', () => {
      const target = state.outputMode === 'raw' ? el.rawOutput : el.previewOutput;
      syncScroll(el.rawInput, target);
    });
    el.previewOutput.addEventListener('scroll', () => syncScroll(el.previewOutput, el.rawInput));
    el.rawOutput.addEventListener('scroll', () => syncScroll(el.rawOutput, el.rawInput));

    // Output Quick Actions
    el.readerModeBtn.addEventListener('click', openBookReader);
    el.openWindowBtn.addEventListener('click', openInPopoutWindow);
    el.continuePromptBtn.addEventListener('click', openContinueModal);
    el.bannerContinueBtn.addEventListener('click', openContinueModal);
    el.copyResultBtn.addEventListener('click', () => copyToClipboard(state.lastResult.fixed, 'Fixed Markdown disalin!'));
    el.copyPlainBtn.addEventListener('click', () => copyToClipboard(Parser.stripMarkdownToPlain(state.lastResult.fixed), 'Plain Text disalin!'));

    // Code Toolbar Controls
    el.expandAllCodeBtn.addEventListener('click', () => {
      state.codeView.collapsedSet.clear();
      document.querySelectorAll('.code-card').forEach(c => c.classList.remove('collapsed'));
    });
    el.collapseAllCodeBtn.addEventListener('click', () => {
      state.lastResult.codeBlocks.forEach(b => state.codeView.collapsedSet.add(b.index));
      document.querySelectorAll('.code-card').forEach(c => c.classList.add('collapsed'));
    });
    el.toggleLineNumsBtn.addEventListener('click', () => {
      state.codeView.showLineNumbers = !state.codeView.showLineNumbers;
      el.toggleLineNumsBtn.classList.toggle('btn-primary', state.codeView.showLineNumbers);
      document.querySelectorAll('.code-card').forEach(c => c.classList.toggle('hide-line-nums', !state.codeView.showLineNumbers));
    });
    el.toggleWrapAllBtn.addEventListener('click', () => {
      state.codeView.wrapAll = !state.codeView.wrapAll;
      el.toggleWrapAllBtn.classList.toggle('btn-primary', state.codeView.wrapAll);
      document.querySelectorAll('.code-card').forEach(c => c.classList.toggle('wrap-lines', state.codeView.wrapAll));
    });
    el.codeQuickFilter.addEventListener('input', (e) => {
      state.codeView.filterQuery = e.target.value;
      if (state.outputMode !== 'code') setOutputMode('code');
      else renderCodeOnlyView();
    });
    el.copyAllCodeBtn.addEventListener('click', copyAllCodeBlocks);
    el.downloadAllCodeBtn.addEventListener('click', downloadAllCodeBundle);
    el.extractCodeBtn.addEventListener('click', () => {
      el.codeFilterInput.value = '';
      renderCodeExplorerModal();
      el.codeExtractModal.classList.add('open');
    });

    // Code-Only Sidebar Filter & Selection
    el.codeLangPills.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-lang-filter]');
      if (!pill) return;
      state.codeView.filterLang = pill.dataset.langFilter;
      renderCodeOnlyView();
    });
    el.codeFileList.addEventListener('click', (e) => {
      const item = e.target.closest('[data-select-code]');
      if (!item) return;
      const idx = Number(item.dataset.selectCode);
      state.codeView.activeIdx = idx;
      el.codeFileList.querySelectorAll('.code-file-item').forEach(b => b.classList.toggle('active', Number(b.dataset.selectCode) === idx));
      const targetCard = el.codeStage.querySelector(`[data-code-card="${idx}"]`);
      if (targetCard) {
        targetCard.classList.remove('collapsed');
        state.codeView.collapsedSet.delete(idx);
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        targetCard.classList.add('code-card-highlight');
        setTimeout(() => targetCard.classList.remove('code-card-highlight'), 1400);
      }
    });

    // Diff Toolbar
    el.diffModeFullBtn.addEventListener('click', () => {
      state.diffOnlyChanges = false;
      el.diffModeFullBtn.classList.add('active-toggle');
      el.diffModeChangesBtn.classList.remove('active-toggle');
      renderDiffView();
    });
    el.diffModeChangesBtn.addEventListener('click', () => {
      state.diffOnlyChanges = true;
      el.diffModeChangesBtn.classList.add('active-toggle');
      el.diffModeFullBtn.classList.remove('active-toggle');
      renderDiffView();
    });

    // Unified Code Card Delegation across all containers
    [el.previewOutput, el.codeStage, el.codeExtractBody, el.focusCodePane, el.readerArticle].forEach(container => {
      container.addEventListener('click', handleCodeCardClick);
    });

    // Mobile Tabs & Bottom Bar
    el.mobTabInput.addEventListener('click', () => switchMobilePanel('input'));
    el.mobTabOutput.addEventListener('click', () => switchMobilePanel('output'));
    el.mobBarPaste.addEventListener('click', doPaste);
    el.mobBarInput.addEventListener('click', () => switchMobilePanel('input'));
    el.mobBarOutput.addEventListener('click', () => { setOutputMode('preview'); switchMobilePanel('output'); });
    el.mobBarCode.addEventListener('click', () => { setOutputMode('code'); switchMobilePanel('output'); });
    el.mobBarReader.addEventListener('click', openBookReader);
    el.mobBarCopy.addEventListener('click', () => copyToClipboard(state.lastResult.fixed, 'Fixed Markdown disalin!'));

    /* -------- BOOK READER EVENTS -------- */
    el.closeReaderBtn.addEventListener('click', closeBookReader);
    el.readerDrawerToggleBtn.addEventListener('click', openReaderDrawer);
    el.closeReaderDrawerBtn.addEventListener('click', closeReaderDrawer);
    el.readerDrawerBackdrop.addEventListener('click', closeReaderDrawer);
    el.readerBookmarkBtn.addEventListener('click', addReaderBookmark);

    el.readerSettingsToggleBtn.addEventListener('click', () => {
      el.readerSettingsDrawer.classList.toggle('open');
      el.readerSettingsToggleBtn.classList.toggle('active', el.readerSettingsDrawer.classList.contains('open'));
    });

    el.readerHideBarsBtn.addEventListener('click', () => {
      state.reader.barsHidden = true;
      el.readerSettingsDrawer.classList.remove('open');
      applyReaderAppearance();
    });
    el.readerShowBarsBtn.addEventListener('click', () => {
      state.reader.barsHidden = false;
      applyReaderAppearance();
    });

    el.readerFullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        el.readerOverlay.requestFullscreen().catch(() => showToast('Fullscreen tidak didukung di browser ini.', 'info'));
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
    el.readerPopoutBtn.addEventListener('click', openInPopoutWindow);

    // Tap center canvas to toggle Distraction-Free Bars (only when not selecting text or clicking controls)
    el.readerScroll.addEventListener('click', (e) => {
      if (e.target.closest('button, a, .code-card, input, select')) return;
      if (window.getSelection && window.getSelection().toString().length > 0) return;

      // Focus Reading Mode: click paragraph to spotlight it
      if (state.reader.focusMode) {
        const para = e.target.closest('p, blockquote, ul, ol');
        if (para && el.readerArticle.contains(para)) {
          el.readerArticle.querySelectorAll('.focus-active').forEach(p => p.classList.remove('focus-active'));
          para.classList.add('focus-active');
          return;
        }
      }

      // Click/Tap middle zone toggles bars
      const yRatio = e.clientY / window.innerHeight;
      if (yRatio > 0.25 && yRatio < 0.78) {
        state.reader.barsHidden = !state.reader.barsHidden;
        if (state.reader.barsHidden) el.readerSettingsDrawer.classList.remove('open');
        applyReaderAppearance();
      }
    });

    // Reader Theme Swatches & Typography Controls
    document.querySelectorAll('.swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.reader.theme = btn.dataset.rtheme;
        applyReaderAppearance();
      });
    });

    el.readerFontSelect.addEventListener('change', (e) => { state.reader.font = e.target.value; applyReaderAppearance(); });
    el.readerFontDecBtn.addEventListener('click', () => { state.reader.fontSize = Math.max(14, state.reader.fontSize - 1); applyReaderAppearance(); });
    el.readerFontIncBtn.addEventListener('click', () => { state.reader.fontSize = Math.min(30, state.reader.fontSize + 1); applyReaderAppearance(); });
    el.readerLineHeightSelect.addEventListener('change', (e) => { state.reader.lineHeight = e.target.value; applyReaderAppearance(); });
    el.readerWidthSelect.addEventListener('change', (e) => { state.reader.width = e.target.value; applyReaderAppearance(); });
    el.readerSceneBreakSelect.addEventListener('change', (e) => {
      state.reader.sceneBreak = e.target.value;
      saveReaderSettings();
      renderBookReaderContent(false);
    });

    el.readerJustifyBtn.addEventListener('click', () => { state.reader.justify = !state.reader.justify; applyReaderAppearance(); });
    el.readerIndentBtn.addEventListener('click', () => { state.reader.indent = !state.reader.indent; applyReaderAppearance(); });
    el.readerDropCapBtn.addEventListener('click', () => { state.reader.dropCap = !state.reader.dropCap; applyReaderAppearance(); });
    el.readerDialogueBtn.addEventListener('click', () => {
      state.reader.highlightDialogue = !state.reader.highlightDialogue;
      applyReaderAppearance();
      renderBookReaderContent(false);
    });
    el.readerFocusModeBtn.addEventListener('click', () => {
      state.reader.focusMode = !state.reader.focusMode;
      applyReaderAppearance();
      if (state.reader.focusMode) showToast('Focus Mode aktif: ketuk/arahkan ke paragraf untuk menyorotnya.', 'info');
    });

    el.readerAutoScrollSelect.addEventListener('change', (e) => startAutoScroll(e.target.value));
    el.readerTtsVoiceSelect.addEventListener('change', (e) => {
      state.reader.ttsVoiceURI = e.target.value;
      saveReaderSettings();
    });
    el.readerTtsRateSelect.addEventListener('change', (e) => {
      state.reader.ttsRate = Number(e.target.value) || 1;
      saveReaderSettings();
      if (state.ttsActive && !state.ttsPaused) speakCurrentParagraph();
    });

    // Reader Drawer Tabs & Items
    document.querySelectorAll('.reader-drawer-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const isChaps = tab.dataset.rtab === 'chapters';
        document.querySelectorAll('.reader-drawer-tab').forEach(t => t.classList.toggle('active', t === tab));
        el.readerChaptersList.classList.toggle('hidden', !isChaps);
        el.readerBookmarksList.classList.toggle('hidden', isChaps);
      });
    });

    el.readerChaptersList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-rchap]');
      if (!btn) return;
      const target = el.readerArticle.querySelector(`#${CSS.escape(btn.dataset.rchap)}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeReaderDrawer();
    });

    el.readerBookmarksList.addEventListener('click', (e) => {
      const del = e.target.closest('[data-rbm-del]');
      if (del) {
        e.stopPropagation();
        const docBms = state.bookmarks[state.currentDocHash] || [];
        docBms.splice(Number(del.dataset.rbmDel), 1);
        state.bookmarks[state.currentDocHash] = docBms;
        saveJSON(STORAGE_KEYS.BOOKMARKS, state.bookmarks);
        renderReaderDrawerLists();
        return;
      }
      const row = e.target.closest('[data-rbm-jump]');
      if (row) {
        const maxScroll = Math.max(1, el.readerScroll.scrollHeight - el.readerScroll.clientHeight);
        el.readerScroll.scrollTo({ top: Math.round(maxScroll * Number(row.dataset.rbmJump)), behavior: 'smooth' });
        closeReaderDrawer();
      }
    });

    let scrollSaveTimer = null;
    el.readerScroll.addEventListener('scroll', () => {
      updateReaderProgress();
      clearTimeout(scrollSaveTimer);
      scrollSaveTimer = setTimeout(saveCurrentReadingPosition, 400);
    });

    el.readerPrevChapBtn.addEventListener('click', () => navigateReaderChapter(-1));
    el.readerNextChapBtn.addEventListener('click', () => navigateReaderChapter(1));
    el.readerTtsBtn.addEventListener('click', toggleTts);
    el.readerTtsStopBtn.addEventListener('click', stopTts);
    el.readerTopBtn.addEventListener('click', () => el.readerScroll.scrollTo({ top: 0, behavior: 'smooth' }));

    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = populateTtsVoices;
    }

    /* -------- MODAL EVENTS -------- */
    // Continue Prompt Modal
    el.closeModalBtn.addEventListener('click', () => el.continueModal.classList.remove('open'));
    el.continueModal.addEventListener('click', (e) => { if (e.target === el.continueModal) el.continueModal.classList.remove('open'); });
    [el.continueLangSelect, el.continueStyleSelect, el.continueLinesSelect].forEach(sel => sel.addEventListener('change', refreshContinuePrompt));
    el.copyContinueBtn.addEventListener('click', () => copyToClipboard(el.continuePromptText.value, 'Smart Continuation Prompt disalin!'));

    // Code Explorer Modal
    el.closeCodeModalBtn.addEventListener('click', () => el.codeExtractModal.classList.remove('open'));
    el.codeExtractModal.addEventListener('click', (e) => { if (e.target === el.codeExtractModal) el.codeExtractModal.classList.remove('open'); });
    el.codeFilterInput.addEventListener('input', renderCodeExplorerModal);
    el.modalExpandAllBtn.addEventListener('click', () => {
      state.codeView.collapsedSet.clear();
      el.codeExtractBody.querySelectorAll('.code-card').forEach(c => c.classList.remove('collapsed'));
    });
    el.modalCollapseAllBtn.addEventListener('click', () => {
      state.lastResult.codeBlocks.forEach(b => state.codeView.collapsedSet.add(b.index));
      el.codeExtractBody.querySelectorAll('.code-card').forEach(c => c.classList.add('collapsed'));
    });
    el.modalCopyAllCodeBtn.addEventListener('click', copyAllCodeBlocks);

    // Code Focus & Live Preview Modal
    const closeFocusModal = () => {
      el.codeFocusModal.classList.remove('open');
      el.focusLiveIframe.srcdoc = '';
    };
    el.closeFocusModalBtn.addEventListener('click', closeFocusModal);
    el.codeFocusModal.addEventListener('click', (e) => { if (e.target === el.codeFocusModal) closeFocusModal(); });
    el.focusPreviewSwitch.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fmode]');
      if (!btn) return;
      state.focusModal.mode = btn.dataset.fmode;
      renderCodeFocusBody();
    });
    el.focusFontDecBtn.addEventListener('click', () => {
      state.focusModal.fontSize = Math.max(11, state.focusModal.fontSize - 1);
      el.focusCodePane.style.fontSize = `${state.focusModal.fontSize}px`;
    });
    el.focusFontIncBtn.addEventListener('click', () => {
      state.focusModal.fontSize = Math.min(24, state.focusModal.fontSize + 1);
      el.focusCodePane.style.fontSize = `${state.focusModal.fontSize}px`;
    });
    el.focusWrapBtn.addEventListener('click', () => {
      state.focusModal.wrap = !state.focusModal.wrap;
      el.focusWrapBtn.classList.toggle('active-toggle', state.focusModal.wrap);
      const card = el.focusCodePane.querySelector('.code-card');
      if (card) card.classList.toggle('wrap-lines', state.focusModal.wrap);
    });
    el.focusDownloadBtn.addEventListener('click', () => downloadSingleCodeBlock(state.focusModal.codeIdx));
    el.focusCopyBtn.addEventListener('click', () => {
      const b = state.lastResult.codeBlocks[state.focusModal.codeIdx];
      if (b) copyToClipboard(b.code, 'Kode disalin dari Focus Viewer!');
    });
    el.refreshLiveBtn.addEventListener('click', () => {
      loadLivePreviewIframe(state.lastResult.codeBlocks[state.focusModal.codeIdx]);
    });

    // Shortcuts & Command Palette Modal
    el.closeShortcutsBtn.addEventListener('click', () => el.shortcutsModal.classList.remove('open'));
    el.shortcutsModal.addEventListener('click', (e) => { if (e.target === el.shortcutsModal) el.shortcutsModal.classList.remove('open'); });
    el.commandSearchInput.addEventListener('input', (e) => renderCommandList(e.target.value));
    el.commandSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = el.commandList.querySelector('.command-item');
        if (first) first.click();
      }
    });
    el.commandList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cmd-idx]');
      if (!btn) return;
      el.shortcutsModal.classList.remove('open');
      const cmd = COMMANDS[Number(btn.dataset.cmdIdx)];
      if (cmd) cmd.run();
    });

    /* -------- GLOBAL KEYBOARD SHORTCUTS -------- */
    document.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === 'Escape') {
        if (el.codeFocusModal.classList.contains('open')) { closeFocusModal(); return; }
        if (el.shortcutsModal.classList.contains('open')) { el.shortcutsModal.classList.remove('open'); return; }
        if (el.continueModal.classList.contains('open')) { el.continueModal.classList.remove('open'); return; }
        if (el.codeExtractModal.classList.contains('open')) { el.codeExtractModal.classList.remove('open'); return; }
        if (el.readerDrawer.classList.contains('open')) { closeReaderDrawer(); return; }
        if (state.reader.open) { closeBookReader(); return; }
        closeAllDropdowns();
        return;
      }

      // Reader-specific keyboard shortcuts
      if (state.reader.open && !e.target.matches('input, select, textarea')) {
        if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          state.reader.barsHidden = !state.reader.barsHidden;
          applyReaderAppearance();
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          el.readerFullscreenBtn.click();
        } else if (e.key === '[') {
          e.preventDefault();
          navigateReaderChapter(-1);
        } else if (e.key === ']') {
          e.preventDefault();
          navigateReaderChapter(1);
        }
        return;
      }

      if (ctrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openShortcutsModal();
      } else if (ctrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        state.find.open = true;
        el.findBar.classList.add('open');
        el.findInput.focus();
        el.findInput.select();
        updateFindMatches();
      } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyToClipboard(state.lastResult.fixed, 'Fixed Markdown disalin!');
      } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        openBookReader();
      } else if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const modes = ['preview', 'code', 'raw', 'diff'];
        setOutputMode(modes[Number(e.key) - 1]);
      }
    });
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */
  function init() {
    applyTheme(state.theme);
    applyFontSize(state.fontSize);
    applyLayout(state.layout);
    updatePresetButtons();
    renderRulesMenu();
    renderHistoryMenu();
    el.scrollSyncBtn.classList.toggle('active-toggle', state.scrollSync);
    initSplitResizer();
    bindEvents();

    // Restore last draft safely
    let draft = '';
    try { draft = localStorage.getItem(STORAGE_KEYS.DRAFT) || ''; } catch (_) {}
    if (draft) {
      el.rawInput.value = draft;
    }

    updateCursorPos();
    processInputNow();
  }

  init();
})();