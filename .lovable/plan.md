# Tahap 2 — Admin CRUD: Bank Soal & Event Tryout

Membangun panel admin untuk mengisi konten Tryout SNBT: kelola bank soal (dengan LaTeX & gambar) dan kelola event tryout (dengan picker soal per mapel).

## Database
1 migration baru:
- Buat bucket `question-images` (public read).
- RLS policies di `storage.objects`:
  - SELECT publik untuk bucket `question-images`.
  - INSERT/UPDATE/DELETE hanya untuk admin/super_admin via `has_user_role(auth.uid(), ARRAY['admin','super_admin'])`.

## Helper baru
`src/lib/tryout-admin-queries.ts`:
- CRUD `questions`, `tryout_events`, `tryout_event_questions`.
- `uploadQuestionImage(file, kind)` → upload ke `question-images`.
- `fetchEventsUsingQuestion(questionId)` → cek referensi sebelum hapus.
- `fetchQuestionsPaged({ subjectId?, difficulty?, search?, page, pageSize: 20 })` pakai `.range()` + `count: 'exact'`.
- `reorderEventQuestion(eventQuestionId, direction)`.

## Routes baru (TanStack file-based, dot-separated)
1. `src/routes/admin.questions.index.tsx` — tabel + filter mapel/kesulitan/search + pagination via `validateSearch` (zod adapter + `fallback`/`stripSearchParams`). URL: `?page=1&subject=<uuid>&difficulty=easy|medium|hard&search=<text>`.
2. `src/routes/admin.questions.new.tsx` — form tambah soal.
3. `src/routes/admin.questions.$id.edit.tsx` — form edit (reuse `QuestionForm`).
4. `src/routes/admin.tryouts.index.tsx` — tabel event + tombol publish/unpublish/hapus.
5. `src/routes/admin.tryouts.new.tsx` — form buat event.
6. `src/routes/admin.tryouts.$id.edit.tsx` — form edit event + `EventQuestionPicker`.

## Komponen baru di `src/components/admin/`
- `QuestionForm.tsx` — dropdown mapel, radio kesulitan, textarea soal + LaTeX preview, upload gambar soal, 5 input opsi A–E, radio jawaban benar, textarea pembahasan + LaTeX preview, upload gambar pembahasan. Tombol "Simpan" dan "Simpan & Tambah Lagi" (clear form, stay).
- `LatexPreview.tsx` — debounce 500ms, render via `LatexText` yang sudah ada di `src/lib/latex.tsx`.
- `TryoutEventForm.tsx` — input judul/deskripsi/datetime mulai-selesai/status. Validasi `end_date > start_date`.
- `EventQuestionPicker.tsx` — accordion per mapel; per mapel: list soal terpilih (reorder ↑↓ + remove) + tombol "Tambah Soal" → Dialog dengan pencarian soal di bank (terfilter ke mapel itu, multi-select checkbox).

## Update navigasi
`src/routes/admin.tsx` — header dari satu link "Posts" jadi tiga link: **Posts**, **Bank Soal** (`/admin/questions`), **Event Tryout** (`/admin/tryouts`). Pakai komponen Link + ikon Lucide.

## Keamanan & UX
- `created_by` di-set otomatis dari `auth.uid()` saat insert.
- Hapus soal: query `tryout_event_questions` dulu → kalau ada referensi, tampilkan AlertDialog "Soal ini dipakai di event berikut: [list judul]. Lepas dulu sebelum menghapus." Tombol hapus disabled.
- Hapus event: izinkan dengan AlertDialog konfirmasi (FK cascade ke `tryout_event_questions` & `tryout_sessions`).
- Validasi form via react-hook-form + zod, pesan toast Indonesia, konsisten dengan `PostForm`.
- Pagination: `stripSearchParams` untuk default `page=1`.

## Yang TIDAK termasuk
- Bulk import CSV/Excel.
- Edit tabel `subjects` dari UI.
- Statistik analitik per soal.
- Halaman publik baru (sudah selesai di Tahap 1).

## File yang akan dibuat/diubah
**Buat (12)**: 1 migration, `tryout-admin-queries.ts`, 4 komponen admin, 6 route admin.
**Ubah (1)**: `src/routes/admin.tsx` (tambah 2 link nav).
