# AI Studio Output Fixer & Book Reader (Pro)

Aplikasi web **100% offline** (Pure HTML, CSS, dan Vanilla JavaScript tanpa dependensi eksternal) untuk memperbaiki secara otomatis output Markdown, kode, rumus matematika, dan cerita/fanfiksi yang rusak atau terpotong dari **Google AI Studio / Gemini** maupun LLM lainnya — lengkap dengan **Code Studio (Live Sandbox + Export `.zip`)** dan **Book Reader** kelas e-reader.

---

## Fitur Unggulan

### 1. Auto-Heal Markdown & AI Output Engine
Semua aturan dapat diaktifkan/dinonaktifkan secara granular di menu **Rules**, dan **tidak pernah merusak isi blok kode**:
- **Auto-Unescape JSON Strings**: Memulihkan teks dengan literal `\n`, `\t`, dan `\"` hasil salinan mentah dari API/JSON.
- **Repair & Auto-Close Code Fences + Auto-Lang**: Menutup ` ``` ` yang terpotong, memisahkan kode yang menempel di baris fence, serta mendeteksi bahasa pemrograman secara otomatis (14+ bahasa).
- **AI Thinking / Reasoning Block Handler**: Mengubah blok `<thought>...</thought>` atau `<thinking>...</thinking>` menjadi panel lipat (`<details>`) yang rapi.
- **Heading, List, Table & Inline Markdown Repair**: Memperbaiki `###Judul`, bullet Unicode (`•`), spasi dalam `** teks **`, bold gantung, serta tabel Markdown yang hilang pipa luar atau jumlah kolomnya timpang.
- **Offline LaTeX Math Renderer**: Mengonversi `\[ ... \]` & `\( ... \)` menjadi rumus terformat (pecahan `\frac`, akar `\sqrt`, huruf Yunani, pangkat/indeks, operator kalkulus).
- **Smart Truncation Detector & Continuation Prompt**: Mendeteksi output yang terpotong di tengah kalimat/kode dan membuatkan prompt penyambung presisi (Indonesia & English).
- **Smart Overlap Stitcher (`Stitch +`)**: Menempelkan lanjutan output (Part 2) dari AI, lalu **otomatis mendeteksi & menghapus baris/kalimat/pembuka fence yang terulang** oleh AI sebelum menyambungkannya.

### 2. Code View & Code Studio
Tersedia langsung di dalam Preview, tab khusus **Code**, maupun modal **Code Explorer**:
- **Single-Pass Syntax Highlighter**: Pewarnaan kode untuk JS/TS, Python, HTML/SVG, CSS, JSON, SQL, Bash, Rust, Go, C/C++/Java/C#, PHP, dan YAML tanpa bug kerusakan tag HTML.
- **Smart Filename Inference**: Otomatis membaca nama file dari heading/komentar di atas blok kode (misalnya `### index.html` atau `// app.js`).
- **Interactive Line Numbers**: Klik nomor baris (atau `Shift+Klik` untuk rentang) guna menyorot baris penting.
- **Live Sandbox Preview**: Jalankan langsung blok **HTML / SVG**, atau gabungkan otomatis blok **HTML + CSS + JS** di dalam `iframe` sandbox aman (`sandbox="allow-scripts"`).
- **JSON Beautifier, Word Wrap, Collapse/Expand & Zen Focus Mode**.
- **Pure-JS `.ZIP` Archive Export**: Unduh seluruh blok kode sekaligus sebagai file `.zip` siap ekstrak 100% offline.

### 3. Book View (Mode Baca Novel & Fanfiksi)
Dirancang untuk membaca cerita panjang dan catatan dengan nyaman:
- **6 Tema Baca**: Sepia, Cream, Parchment, Sage (E-Ink hijau lembut), Dark Slate, dan AMOLED Hitam.
- **Dimmer & Warmth Filter**: Pengaturan kecerahan redup dan filter cahaya biru untuk membaca malam hari.
- **Tipografi E-Reader**: 5 jenis font (termasuk mode *Ramah Fokus / Dyslexic*), Drop Cap, Indentasi Novel, Rata Kanan-Kiri (*Hyphenation*), *Ornamental Scene Breaks* (`✦ ✦ ✦`), dan **Tampilan 2 Kolom** di layar lebar.
- **Sorot Dialog (Dialogue Highlighter)**: Memberi aksen halus pada dialog bertanda kutip agar mudah diikuti.
- **Bionic Reading & Reading Ruler**: Menebalkan awal kata dan menampilkan garis bantu fokus yang mengikuti kursor.
- **Chapter Drawer, Bookmarks & Auto-Resume**: Daftar bab geser, penyimpanan banyak bookmark, serta memori posisi scroll otomatis per dokumen.
- **Smooth Auto-Scroll & Chunked Audiobook (TTS)**: Auto-scroll halus berbasis `requestAnimationFrame` dan fitur *Text-to-Speech* per paragraf (bebas bug putus di Chromium) dengan sorotan paragraf aktif.
- **Tap-to-Hide UI**: Ketuk bagian tengah halaman (atau tekan `H`) untuk masuk ke mode fokus penuh tanpa distraksi.

### 4. Workspace & QoL Lainnya
- **Resizable Split Pane** (tarik garis tengah, klik ganda untuk reset 50:50) + **Focus/Maximize Panel** + **Sync Scroll**.
- **Diff View**: Perbandingan baris sebelum & sesudah perbaikan dengan filter **Hanya Perubahan** dan *Copy Unified Diff*.
- **Find & Replace**: Mendukung Regex, *Case Sensitive*, *Whole Word*, dan navigasi Prev/Next Match.
- **History Snapshot (Pin/Restore)**, **Undo/Redo**, **Drag & Drop File**, **Print / Save as PDF**, serta **Export Interactive Book (`.html`)**.

---

## Pintasan Keyboard

| Area | Pintasan | Fungsi |
| :--- | :--- | :--- |
| **Workspace** | `Ctrl + F` | Buka Find & Replace |
| **Workspace** | `Ctrl + Shift + C` | Salin Markdown hasil perbaikan |
| **Workspace** | `Ctrl + B` | Buka / Tutup Book View |
| **Workspace** | `Ctrl + K` | Buka panduan pintasan |
| **Umum** | `Esc` | Tutup modal, drawer, atau Book View |
| **Book View** | `H` | Sembunyikan / tampilkan menu bar |
| **Book View** | `Space` | Play / Pause Auto-Scroll |
| **Book View** | `[` / `]` | Lompat ke bab sebelumnya / berikutnya |
| **Book View** | `+` / `-` | Perbesar / perkecil ukuran font |
| **Book View** | `B` / `R` / `T` | Toggle Bionic Reading / Reading Ruler / TTS |

---

## Struktur Proyek
