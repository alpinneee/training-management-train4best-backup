# Train4Best - Sistem Registrasi Kursus

Sistem registrasi dan manajemen kursus komprehensif yang dibangun dengan Next.js, TypeScript, dan Prisma ORM.

## Fitur

- Autentikasi pengguna dengan kontrol akses berbasis peran (Admin, Instruktur, Peserta)
- Manajemen kursus dan penjadwalan
- Registrasi peserta dan pelacakan pendaftaran
- Manajemen dan penugasan instruktur
- Pembuatan dan validasi sertifikat
- Proses pembayaran dan verifikasi
- Dashboard interaktif dengan analitik
- Desain responsif untuk semua perangkat

## Teknologi yang Digunakan

- **Frontend**: Next.js, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Autentikasi**: NextAuth.js, JWT
- **UI Components**: Material UI, Radix UI, shadcn/ui
- **Chart & Visualisasi**: Recharts
- **Email**: Nodemailer, Resend
- **Testing**: Jest, React Testing Library

## Memulai

### Prasyarat

- Node.js 18+ 
- npm atau yarn
- Database MySQL

### Instalasi

1. Clone repository:
```bash
git clone <repository-url>
cd traun4bst-new
```

2. Install dependencies:
```bash
npm install
```

3. Siapkan environment variable:
```bash
cp .env.example .env.local
```

4. Konfigurasi koneksi database di `.env.local`:
```
DATABASE_URL="mysql://username:password@localhost:3306/train4best"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

5. Jalankan migrasi database:
```bash
npx prisma migrate dev
```

6. Seed database:
```bash
npx prisma db seed
```

7. Jalankan server development:
```bash
npm run dev
```

## Struktur Proyek

```
src/
├── app/                 # Direktori utama Next.js
│   ├── api/             # API routes
│   ├── (auth)/          # Halaman autentikasi
│   ├── dashboard/       # Dashboard admin
│   ├── participant/     # Halaman peserta
│   ├── instructure/     # Halaman instruktur
│   └── ...              # Halaman lainnya
├── components/          # Komponen React
│   ├── common/          # Komponen bersama
│   ├── forms/           # Komponen form
│   ├── ui/              # Komponen UI
│   └── ...              # Kategori komponen lain
├── lib/                 # Utilitas dan konfigurasi
│   ├── constants/       # Konstanta konfigurasi
│   ├── utils/           # Fungsi helper
│   └── types/           # Definisi tipe TypeScript
├── contexts/            # React contexts
└── providers/           # Auth providers
```

## Fitur Inti

### Autentikasi & Otorisasi
- Sistem multi-peran (Admin, Instruktur, Peserta)
- Login aman dengan NextAuth dan JWT
- Kontrol akses berbasis peran
- Fitur reset password

### Manajemen Kursus
- Pembuatan dan penjadwalan kursus
- Kategori tipe kursus
- Manajemen kelas (lokasi, ruangan, kuota)
- Manajemen materi kursus

### Sistem Peserta
- Registrasi dan pelacakan pendaftaran
- Verifikasi pembayaran
- Penerbitan sertifikat
- Evaluasi performa

### Sistem Instruktur
- Manajemen profil instruktur
- Penugasan kelas
- Evaluasi siswa
- Manajemen sertifikat

### Sistem Sertifikat
- Pembuatan sertifikat otomatis
- Validasi sertifikat
- Pelacakan masa berlaku
- Pembuatan PDF sertifikat

### Sistem Pembayaran
- Dukungan berbagai metode pembayaran
- Verifikasi pembayaran
- Pembuatan bukti pembayaran
- Manajemen rekening bank

## API Endpoint

### Autentikasi
- `POST /api/auth/login` - Login pengguna
- `POST /api/auth/register` - Registrasi pengguna
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/logout` - Logout pengguna

### Kursus
- `GET /api/courses` - Ambil semua kursus
- `POST /api/courses` - Buat kursus baru
- `GET /api/courses/[id]` - Ambil kursus berdasarkan ID
- `PUT /api/courses/[id]` - Update kursus
- `DELETE /api/courses/[id]` - Hapus kursus

### Peserta
- `GET /api/participant` - Ambil semua peserta
- `POST /api/participant` - Tambah peserta
- `GET /api/participant/[id]` - Ambil peserta berdasarkan ID
- `GET /api/participant/dashboard` - Data dashboard peserta

### Instruktur
- `GET /api/instructure` - Ambil semua instruktur
- `POST /api/instructure` - Tambah instruktur
- `GET /api/instructure/[id]` - Ambil instruktur berdasarkan ID
- `GET /api/instructure/my-courses` - Kursus milik instruktur

### Sertifikat
- `GET /api/certificate` - Ambil semua sertifikat
- `POST /api/certificate` - Buat sertifikat
- `GET /api/certificate/[id]` - Ambil sertifikat berdasarkan ID
- `GET /api/certificate-expired` - Ambil sertifikat yang kadaluarsa

## Model Database

Proyek ini menggunakan Prisma ORM dengan model utama:
- User
- UserType
- Course
- CourseType
- Class
- Participant
- Instructure
- Certificate
- Payment
- BankAccount
- CourseMaterial
- Attendance
- ValueReport

## Pengujian

Jalankan pengujian dengan:

```bash
# Jalankan semua pengujian
npm test

# Mode watch
npm run test:watch

# Laporan coverage
npm run test:coverage
```

## Deployment

Untuk deployment production:

```bash
# Build aplikasi
npm run build

# Jalankan server production
npm start
```

## Panduan Penggunaan Resend untuk Kirim Email

1. **Daftar dan dapatkan API Key di [Resend](https://resend.com/)**
2. **Install package Resend:**
   ```bash
   npm install resend
   ```
3. **Tambahkan API Key ke environment variable:**
   ```env
   RESEND_API_KEY=your-resend-api-key
   ```
4. **Contoh penggunaan di kode (misal di file utils/email.js):**
   ```js
   import { Resend } from 'resend';

   const resend = new Resend(process.env.RESEND_API_KEY);

   export async function sendEmail({ to, subject, html }) {
     await resend.emails.send({
       from: 'noreply@yourdomain.com',
       to,
       subject,
       html,
     });
   }
   ```
5. **Panggil fungsi `sendEmail` saat ingin mengirim email (misal pada proses registrasi, reset password, dsb).**

---

## Lisensi

Proyek ini dilisensikan di bawah MIT License.

## Dukungan

Untuk bantuan dan pertanyaan, silakan hubungi tim pengembang.
