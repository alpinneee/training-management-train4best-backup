# Sistem Manajemen Pelatihan Train4Best

Sistem manajemen pelatihan komprehensif yang dibangun dengan Next.js, Prisma, dan NextAuth.js.

## Fitur

### Autentikasi & Manajemen Pengguna
- Kontrol akses berbasis peran (Super Admin, Instruktur, Peserta)
- Autentikasi aman menggunakan NextAuth.js
- Registrasi pengguna dengan email dan password
- Manajemen profil dengan dashboard khusus setiap peran

### Administrasi Pengguna (Super Admin)
- Operasi CRUD pengguna lengkap
- Manajemen dan penugasan peran
- Penanganan password aman dengan bcrypt
- Daftar pengguna dengan filter berdasarkan peran

### Manajemen Kursus
- Pembuatan dan penjadwalan kursus
- Manajemen pendaftaran
- Pelacakan kemajuan
- Manajemen sertifikat

## Teknologi yang Digunakan
- Next.js 13+ (App Router)
- Prisma (MySQL)
- NextAuth.js
- TypeScript
- Tailwind CSS
- Framer Motion

## Memulai

1. Clone repository:
```bash
git clone https://github.com/yourusername/train4best--1-management-training.git
```

2. Install dependencies:
```bash
npm install
```

3. Siapkan variabel lingkungan:
```bash
cp .env.example .env
```
Isi konfigurasi database dan NextAuth Anda.

4. Jalankan migrasi database:
```bash
npx prisma migrate dev
```

5. Jalankan server development:
```bash
npm run dev
```

## Peran Pengguna Default

- **Super Admin**: Akses penuh ke sistem
- **Instruktur**: Manajemen kursus dan pelacakan siswa
- **Peserta**: Pendaftaran kursus dan pelacakan kemajuan

## Kontribusi

1. Fork repository
2. Buat branch fitur Anda
3. Commit perubahan Anda
4. Push ke branch
5. Buat Pull Request

## 🚀 Fitur Utama

- **Autentikasi Multi-peran**
  - Super Admin
  - Instruktur
  - Peserta
  - Manajemen akses berbasis peran

- **Manajemen Kursus**
  - Pembuatan dan pengelolaan kursus
  - Penjadwalan kelas
  - Manajemen materi pembelajaran
  - Kategorisasi kursus

- **Manajemen Peserta**
  - Pendaftaran peserta
  - Tracking progress pembelajaran
  - Manajemen sertifikasi
  - Riwayat pelatihan

- **Sistem Sertifikasi**
  - Pembuatan sertifikat
  - Tracking masa berlaku
  - Notifikasi sertifikat yang akan kadaluarsa
  - Verifikasi sertifikat

- **Laporan dan Analitik**
  - Laporan keuangan
  - Statistik peserta
  - Analisis performa kursus
  - Dashboard interaktif

## 🛠️ Teknologi yang Digunakan

- **Frontend**
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - Material-UI
  - React Query

- **Backend**
  - Next.js API Routes
  - Prisma ORM
  - MySQL Database
  - NextAuth.js

## 📋 Prasyarat

Sebelum menginstal, pastikan perangkat Anda memenuhi persyaratan berikut:

- Node.js (versi 18.0.0 atau lebih baru)
- MySQL (versi 8.0 atau lebih baru)
- npm atau yarn
- Git

## 🚀 Panduan Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/username/train4best.git
cd train4best
```

### 2. Instalasi Dependencies

```bash
npm install
# atau
yarn install
```

### 3. Konfigurasi Environment

Buat file `.env` di root proyek dan isi dengan konfigurasi berikut:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/train4best"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email (opsional)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email"
EMAIL_SERVER_PASSWORD="your-password"
EMAIL_FROM="noreply@example.com"
```

## 📚 Panduan Instalasi dan Konfigurasi Database

### 1. Instalasi MySQL

#### Windows
- Unduh MySQL Installer dari [situs resmi MySQL](https://dev.mysql.com/downloads/installer/)
- Pilih "Developer Default" saat instalasi
- Ikuti petunjuk instalasi dan atur password untuk pengguna root
- Pastikan layanan MySQL berjalan

#### macOS
```bash
brew install mysql
brew services start mysql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

### 2. Buat Database

Buka terminal MySQL:

```bash
# Windows
mysql -u root -p

# macOS/Linux
sudo mysql -u root -p
```

Buat database dan pengguna:

```sql
CREATE DATABASE train4best;
CREATE USER 'train4best_user'@'localhost' IDENTIFIED BY 'password_anda';
GRANT ALL PRIVILEGES ON train4best.* TO 'train4best_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Konfigurasi Database di Project

Ubah string koneksi di file `.env`:

```
DATABASE_URL="mysql://train4best_user:password_anda@localhost:3306/train4best"
```

Ganti `password_anda` dengan password yang Anda buat sebelumnya.

### 4. Setup Database dengan Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migrasi database (buat skema tabel)
npx prisma migrate dev --name init
```

### 5. Mengelola Database dengan Prisma Studio

Untuk UI visual database:

```bash
npx prisma studio
```

Akses di browser: http://localhost:5555

### 4. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev

# (Opsional) Seed database dengan data awal
npx prisma db seed
```

### 5. Jalankan Aplikasi

```bash
# Development
npm run dev
# atau
yarn dev

# Production
npm run build
npm start
# atau
yarn build
yarn start
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📱 Akses Aplikasi

- **Super Admin**: `/dashboard`
- **Instruktur**: `/instructor`
- **Peserta**: `/participant`

## 🔧 Troubleshooting

### Masalah Umum

1. **Error Database Connection**
   - Pastikan MySQL server berjalan
   - Periksa kredensial database di `.env`
   - Pastikan database sudah dibuat

2. **Error Prisma**
   ```bash
   npx prisma generate
   npx prisma migrate reset
   ```

3. **Error Next.js**
   ```bash
   rm -rf .next
   npm run dev
   ```

### Troubleshooting Database

1. **Periksa Apakah MySQL Berjalan**:
   ```bash
   # Windows
   net start mysql

   # macOS
   brew services list

   # Linux
   sudo systemctl status mysql
   ```

2. **Reset Prisma Jika Perlu**:
   ```bash
   # Hapus dan regenerate Prisma client
   rm -rf node_modules/.prisma
   npx prisma generate

   # Atau reset database
   npx prisma migrate reset
   ```

3. **Periksa Port MySQL** (default 3306)

4. **Akses Database Langsung untuk Pemeriksaan**:
   ```bash
   mysql -u train4best_user -p
   # Kemudian ketik:
   USE train4best;
   SHOW TABLES;
   ```

## 🤝 Kontribusi

Kami menerima kontribusi! Silakan buat pull request atau buka issue untuk diskusi.

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE)

## 📞 Kontak

Untuk bantuan dan dukungan, silakan hubungi:
- Email: support@train4best.com
- Website: https://train4best.com
