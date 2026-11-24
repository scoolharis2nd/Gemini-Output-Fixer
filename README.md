# Gemini Output Fixer & Book Reader — Studio Edition

Aplikasi web **100% offline, tanpa dependensi eksternal, dan berbasis vanilla HTML/CSS/JavaScript** untuk memperbaiki output Markdown, kode, tabel, rumus LaTeX, maupun cerita/fanfiksi dari Google AI Studio (atau LLM lainnya) yang terpotong atau berantakan secara real-time, lengkap dengan **Code View** profesional dan **Book View** layar penuh.

## Fitur Utama

### 1. Mesin Auto-Heal Markdown & Perlindungan Format
Dirancang agar format **coding** dan **tulisan/prosa** tidak pernah rusak saat diperbaiki:
- **Perlindungan Code Fence Presisi**: Mendukung ```` ``` ```` maupun `~~~` dengan panjang fleksibel (termasuk *nested fence* seperti ```` ````markdown ```` yang membungkus blok kode di dalamnya), memisahkan fence yang menyatu dengan teks, dan menutup otomatis blok kode yang terpotong tanpa pernah mengubah isi/indentasi kode.
- **Perbaikan Tabel Cerdas**: Menambahkan baris pemisah (`---`), meratakan jumlah kolom, mendukung `\|` (*escaped pipe*) serta pipe di dalam inline code, dan mempertahankan perataan kolom (`:---`, `:---:`, `---:`).
- **Perbaikan Heading & List Aman**: Memperbaiki `#Judul`, `-Item`, dan `1.Item` sambil melindungi angka desimal (`3.14`), versi (`2.0.1`), bilangan negatif (`-5`), warna hex (`#1a2b3c`), dan teks miring (`*italic*`).
- **Perlindungan Inline Formatting**: Menutup tag inline yang timpang (`` ` ``, `**`, `__`, `~~`, `*`) dengan melindungi inline code, rumus math, URL (underscore di URL tidak akan berubah menjadi *italic*), serta nama variabel `snake_case`.
- **Sanitasi & Tipografi**: Menghapus karakter Unicode tak terlihat (`ZWSP`, `BOM`, `SHY`), memperbaiki *mojibake*, membersihkan entitas HTML nyasar (`&amp;`, `&quot;`, `&#39;`), memperbaiki spasi link rusak (`[teks] (url)`), merapikan paragraf dialog cerita, serta opsi *Smart Typography* (`“ ”`, `—`, `…`).
- **3 Preset Aturan Cepat**: `Default`, `Coding`, dan `Novel/Book`, ditambah 10 sakelar aturan individual.
- **LCS Line Diff Nyata**: Menampilkan perbandingan baris sebelum & sesudah menggunakan algoritma *Longest Common Subsequence* lengkap dengan nomor baris, ringkasan `+tambah / -hapus`, dan filter **Changes Only**.

### 2. Code View & Code Explorer
- **Syntax Highlighter Sadar-Bahasa (Single-Pass)**: Mendukung JavaScript/TypeScript, Python, HTML/XML/SVG, CSS, JSON, SQL, Bash/Shell, Java, C/C++, Go, Rust, dan PHP tanpa merusak entitas HTML atau warna hex CSS.
- **Toolbar Code View Lengkap**: Expand All / Collapse All, toggle Line Numbers, Word Wrap global, ukuran font kode independen (`A-` / `A+`), **5 Tema Syntax** (`Auto`, `GitHub Dark`, `Dracula`, `Monokai`, `Nord`), serta **Filter Bahasa** otomatis.
- **Kartu Kode Interaktif**:
  - **Sorot Baris (Line Highlight)**: Klik nomor baris untuk menandai baris penting (`Shift + Klik` untuk rentang baris).
  - **Quick Find di Dalam Kartu**: Cari & sorot kata kunci langsung di dalam blok kode panjang.
  - **Live Sandboxed Preview**: Render langsung blok kode `html` atau `svg` di jendela pratinjau aman (`iframe sandbox`).
  - **Format & Validasi JSON**: Rapikan dan validasi blok `json` dengan satu klik.
  - **Code Focus Fullscreen**: Perluas satu blok kode ke modal layar penuh.
  - **Copy & Save Snippet**: Salin atau unduh potongan kode dengan ekstensi file otomatis (`.js`, `.py`, `.html`, `.json`, dll.), atau unduh seluruh blok kode sekaligus.
- **Code Explorer & Code Diff**: Jelajahi semua blok kode, lompat langsung ke posisi blok di Preview, atau bandingkan dua blok kode berdampingan dengan **Compare Diff**.

### 3. Book View (Full-Screen Book & Fanfiction Reader)
- **5 Tema Baca**: Kertas Buku (*Sepia*), Putih Hangat (*Cream*), Hijau Lembut (*Sage*), Malam (*Midnight*), dan *AMOLED* Hitam Pekat.
- **Tipografi Kaya**: 5 pilihan font (*Serif Novel*, *Classic Book*, *Modern Sans*, *Dyslexia Friendly*, *Monospace*), ukuran font (`13px–28px`), spasi baris (`1.5–2.3`), 4 lebar halaman, *Justify*, *Book Indent*, *Drop Cap*, serta slider **Redup (Eye-Care Dimmer)**.
- **Bionic Reading & Reading Ruler**: Mode *Bionic Reading* menebalkan awal kata secara aman (melewati kode & rumus), dan *Reading Ruler* menampilkan garis fokus baca yang mengikuti kursor.
- **Sidebar Daftar Isi & Bookmark**: Navigasi bab otomatis yang tersinkronisasi saat menggulir, plus simpan dan kelola posisi **Bookmark** bacaan.
- **Pembaca Suara (TTS) Per-Paragraf**: Membacakan teks per paragraf dengan sorotan paragraf aktif, gulir otomatis, deteksi bahasa otomatis (`Auto` / `ID` / `EN`), dan pengatur kecepatan (`0.8x–1.8x`).
- **Auto-Scroll & Mode Fokus**: Gulir otomatis dengan jeda cepat via tombol `Space`, serta klik area teks untuk menyembunyikan seluruh toolbar (*distraction-free*).

### 4. Quality of Life (QoL) & Produktivitas
- **Resizable Split Pane & Preset Layout**: Geser pembatas tengah untuk mengatur lebar panel Input/Output (double-click untuk reset 50/50), atau pilih mode fokus `In` / `Split` / `Out`.
- **Sync Scroll**: Sinkronkan posisi gulir antara panel Input dan Output.
- **Find & Replace v2**: Mendukung Regex, Case Sensitive, navigasi kecocokan (`↑` / `↓`), ganti satu per satu, atau ganti semua.
- **Smart Continuation Prompt v2**: Deteksi otomatis teks terpotong dengan generator prompt lanjutan khusus mode `Umum`, `Coding`, atau `Cerita/Fanfiksi`.
- **History v2**: Pencarian riwayat, Pin/Unpin riwayat favorit, hapus per item, dan bersihkan riwayat non-pin.
- **Ekspor Multi-Format**: Unduh `.md`, `.txt`, **Interactive Offline Book `.html`** (lengkap dengan syntax highlighting & tombol ganti tema), `.json`, atau **Print / Save as PDF**.
- **Dukungan Markdown Kaya**: Nested list, task list (`- [x]`), GitHub-style Callouts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!IMPORTANT]`, `> [!CAUTION]`), gambar, dan rumus LaTeX.

## Struktur Proyek

| File / Folder | Fungsi |
| :--- | :--- |
| `index.html` | Struktur antarmuka utama, panel editor/output, Code View, Book View, dan modal |
| `css/style.css` | Desain tema (Dark, Book, Light), 5 tema kode, 5 tema buku, dan tata letak responsif |
| `js/parser.js` | Mesin auto-heal Markdown, proteksi code fence, tabel, inline tag, dan LCS line diff |
| `js/renderer.js` | Renderer Markdown ke HTML, syntax highlighter sadar-bahasa, LaTeX, Bionic Reading, dan kartu kode |
| `js/app.js` | Manajemen state, event listener, Code Explorer, Book Reader, TTS, History, dan Export |
| `LICENSE` | Lisensi MIT |

## Cara Menjalankan

Karena aplikasi ini **100% client-side dan offline**, Anda tidak perlu menginstal Node.js, bundler, atau dependensi apa pun:

1. Ekstrak folder proyek atau klon repositori ke komputer Anda.
2. Buka file `index.html` langsung di browser modern (Chrome, Edge, Firefox, atau Safari).
3. Mulai paste output dari Google AI Studio, drag & drop file `.md`/`.txt`, atau pilih salah satu contoh dari menu **Sample**.

## Pintasan Keyboard

| Pintasan | Aksi |
| :--- | :--- |
| `Ctrl / Cmd + Shift + C` | Salin Fixed Markdown |
| `Ctrl / Cmd + F` | Buka Find & Replace |
| `Ctrl / Cmd + B` | Buka / Tutup Book View |
| `Ctrl / Cmd + E` | Buka Code Explorer |
| `Ctrl / Cmd + Z / Y` | Undo / Redo editor |
| `←` / `→` | Bab Sebelumnya / Berikutnya (di Book View) |
| `F` / `T` / `B` | Mode Fokus / Daftar Isi / Tambah Bookmark (di Book View) |
| `Space` | Jeda / Lanjutkan Auto-Scroll (di Book View) |
| `?` | Buka panduan pintasan keyboard |
| `Esc` | Tutup modal, dropdown, atau keluar dari Book View |

## Lisensi

Proyek ini dirilis di bawah lisensi **MIT** — lihat file `LICENSE` untuk detail lengkapnya.
