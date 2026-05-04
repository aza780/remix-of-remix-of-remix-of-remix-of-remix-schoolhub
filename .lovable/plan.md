## Tujuan

Memisahkan **logic data/backend** dari **UI/frontend** dalam satu project TanStack Start, sehingga:
- Mudah membedakan kode mana yang menyentuh database vs murni tampilan
- Bisa di-maintain terpisah oleh orang berbeda
- Tidak melawan framework (TanStack file-based routing tetap di `src/routes/`)

**Tidak ada perubahan runtime** — hanya restrukturisasi folder + update import path.

---

## Struktur Folder Baru

```text
src/
├── backend/                    ← semua data, query, types domain, auth logic
│   ├── supabase/               ← client (pindahan dari integrations/supabase)
│   │   ├── client.ts
│   │   ├── client.server.ts
│   │   ├── auth-middleware.ts
│   │   └── types.ts            ← auto-generated, JANGAN di-edit
│   ├── queries/                ← semua fungsi query Supabase
│   │   ├── posts.ts            ← dari lib/supabase-queries.ts
│   │   ├── tryout.ts           ← dari lib/tryout-queries.ts
│   │   └── tryout-admin.ts     ← dari lib/tryout-admin-queries.ts
│   ├── types/                  ← types domain
│   │   └── tryout.ts           ← dari lib/tryout-types.ts
│   └── auth/                   ← auth helpers + permissions
│       ├── auth.ts             ← dari lib/auth.ts
│       └── permissions.ts      ← dari lib/permissions.ts
│
├── frontend/                   ← semua UI: components, hooks, utils tampilan
│   ├── components/             ← dari src/components/
│   │   ├── ui/
│   │   ├── admin/
│   │   ├── calendar/
│   │   ├── tryout/
│   │   ├── Navbar.tsx
│   │   ├── PostCard.tsx
│   │   └── ... (semua komponen lain)
│   ├── hooks/                  ← dari src/hooks/
│   │   ├── use-auth.tsx
│   │   ├── useBookmarks.ts
│   │   └── ...
│   └── lib/                    ← utility murni UI (no DB)
│       ├── formatDate.ts
│       ├── getAvatarColor.ts
│       ├── getCategoryConfig.ts
│       ├── getInitials.ts
│       ├── getPostStatus.ts
│       ├── helpers.ts
│       ├── latex.tsx
│       └── utils.ts            ← cn() helper shadcn
│
├── routes/                     ← TETAP DI SINI (wajib untuk TanStack)
│   └── ... (semua route file, jadi "tipis": import dari frontend + backend)
│
├── integrations/               ← DIHAPUS (isinya pindah ke backend/supabase)
├── components/                 ← DIHAPUS (isinya pindah ke frontend/components)
├── hooks/                      ← DIHAPUS (isinya pindah ke frontend/hooks)
├── lib/                        ← DIHAPUS (split antara backend/ dan frontend/lib)
│
├── routeTree.gen.ts            ← auto-generated, JANGAN diutak-atik
├── router.tsx
└── styles.css
```

### Aturan Import Antar Lapisan

```text
routes/        →  bisa import dari backend/  +  frontend/
frontend/      →  bisa import dari frontend/  +  backend/queries  +  backend/types
backend/       →  HANYA import dari backend/  (tidak boleh import frontend)
```

Aturan ini menjaga **backend bersih dari ketergantungan UI** — sehingga di masa depan, kalau perlu di-extract menjadi server functions atau microservice, mudah dilakukan.

---

## Path Aliases Baru di `tsconfig.json`

Selain `@/*` yang sudah ada, tambahkan alias eksplisit agar import lebih jelas niatnya:

```json
"paths": {
  "@/*": ["./src/*"],
  "@backend/*": ["./src/backend/*"],
  "@frontend/*": ["./src/frontend/*"]
}
```

Contoh penggunaan setelah refactor:

```ts
// Sebelum
import { fetchPublishedPosts } from "@/lib/supabase-queries";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/use-auth";

// Sesudah
import { fetchPublishedPosts } from "@backend/queries/posts";
import { Navbar } from "@frontend/components/Navbar";
import { useAuth } from "@frontend/hooks/use-auth";
```

Alias `@/*` lama tetap berfungsi (backward compatible) — tapi konvensi baru pakai `@backend/*` dan `@frontend/*`.

---

## Yang HARUS Tetap di Tempat Asal

1. **`src/routes/`** — TanStack Start menuntut routes berada di sini. File-based routing scanner cuma melihat folder ini.
2. **`src/routeTree.gen.ts`** — auto-generated. JANGAN dipindah/diedit.
3. **`src/router.tsx`** — entry point router, harus di `src/`.
4. **`src/styles.css`** — di-import oleh root route, biarkan di sini.
5. **`src/backend/supabase/client.ts`, `client.server.ts`, `types.ts`** — file-file ini auto-generated/dikelola Lovable Cloud. Akan dipindah lokasinya, **tapi** isinya tidak boleh diubah manual. (Kita verifikasi dulu apakah Lovable regenerate-nya tetap menemukan file di lokasi baru — jika tidak, fallback: biarkan `src/integrations/supabase/` apa adanya dan hanya pindah file-file lain.)

> **Catatan penting**: Saat eksekusi, langkah pertama adalah test apakah aman memindahkan `src/integrations/supabase/`. Kalau auto-generator Lovable Cloud menulis ulang ke path lama, kita ubah strategi: biarkan `src/integrations/supabase/` di tempatnya, dan `src/backend/supabase/` cuma jadi **re-export** tipis (`export * from "@/integrations/supabase/client"`). Hasil akhir untuk developer tetap sama: import via `@backend/supabase/client`.

---

## Rincian Pemindahan File

### Backend (logic + data)
| Dari | Ke |
|---|---|
| `src/integrations/supabase/*` | `src/backend/supabase/*` (atau re-export jika tidak aman dipindah) |
| `src/lib/supabase-queries.ts` | `src/backend/queries/posts.ts` |
| `src/lib/tryout-queries.ts` | `src/backend/queries/tryout.ts` |
| `src/lib/tryout-admin-queries.ts` | `src/backend/queries/tryout-admin.ts` |
| `src/lib/tryout-types.ts` | `src/backend/types/tryout.ts` |
| `src/lib/auth.ts` | `src/backend/auth/auth.ts` |
| `src/lib/permissions.ts` | `src/backend/auth/permissions.ts` |

### Frontend (UI)
| Dari | Ke |
|---|---|
| `src/components/**` | `src/frontend/components/**` (struktur subfolder dipertahankan) |
| `src/hooks/**` | `src/frontend/hooks/**` |
| `src/lib/formatDate.ts` | `src/frontend/lib/formatDate.ts` |
| `src/lib/getAvatarColor.ts` | `src/frontend/lib/getAvatarColor.ts` |
| `src/lib/getCategoryConfig.ts` | `src/frontend/lib/getCategoryConfig.ts` |
| `src/lib/getInitials.ts` | `src/frontend/lib/getInitials.ts` |
| `src/lib/getPostStatus.ts` | `src/frontend/lib/getPostStatus.ts` |
| `src/lib/helpers.ts` | `src/frontend/lib/helpers.ts` |
| `src/lib/latex.tsx` | `src/frontend/lib/latex.tsx` |
| `src/lib/utils.ts` | `src/frontend/lib/utils.ts` (`cn()` helper untuk shadcn) |

> **Special case `utils.ts`**: file `components.json` shadcn me-reference path `@/lib/utils`. Setelah pindah, `components.json` perlu di-update ke `@frontend/lib/utils` agar generator shadcn ke depan tetap konsisten.

---

## File yang Harus Di-update Import-nya

Berdasarkan scan, **31 file** menggunakan import dari `@/lib/*`, `@/components/*`, `@/hooks/*`, atau `@/integrations/supabase/*`. Semuanya akan otomatis di-update ke alias baru:

- Semua file di `src/routes/` (~21 file)
- Semua file di `src/components/` yang saling import
- Semua file di `src/hooks/`
- File queries yang saling import (`tryout-queries.ts` → `tryout-types.ts`, dll)
- `src/router.tsx`

Update dilakukan dengan **find-and-replace terstruktur** per pola import — bukan satu-satu.

---

## Langkah Eksekusi (urutan pasti)

1. **Buat folder baru** `src/backend/` dan `src/frontend/` dengan subfolder kosongnya.
2. **Update `tsconfig.json`** tambahkan alias `@backend/*` dan `@frontend/*`.
3. **Pindahkan file pure UI** dulu (paling aman): `src/components/`, `src/hooks/`, dan utility UI dari `src/lib/` → `src/frontend/`.
4. **Pindahkan file backend logic**: queries, types, auth dari `src/lib/` → `src/backend/`.
5. **Tangani `src/integrations/supabase/`**: coba pindah ke `src/backend/supabase/`. Kalau Lovable Cloud auto-regenerate-nya tetap nulis ke path lama, fallback ke strategi re-export (di-jelaskan di atas).
6. **Update semua import path** di seluruh project (routes, components, hooks, backend internal).
7. **Update `components.json`** shadcn ke alias baru.
8. **Hapus folder lama** yang sudah kosong (`src/components/`, `src/hooks/`, `src/lib/`, `src/integrations/` jika berhasil dipindah).
9. **Verifikasi build** lewat typecheck — pastikan tidak ada import yang nyangkut.

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| File auto-generated Lovable Cloud (`supabase/types.ts`, `client.ts`) di-overwrite ke path lama | Strategi re-export sebagai fallback (lihat penjelasan di atas) |
| `routeTree.gen.ts` rusak | Jangan disentuh, biarkan plugin TanStack regenerate saat dev/build |
| Ada import yang terlewat | TypeScript build akan gagal dengan error eksplisit — mudah dilacak & diperbaiki |
| `components.json` shadcn salah path → next time tambah komponen shadcn jadi error | Update `components.json` di langkah 7 |

---

## Yang TIDAK Berubah

- Behavior aplikasi (UI/UX, query, RLS, auth) — **0 perubahan runtime**
- File di `src/routes/` tetap di sana (cuma import path-nya yang berubah)
- Database, edge functions, Lovable Cloud setup
- `package.json`, `vite.config.ts`, `wrangler.jsonc`

---

Setelah Anda **Approve Plan**, saya eksekusi semua langkah di atas dalam satu kali kerja, lalu verifikasi build clean sebelum selesai.