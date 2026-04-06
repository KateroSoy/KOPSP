# Spesifikasi Modul Laporan MVP

## 1. Ringkasan Modul Laporan

Modul laporan dirancang untuk membantu admin, petugas, ketua, dan pengawas koperasi memantau kondisi operasional dan keuangan harian tanpa perlu membuka banyak menu terpisah. Fokus MVP adalah laporan yang cepat dipahami, ringan di mobile web, mudah dibuat dengan query relasional biasa, dan langsung berguna untuk pengambilan keputusan operasional.

Karakter utama modul:

- 100% Bahasa Indonesia
- mobile web first
- ringkas di atas, detail di bawah
- angka penting selalu terlihat
- filter sederhana dan familiar
- ekspor cepat ke Excel dan PDF sederhana
- tanpa dashboard BI yang berat
- tanpa grafik kompleks

Ruang lingkup laporan MVP:

- Laporan Ringkasan
- Laporan Anggota
- Laporan Simpanan
- Laporan Pinjaman
- Laporan Angsuran
- Laporan Tunggakan
- Laporan Kas
- Laporan Transaksi Harian
- Laporan Rekap Bulanan
- Laporan Detail Anggota

## 2. Struktur Navigasi Laporan

Rekomendasi navigasi admin:

- `Menu Lainnya`
- `Laporan`
- `Ringkasan`
- `Operasional`
- `Keuangan`
- `Anggota`

Struktur halaman:

- Halaman utama `Laporan` berisi daftar kategori laporan dalam bentuk kartu menu.
- Di mobile, kategori dibagi menjadi 4 grup:
  - `Ringkasan`: Laporan Ringkasan, Rekap Bulanan, Transaksi Harian
  - `Anggota`: Laporan Anggota, Detail Anggota
  - `Pinjaman`: Laporan Pinjaman, Laporan Angsuran, Laporan Tunggakan
  - `Keuangan`: Laporan Simpanan, Laporan Kas
- Di desktop, grup yang sama bisa ditampilkan sebagai sidebar kiri dan konten di kanan.

Struktur masuk yang paling sesuai dengan aplikasi saat ini:

- Tambah item baru `Laporan` pada [AdminMenuScreen.tsx](/D:/digital%20product/SASS/simpan-pinjam/src/screens/AdminMenuScreen.tsx)
- Tambah shortcut `Laporan` pada [AdminDashboardScreen.tsx](/D:/digital%20product/SASS/simpan-pinjam/src/screens/AdminDashboardScreen.tsx)

## 3. Rincian Tiap Halaman Laporan

### 3.1 Laporan Ringkasan

Tujuan laporan:

- memberi gambaran cepat kondisi koperasi saat ini

Pengguna:

- admin
- petugas
- ketua
- pengawas

Data utama:

- total anggota aktif
- total simpanan
- total pinjaman aktif
- total angsuran masuk hari ini
- total tunggakan
- saldo kas
- pinjaman cair bulan ini
- simpanan masuk bulan ini

Metrik ringkas:

- 6 sampai 8 kartu ringkasan
- 1 badge status koperasi seperti `Aman`, `Perlu Perhatian`, `Tunggakan Tinggi`
- 1 blok aktivitas terakhir maksimal 5 transaksi

Filter:

- periode: hari ini, minggu ini, bulan ini, rentang tanggal
- cabang bila nanti ada, tapi untuk MVP bisa disiapkan tanpa diaktifkan

Struktur tampilan:

- bagian atas: kartu ringkasan 2 kolom di mobile
- bagian tengah: daftar indikator prioritas
- bagian bawah: transaksi terbaru dan pengajuan terbaru

Aksi:

- cari laporan
- buka detail laporan terkait
- reset filter
- unduh PDF
- export Excel

Ekspor:

- PDF ringkasan 1 halaman
- Excel ringkasan + rincian transaksi terbaru

Empty state:

- `Belum ada data ringkasan untuk periode ini`

Loading state:

- skeleton kartu ringkasan dan skeleton daftar

Error state:

- `Gagal memuat laporan ringkasan`
- tombol `Coba lagi`

Catatan UX:

- gunakan warna netral untuk angka utama
- gunakan badge kecil untuk kondisi seperti `Tunggakan Naik`
- hindari grafik besar, cukup indikator naik atau turun sederhana

Catatan backend:

- query agregat dari `member_profiles`, `member_savings_balances`, `loans`, `loan_payments`, `transactions`
- cache singkat 30 sampai 60 detik aman untuk halaman ini

### 3.2 Laporan Anggota

Tujuan laporan:

- memantau basis anggota dan aktivitas keuangannya

Pengguna:

- admin
- petugas
- ketua

Data utama:

- daftar anggota
- status aktif atau nonaktif
- tanggal bergabung
- total simpanan per anggota
- pinjaman aktif per anggota
- status tunggakan anggota

Metrik ringkas:

- total anggota
- anggota aktif
- anggota nonaktif
- anggota dengan pinjaman aktif
- anggota menunggak

Filter:

- nama anggota
- nomor anggota
- status anggota
- tanggal bergabung
- status pinjaman: ada atau tidak
- status tunggakan

Struktur tampilan:

- atas: kartu total anggota
- tengah: bar pencarian + tombol filter
- bawah: daftar anggota dalam baris kartu di mobile
- desktop: tabel dengan sticky header

Kolom utama:

- nomor anggota
- nama anggota
- status anggota
- tanggal bergabung
- total simpanan
- pinjaman aktif
- status tunggakan

Aksi:

- cari
- filter
- reset filter
- lihat detail
- export Excel
- print view

Ekspor:

- Excel daftar anggota
- PDF daftar anggota ringkas

Empty state:

- `Belum ada anggota yang sesuai`

Loading state:

- skeleton daftar anggota

Error state:

- `Gagal memuat laporan anggota`

Catatan UX:

- tampilkan badge `Aktif`, `Nonaktif`, `Menunggak`, `Lancar`
- nomor anggota harus mudah disalin atau dicocokkan

Catatan backend:

- join `member_profiles`, `users`, agregat `member_savings_balances`, `loans`
- status tunggakan bisa diturunkan dari `loan.status` dan `nextDueDate`

### 3.3 Laporan Simpanan

Tujuan laporan:

- memantau total dan arus transaksi simpanan

Pengguna:

- admin
- petugas
- ketua
- pengawas

Data utama:

- total simpanan per periode
- transaksi simpanan
- simpanan pokok
- simpanan wajib
- simpanan sukarela
- simpanan per anggota

Metrik ringkas:

- total simpanan periode berjalan
- total simpanan pokok
- total simpanan wajib
- total simpanan sukarela
- jumlah transaksi simpanan

Filter:

- tanggal
- anggota
- jenis simpanan

Struktur tampilan:

- tab sederhana:
  - `Ringkasan`
  - `Transaksi`
  - `Per Anggota`
- tab `Ringkasan`: kartu total
- tab `Transaksi`: daftar transaksi simpanan
- tab `Per Anggota`: daftar total simpanan tiap anggota

Kolom utama transaksi:

- tanggal
- kode transaksi
- nama anggota
- jenis simpanan
- nominal
- status

Aksi:

- cari anggota
- filter
- reset filter
- lihat detail
- export Excel
- unduh PDF

Ekspor:

- Excel transaksi simpanan
- PDF ringkasan simpanan per periode

Empty state:

- `Belum ada transaksi simpanan`

Loading state:

- skeleton kartu dan daftar transaksi

Error state:

- `Gagal memuat laporan simpanan`

Catatan UX:

- tampilkan pemisahan jenis simpanan dengan badge warna berbeda
- total keseluruhan selalu terlihat di atas

Catatan backend:

- ambil dari `transactions` kategori `SAVINGS`
- klasifikasi berdasarkan `type` dan `savingsProductId`

### 3.4 Laporan Pinjaman

Tujuan laporan:

- memantau pinjaman aktif, lunas, dan pencairan pinjaman

Pengguna:

- admin
- petugas
- ketua
- pengawas

Data utama:

- daftar pinjaman aktif
- daftar pinjaman lunas
- pinjaman cair per periode
- nominal pinjaman
- sisa pinjaman
- status pinjaman
- pinjaman per anggota

Metrik ringkas:

- total pinjaman aktif
- total pinjaman lunas
- total pencairan periode ini
- total sisa pinjaman
- jumlah pinjaman menunggak

Filter:

- tanggal cair
- status pinjaman
- anggota

Struktur tampilan:

- segmented switch:
  - `Aktif`
  - `Lunas`
  - `Semua`
- kartu ringkas di atas
- daftar pinjaman di bawah

Kolom utama:

- nomor pinjaman
- nama anggota
- tanggal cair
- nominal pinjaman
- sisa pinjaman
- tenor
- status pinjaman

Aksi:

- cari anggota
- filter
- lihat detail
- export Excel
- print view

Ekspor:

- Excel daftar pinjaman
- PDF pinjaman aktif per periode

Empty state:

- `Belum ada data pinjaman`

Loading state:

- skeleton daftar pinjaman

Error state:

- `Gagal memuat laporan pinjaman`

Catatan UX:

- badge status: `Lancar`, `Menunggak`, `Lunas`
- tampilkan sisa pinjaman dengan ukuran angka lebih menonjol

Catatan backend:

- sumber utama `loans`, join `member_profiles`, `users`, `loan_products`
- tanggal cair bisa gunakan `createdAt`

### 3.5 Laporan Angsuran

Tujuan laporan:

- memantau pembayaran angsuran dan jadwal jatuh tempo

Pengguna:

- admin
- petugas
- supervisor

Data utama:

- daftar pembayaran angsuran
- angsuran masuk per hari
- angsuran masuk per bulan
- riwayat angsuran per pinjaman
- riwayat angsuran per anggota
- angsuran jatuh tempo
- status pembayaran

Metrik ringkas:

- total angsuran hari ini
- total angsuran bulan ini
- jumlah pembayaran berhasil
- jumlah jatuh tempo dekat

Filter:

- tanggal bayar
- anggota
- nomor pinjaman
- status pembayaran

Struktur tampilan:

- tab:
  - `Pembayaran`
  - `Jatuh Tempo`
- tab `Pembayaran`: daftar pembayaran angsuran
- tab `Jatuh Tempo`: daftar pinjaman dengan tanggal jatuh tempo

Kolom utama pembayaran:

- tanggal bayar
- kode pembayaran
- nomor pinjaman
- nama anggota
- nominal bayar
- metode
- status

Aksi:

- cari
- filter
- lihat detail
- export Excel
- unduh PDF

Ekspor:

- Excel riwayat angsuran
- PDF daftar angsuran periode tertentu

Empty state:

- `Belum ada pembayaran angsuran`

Loading state:

- skeleton daftar pembayaran

Error state:

- `Gagal memuat laporan angsuran`

Catatan UX:

- pisahkan informasi `sudah dibayar` dan `jatuh tempo` agar tidak membingungkan
- tampilkan tanggal jatuh tempo berikutnya pada daftar pinjaman

Catatan backend:

- gunakan `loan_payments`, join `loans`, `member_profiles`, `users`
- status pembayaran MVP cukup `Berhasil`, `Jatuh Tempo`, `Menunggak`

### 3.6 Laporan Tunggakan

Tujuan laporan:

- mengidentifikasi pinjaman yang terlambat dibayar dan prioritas tindak lanjut

Pengguna:

- admin
- petugas penagihan
- supervisor
- ketua

Data utama:

- anggota menunggak
- pinjaman menunggak
- jumlah tunggakan
- umur tunggakan
- status keterlambatan
- total tunggakan per periode

Bucket umur tunggakan:

- `1–7 hari`
- `8–30 hari`
- `Lebih dari 30 hari`

Metrik ringkas:

- total pinjaman menunggak
- total nominal tunggakan
- jumlah anggota menunggak
- bucket keterlambatan terbesar

Filter:

- anggota
- status keterlambatan
- lama tunggakan

Struktur tampilan:

- kartu ringkas bucket tunggakan
- daftar prioritas tunggakan
- urut default dari yang paling lama menunggak

Kolom utama:

- nama anggota
- nomor pinjaman
- jatuh tempo terakhir
- umur tunggakan
- jumlah tunggakan
- status keterlambatan

Aksi:

- cari anggota
- filter
- lihat detail anggota
- export Excel
- print view

Ekspor:

- Excel daftar tunggakan
- PDF daftar tunggakan prioritas

Empty state:

- `Tidak ada tunggakan pada periode ini`

Loading state:

- skeleton kartu bucket dan daftar tunggakan

Error state:

- `Gagal memuat laporan tunggakan`

Catatan UX:

- gunakan badge warna:
  - `1–7 hari` kuning
  - `8–30 hari` oranye
  - `Lebih dari 30 hari` merah
- tampilkan CTA `Lihat Detail`

Catatan backend:

- hitung dari `loans` dengan `status = DELINQUENT` atau `nextDueDate < hari ini`
- nominal tunggakan MVP bisa memakai 1 cicilan berjalan atau cicilan x jumlah bulan tertunggak, pilih satu aturan bisnis dan konsisten

### 3.7 Laporan Kas

Tujuan laporan:

- memantau arus kas masuk dan keluar koperasi

Pengguna:

- admin
- bendahara
- ketua
- pengawas

Data utama:

- kas masuk
- kas keluar
- saldo awal
- saldo akhir
- kategori transaksi
- transaksi kas per periode

Kategori yang dipakai:

- pencairan pinjaman
- pembayaran angsuran
- simpanan masuk
- biaya operasional

Metrik ringkas:

- total kas masuk
- total kas keluar
- saldo awal
- saldo akhir

Filter:

- tanggal
- kategori
- jenis transaksi

Struktur tampilan:

- kartu kas di atas
- daftar arus kas di bawah
- desktop: tabel
- mobile: kartu transaksi kas dengan label jelas

Kolom utama:

- tanggal
- kode transaksi
- kategori
- jenis arus
- nominal
- keterangan

Aksi:

- filter
- reset filter
- export Excel
- unduh PDF
- print view

Ekspor:

- Excel laporan kas
- PDF mutasi kas sederhana

Empty state:

- `Belum ada transaksi kas`

Loading state:

- skeleton kartu kas dan daftar

Error state:

- `Gagal memuat laporan kas`

Catatan UX:

- tampilkan label `Masuk` dan `Keluar` dengan warna berbeda
- saldo akhir harus selalu terlihat

Catatan backend:

- untuk MVP, kas dapat disusun dari `transactions` dan event pinjaman
- jika belum ada tabel `transaksi_kas`, backend dapat membentuk view laporan dari:
  - transaksi simpanan sebagai kas masuk
  - pembayaran angsuran sebagai kas masuk
  - pencairan pinjaman sebagai kas keluar
  - biaya operasional disiapkan bila nanti ada input manual

### 3.8 Laporan Transaksi Harian

Tujuan laporan:

- melihat aktivitas operasional harian secara cepat

Pengguna:

- admin
- petugas
- supervisor

Data utama:

- simpanan masuk hari ini
- pinjaman cair hari ini
- angsuran dibayar hari ini
- kas masuk hari ini
- kas keluar hari ini
- jumlah transaksi hari ini

Metrik ringkas:

- 5 sampai 6 kartu harian
- daftar transaksi hari ini

Filter:

- tanggal harian
- petugas jika nanti diperlukan

Struktur tampilan:

- default selalu `Hari Ini`
- bisa pindah ke tanggal lain
- daftar transaksi diurutkan dari terbaru

Aksi:

- pilih tanggal
- print view
- export Excel
- unduh PDF

Ekspor:

- PDF laporan harian
- Excel transaksi harian

Empty state:

- `Belum ada transaksi hari ini`

Loading state:

- skeleton kartu harian

Error state:

- `Gagal memuat transaksi harian`

Catatan UX:

- halaman ini harus sangat cepat dibaca, target di bawah 10 detik
- angka utama tampil besar, daftar detail tetap ringkas

Catatan backend:

- satu endpoint agregat harian + satu list transaksi hari itu
- pakai filter `transactionDate` dan `createdAt`

### 3.9 Laporan Rekap Bulanan

Tujuan laporan:

- memberikan ringkasan operasional bulanan untuk evaluasi manajemen

Pengguna:

- ketua
- pengelola
- pengawas
- admin

Data utama:

- total simpanan bulan ini
- total pinjaman cair bulan ini
- total angsuran bulan ini
- total tunggakan bulan ini
- rekap kas bulan ini
- anggota baru bulan ini

Metrik ringkas:

- 6 kartu rekap bulanan
- daftar indikator pembanding dengan bulan lalu jika tersedia

Filter:

- bulan
- tahun

Struktur tampilan:

- pilih bulan di bagian atas
- kartu rekap
- tabel ringkasan nilai bulanan
- daftar aktivitas penting bulan ini

Aksi:

- ganti bulan
- export Excel
- unduh PDF
- print view

Ekspor:

- PDF rekap bulanan untuk rapat
- Excel rekap bulanan detail

Empty state:

- `Belum ada data untuk bulan ini`

Loading state:

- skeleton kartu dan tabel

Error state:

- `Gagal memuat rekap bulanan`

Catatan UX:

- tambahkan label bulan yang aktif dengan jelas
- jika ada pembanding bulan lalu, gunakan teks sederhana seperti `Naik dari bulan lalu`

Catatan backend:

- agregasi bulanan dari `transactions`, `loans`, `loan_payments`, `member_profiles`
- pembanding bulan lalu bersifat opsional dan ringan

### 3.10 Laporan Detail Anggota

Tujuan laporan:

- memberi gambaran finansial lengkap per anggota

Pengguna:

- admin
- petugas
- supervisor
- ketua

Data utama:

- biodata ringkas anggota
- total simpanan
- total pinjaman
- pinjaman aktif
- sisa pinjaman
- riwayat angsuran
- status tunggakan
- transaksi terbaru

Metrik ringkas:

- total simpanan
- pinjaman aktif
- sisa pinjaman
- status tunggakan

Filter:

- cari anggota
- nomor anggota
- tombol masuk dari laporan anggota atau laporan tunggakan

Struktur tampilan:

- blok profil anggota
- kartu ringkasan keuangan
- tab:
  - `Simpanan`
  - `Pinjaman`
  - `Angsuran`
  - `Transaksi`

Kolom utama:

- profil: nama, nomor anggota, status, tanggal bergabung
- simpanan: pokok, wajib, sukarela, total
- pinjaman: nomor pinjaman, nominal, sisa, status
- angsuran: tanggal, nominal, metode, status
- transaksi: tanggal, jenis, nominal, keterangan

Aksi:

- lihat detail
- print view
- export Excel
- unduh PDF

Ekspor:

- PDF profil keuangan anggota
- Excel riwayat transaksi anggota

Empty state:

- `Data anggota belum lengkap`

Loading state:

- skeleton profil dan riwayat

Error state:

- `Gagal memuat detail anggota`

Catatan UX:

- halaman ini harus menjadi tujuan akhir dari banyak laporan
- tampilkan informasi penting di atas tanpa perlu scroll jauh

Catatan backend:

- endpoint detail anggota mengambil data gabungan dari `users`, `member_profiles`, `member_savings_balances`, `loans`, `loan_payments`, `transactions`

## 4. Struktur Filter dan Pencarian

Filter global yang disarankan:

- rentang tanggal
- nama anggota
- nomor anggota
- status anggota
- status pinjaman
- status pembayaran
- status keterlambatan
- jenis simpanan
- kategori kas

Desain filter mobile:

- tombol `Filter` di kanan atas
- buka `bottom sheet`
- isi filter berbentuk:
  - input cari
  - dropdown sederhana
  - pilihan tanggal
  - chip pilihan status
- tombol bawah:
  - `Terapkan Filter`
  - `Reset Filter`

Desain filter desktop:

- filter bar horizontal di atas tabel

Perilaku pencarian:

- pencarian langsung untuk nama atau nomor anggota
- debounce ringan 300 ms cukup
- tampilkan ringkasan filter aktif dalam chip kecil di bawah header

## 5. Fitur Ekspor dan Print

Fitur ekspor minimum:

- `Export Excel`
- `Unduh PDF`
- `Print View`

Aturan MVP:

- Excel diprioritaskan untuk laporan detail
- PDF diprioritaskan untuk ringkasan, rekap bulanan, dan laporan rapat
- print view memakai layout sederhana tanpa elemen navigasi aplikasi

Konten ekspor minimum:

- nama laporan
- periode
- tanggal unduh
- nama pengguna yang mengunduh jika tersedia
- tabel data
- total utama di bagian akhir

Catatan implementasi:

- endpoint ekspor bisa memakai query yang sama dengan layar
- PDF sederhana cukup berbasis template HTML lalu print
- Excel cukup format tabular tanpa styling berat

## 6. Panduan UI Mobile Web

Prinsip tata letak:

- header ringkas dengan judul laporan
- kartu ringkasan di atas
- filter dan aksi di bar kedua
- konten detail di bawah

Pola komponen yang dipakai:

- kartu ringkasan
- segmented switch
- badge status
- daftar kartu bertumpuk
- tabel responsif untuk desktop
- bottom sheet filter
- modal konfirmasi ekspor

Aturan mobile:

- maksimal 2 kartu per baris
- angka utama minimal tampil besar dan tebal
- label sekunder dibuat pendek
- aksi utama tetap terlihat tanpa memenuhi layar

Aturan desktop:

- pakai tabel untuk daftar panjang
- header tabel sticky
- panel filter tetap sederhana

## 7. Rekomendasi Field Tabel dan Kartu

Field kartu ringkasan umum:

- label
- nilai utama
- indikator kecil
- keterangan periode

Field daftar umum:

- kode data
- nama anggota
- tanggal
- nominal
- status
- aksi `Lihat Detail`

Field tabel per kategori:

- Anggota: nomor anggota, nama, status, tanggal bergabung, total simpanan, pinjaman aktif, status tunggakan
- Simpanan: tanggal, kode transaksi, anggota, jenis simpanan, nominal, status
- Pinjaman: nomor pinjaman, anggota, tanggal cair, nominal, sisa, tenor, status
- Angsuran: tanggal bayar, kode pembayaran, nomor pinjaman, anggota, nominal, metode, status
- Tunggakan: anggota, nomor pinjaman, jatuh tempo, umur tunggakan, nominal tunggakan, status
- Kas: tanggal, kode transaksi, kategori, arus, nominal, keterangan
- Transaksi Harian: waktu, jenis transaksi, anggota, nominal, status
- Rekap Bulanan: bulan, simpanan, pinjaman cair, angsuran, tunggakan, kas masuk, kas keluar, anggota baru

## 8. State UX

State kosong:

- gunakan ikon sederhana
- teks singkat
- satu CTA bila relevan

Contoh:

- `Belum ada data`
- `Data tidak ditemukan`
- `Belum ada transaksi pada periode ini`

State loading:

- skeleton kartu
- skeleton 3 sampai 5 baris daftar
- hindari spinner penuh layar kecuali load pertama

State error:

- pesan langsung dan sederhana
- tombol `Coba lagi`
- tetap tampilkan filter agar pengguna tidak merasa terjebak

Contoh:

- `Gagal memuat laporan`
- `Periksa koneksi lalu coba lagi`

## 9. Catatan Implementasi Ramah Backend

Modul ini realistis dibangun di stack saat ini karena semua laporan bisa diambil dari agregasi tabel standar:

- `users`
- `member_profiles`
- `member_savings_balances`
- `savings_products`
- `loan_applications`
- `loans`
- `loan_payments`
- `transactions`

Rekomendasi endpoint MVP:

- `GET /api/admin/reports/summary`
- `GET /api/admin/reports/members`
- `GET /api/admin/reports/savings`
- `GET /api/admin/reports/loans`
- `GET /api/admin/reports/installments`
- `GET /api/admin/reports/arrears`
- `GET /api/admin/reports/cashflow`
- `GET /api/admin/reports/daily-transactions`
- `GET /api/admin/reports/monthly-recap`
- `GET /api/admin/reports/member-detail/:memberCode`

Format respons yang disarankan:

- `summary`: angka kartu ringkasan
- `filters`: filter aktif yang dipakai backend
- `items`: daftar data detail
- `totals`: total footer bila perlu

Prinsip query:

- pakai agregasi SQL biasa
- pakai pagination pada daftar besar
- pakai index di tanggal, status, dan foreign key
- hindari query per baris

Aturan MVP untuk performa:

- default periode `bulan ini`
- limit daftar awal 20 sampai 50 baris
- ekspor baru mengambil full dataset bila diminta

Catatan data bisnis:

- laporan kas untuk MVP boleh dibentuk dari event transaksi yang sudah ada
- bila nanti koperasi butuh kas operasional detail, baru tambahkan tabel `transaksi_kas`
- aging tunggakan harus memakai aturan bisnis yang konsisten sejak awal

## 10. Urutan Prioritas MVP

Prioritas 1:

- Laporan Ringkasan
- Laporan Anggota
- Laporan Pinjaman
- Laporan Angsuran
- Laporan Tunggakan

Prioritas 2:

- Laporan Simpanan
- Laporan Kas
- Laporan Detail Anggota

Prioritas 3:

- Laporan Transaksi Harian
- Laporan Rekap Bulanan
- ekspor PDF yang lebih rapi

Urutan implementasi yang paling aman:

1. Halaman daftar menu laporan
2. Laporan Ringkasan
3. Laporan Anggota
4. Laporan Pinjaman
5. Laporan Angsuran
6. Laporan Tunggakan
7. Laporan Simpanan
8. Laporan Kas
9. Laporan Detail Anggota
10. Laporan Transaksi Harian dan Rekap Bulanan

## Arah Desain Final

Modul laporan harus terasa:

- praktis
- rapi
- profesional
- terpercaya
- ringan
- cepat dibaca
- cocok untuk operasional koperasi harian di Indonesia

Gaya visual yang disarankan:

- latar terang dan bersih
- dominasi hijau koperasi sebagai aksen
- badge status yang jelas
- kartu putih dengan shadow halus
- teks angka yang kuat
- aksi utama selalu terlihat

Fokus utama bukan membuat dashboard yang rumit, tetapi membuat admin koperasi bisa membuka laporan, memahami kondisi, dan mengambil tindakan dalam hitungan detik.
