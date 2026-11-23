# AI Studio Output Fixer & Book Reader (Masterpiece Edition)

Aplikasi web **100% offline, zero-dependency, dan menjaga privasi penuh** untuk memperbaiki kerusakan format output dari **Google AI Studio / Gemini** (maupun LLM lain), mengeksplorasi kode layaknya IDE, serta membaca cerita/fanfiksi/artikel panjang layaknya e-reader buku profesional.

Seluruh pemrosesan berjalan murni di browser (HTML, CSS, Vanilla JavaScript) — tanpa server, tanpa build step, dan tanpa data Anda keluar dari perangkat.

---

## Fitur Utama

### 1. Bulletproof Auto-Heal Engine (Code-Safe & Writing-Safe)
Menggunakan arsitektur **Tokenized Isolation Pipeline** (memisahkan *fenced code blocks* berbasis CommonMark *line-by-line state machine*, *inline code*, *LaTeX math*, dan *URL* sebelum aturan prosa dijalankan), sehingga **format coding maupun format penulisan novel tidak akan pernah saling merusak**:
- **Perbaikan Code Fence**: Menutup otomatis blok ```` ``` ```` yang terpotong di akhir respons, memisahkan *fence* yang menempel pada baris kode, mendukung *nested fence* (````` ````markdown ````` berisi ```` ``` ````), serta **Auto-Deteksi Bahasa** (JS, TS, Python, HTML, SVG, CSS, JSON, SQL, Bash, Go, Rust, Java, C++, YAML, dll.).
- **JSON String Unescape Aman**: Mendeteksi & mengubah string `\n` literal dari raw API JSON payload secara otomatis tanpa merusak kode sumber asli.
- **Perbaikan Markdown & Tabel**: Memperbaiki *heading* tanpa spasi (`##Bab 1` -> `## Bab 1`) tanpa menyentuh `#hashtag` atau `#include`, merapikan bold/italic patah (`** teks **`, `****bold****`, `**Label:**Teks`), memperbaiki *bullet* Unicode (`•`), list rapat (`1.Item`), hingga merekonstruksi baris pemisah tabel Markdown (`|---|---|`) yang hilang.
- **Preset Cepat**: Pilih mode **Auto (Balanced)**, **Coding (Strict)**, **Novel (Book/Fanfic)**, atau **Minimal**, atau atur tiap aturan secara individual di menu **Rules**.
- **Deteksi Terpotong + Smart Continuation Prompt + Smart Append (`+ Append`)**:
  - Mendeteksi respons AI yang terhenti di tengah kode, kalimat, atau dialog.
  - Membuatkan prompt lanjutan siap paste (Bahasa Indonesia / Inggris).
  - Tombol **`+ Append`** menyambungkan balasan Part 2 dari clipboard ke Part 1 sambil **otomatis mendeteksi & menghapus baris tumpang-tindih (*overlap deduplication*)**.

### 2. IDE-Grade Code View & Live Sandboxed Preview
- **Tab Khusus `Code View`**: Menampilkan seluruh blok kode dengan *sidebar* daftar file (nama file otomatis terdeteksi dari komentar/label), filter berdasarkan bahasa, dan pencarian cepat.
- **Single-Pass Syntax Highlighter**: Pewarnaan sintaks satu-lintasan (*token-safe*) yang tidak akan pernah mengkorupsi tag HTML/kode.
- **Nomor Baris Interaktif**: Klik nomor baris (atau `Shift + Klik` untuk rentang) untuk menyorot baris penting saat meninjau kode.
- **Code Focus Lightbox & Live HTML/SVG Preview**: Buka blok kode mana pun dalam layar penuh; khusus kode **HTML** atau **SVG**, tersedia mode **Split** & **Live Preview** yang berjalan aman di dalam `<iframe sandbox="allow-scripts">`.
- **Ekspor Kode Cepat**: Unduh satu blok kode sesuai ekstensi aslinya (`.py`, `.js`, `.html`, `.sql`, dll.), *Copy All Code*, atau *Download Bundle*.

### 3. Masterpiece Book & Fanfiction Reader
- **6 Tema Kertas & Malam**: *Sepia*, *Cream*, *Parchment Klasik*, *Sage Eye-Care*, *Dark Navy*, dan *AMOLED*.
- **Tipografi Novel Lengkap**: 5 jenis font (termasuk *Classic Literary* & *High-Legibility / Dyslexia-Friendly*), ukuran font, spasi baris, lebar halaman, *Justify*, *Book Indentation*, *Drop Cap*, pilihan ornamen *Scene Break* (`✦ ✦ ✦`, `* * *`, `— ❦ —`, `❖`).
- **Highlight Dialog & Focus Reading Mode**: Warnai kalimat dialog secara lembut agar nyaman dibaca cepat, atau aktifkan *Focus Mode* untuk meredupkan paragraf yang tidak sedang dibaca.
- **Slide-out Chapter & Bookmark Drawer + Auto-Resume**: Lompat antar bab, simpan banyak bookmark, dan posisi baca terakhir diingat otomatis per dokumen.
- **Distraction-Free & Fullscreen**: Ketuk area tengah layar (atau tekan `H`) untuk menyembunyikan seluruh menu, dan tekan `F` untuk *browser fullscreen*.
- **Smooth Auto-Scroll**: Gulir otomatis super mulus berbasis `requestAnimationFrame` dengan 5 tingkat kecepatan.
- **Audiobook TTS Anti-Terpotong**: Menggunakan *Web Speech API* yang memecah bacaan per paragraf (mengatasi bug Chrome berhenti setelah 15 detik), lengkap dengan *live highlight*, auto-scroll mengikuti suara, pilihan suara sistem, dan kontrol kecepatan (`0.8x` – `1.75x`).

### 4. Workspace Productivity & QoL
- **Resizable Split-Pane** (geser pembatas panel di desktop, *double-click* untuk reset 50/50) + mode *Focus Input / Split / Focus Output*.
- **Synchronized Scroll** opsional antara panel Input dan Output.
- **Diff Viewer** (Mode *Full Diff* & *Hanya Perubahan* dengan statistik `+ditambah / -dihapus`).
- **Find & Replace** mendukung *Regex*, *Case-Sensitive*, *Whole Word*, dan proteksi error regex.
- **Undo / Redo**, **Auto-Save Draft**, serta **History Snapshots** dengan fitur *Pin*.
- **Drag & Drop File** (`.md`, `.txt`, `.json`, `.js`, `.py`, `.html`, dll.).
- **Ekspor Lengkap**: Download `.md`, `.txt`, **Standalone Book `.html`** (lengkap dengan switcher tema & TOC offline), `.json`, **Copy Rich Text** (siap paste ke Google Docs / Word / Notion), dan **Print / Save as PDF**.

---

## Struktur Proyek

```text
Gemini Output Fixer/
├── index.html          # Struktur antarmuka, Code View, Book Reader & Modals
├── css/
│   └── style.css       # Desain responsif, 3 tema workspace, 6 tema Book Reader & print CSS
├── js/
│   ├── parser.js       # Tokenized Auto-Heal Engine, Diff, Smart Stitch & Truncation Detector
│   ├── renderer.js     # XSS-safe Markdown, Single-Pass Syntax Highlighter, Math & HTML Exporter
│   └── app.js          # Controller UI, IDE Code View, Book Reader, TTS & LocalStorage state
├── LICENSE             # Lisensi MIT
└── README.md           # Dokumentasi