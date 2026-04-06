import { z } from "zod";

const textField = (label: string, min: number, max: number) =>
  z
    .string({
      required_error: `${label} wajib diisi.`,
      invalid_type_error: `${label} wajib berupa teks.`,
    })
    .trim()
    .min(min, min === 1 ? `${label} wajib diisi.` : `${label} minimal ${min} karakter.`)
    .max(max, `${label} maksimal ${max} karakter.`);

const optionalTextField = (label: string, max: number) =>
  z
    .union([
      z
        .string({
          invalid_type_error: `${label} wajib berupa teks.`,
        })
        .trim()
        .max(max, `${label} maksimal ${max} karakter.`),
      z.literal(""),
      z.null(),
    ])
    .optional();

const phoneField = z
  .string({
    required_error: "Nomor telepon wajib diisi.",
    invalid_type_error: "Nomor telepon wajib berupa teks.",
  })
  .trim()
  .min(10, "Nomor telepon minimal 10 digit.")
  .max(20, "Nomor telepon maksimal 20 digit.");

const passwordField = (label: string, min: number) =>
  z
    .string({
      required_error: `${label} wajib diisi.`,
      invalid_type_error: `${label} wajib berupa teks.`,
    })
    .min(min, `${label} minimal ${min} karakter.`)
    .max(128, `${label} maksimal 128 karakter.`);

const moneyField = (label: string) =>
  z.coerce.number({
    required_error: `${label} wajib diisi.`,
    invalid_type_error: `${label} harus berupa angka.`,
  });

const optionalEmailField = z
  .union([
    z
      .string({
        invalid_type_error: "Email tidak valid.",
      })
      .trim()
      .email("Email tidak valid."),
    z.literal(""),
    z.null(),
  ])
  .optional();

const optionalDateStringField = (label: string) =>
  z
    .string({
      invalid_type_error: `${label} tidak valid.`,
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} harus berformat YYYY-MM-DD.`)
    .optional();

const optionalMonthStringField = (label: string) =>
  z
    .string({
      invalid_type_error: `${label} tidak valid.`,
    })
    .regex(/^\d{4}-\d{2}$/, `${label} harus berformat YYYY-MM.`)
    .optional();

const optionalFilterTextField = (label: string, max = 100) =>
  z
    .string({
      invalid_type_error: `${label} tidak valid.`,
    })
    .trim()
    .max(max, `${label} maksimal ${max} karakter.`)
    .optional();

export const idParamSchema = z.object({
  id: z
    .string({
      required_error: "ID wajib diisi.",
      invalid_type_error: "ID tidak valid.",
    })
    .min(1, "ID wajib diisi."),
});

export const loginSchema = z.object({
  phone: phoneField,
  password: passwordField("Kata sandi", 4),
});

export const profileUpdateSchema = z.object({
  name: textField("Nama", 2, 100),
  phone: phoneField,
  email: optionalEmailField,
  address: optionalTextField("Alamat", 255),
});

export const passwordChangeSchema = z.object({
  currentPassword: passwordField("Kata sandi saat ini", 4),
  newPassword: passwordField("Kata sandi baru", 6),
});

export const memberCreateSchema = z.object({
  name: textField("Nama anggota", 2, 100),
  phone: phoneField,
  password: passwordField("Kata sandi", 4),
  status: z.enum(["Aktif", "Nonaktif"], {
    required_error: "Status anggota wajib dipilih.",
    invalid_type_error: "Status anggota tidak valid.",
  }).default("Aktif"),
  email: optionalEmailField,
  address: optionalTextField("Alamat", 255),
});

export const memberUpdateSchema = memberCreateSchema.omit({ password: true });

export const savingsProductSchema = z.object({
  name: textField("Nama jenis simpanan", 2, 100),
  amount: moneyField("Nominal simpanan").min(0, "Nominal simpanan tidak boleh kurang dari 0."),
  isMandatory: z.boolean({
    required_error: "Status wajib simpanan harus dipilih.",
    invalid_type_error: "Status wajib simpanan tidak valid.",
  }),
});

export const loanProductSchema = z.object({
  name: textField("Nama jenis pinjaman", 2, 100),
  maxAmount: moneyField("Maksimal pinjaman").positive("Maksimal pinjaman harus lebih dari 0."),
  interestRate: moneyField("Bunga pinjaman").min(0, "Bunga pinjaman tidak boleh kurang dari 0."),
  adminFeeRate: moneyField("Biaya admin")
    .min(0, "Biaya admin tidak boleh kurang dari 0.")
    .default(1),
  maxTenor: moneyField("Maksimal tenor")
    .int("Maksimal tenor harus berupa bilangan bulat.")
    .positive("Maksimal tenor harus lebih dari 0.")
    .max(120, "Maksimal tenor tidak boleh lebih dari 120 bulan."),
});

export const announcementSchema = z.object({
  title: textField("Judul pengumuman", 3, 150),
  content: textField("Isi pengumuman", 5, 5000),
  isActive: z.boolean({
    required_error: "Status pengumuman wajib dipilih.",
    invalid_type_error: "Status pengumuman tidak valid.",
  }),
});

export const loanApplicationCreateSchema = z.object({
  amount: moneyField("Nominal pinjaman")
    .min(500000, "Nominal pinjaman minimal Rp500.000.")
    .max(50000000, "Nominal pinjaman maksimal Rp50.000.000."),
  tenor: moneyField("Tenor pinjaman")
    .int("Tenor pinjaman harus berupa bilangan bulat.")
    .positive("Tenor pinjaman harus lebih dari 0.")
    .max(60, "Tenor pinjaman maksimal 60 bulan."),
  purpose: textField("Tujuan pinjaman", 3, 255),
  loanProductId: z
    .string({
      invalid_type_error: "Produk pinjaman tidak valid.",
    })
    .min(1, "Produk pinjaman wajib dipilih.")
    .optional(),
});

export const loanApplicationReviewSchema = z.object({
  status: z.enum(["Ditinjau", "Disetujui", "Ditolak"], {
    required_error: "Status pengajuan wajib dipilih.",
    invalid_type_error: "Status pengajuan tidak valid.",
  }),
  reviewNote: optionalTextField("Catatan review", 500),
});

export const loanPaymentSchema = z.object({
  amount: moneyField("Nominal pembayaran").positive("Nominal pembayaran harus lebih dari 0."),
  method: z.enum(["Transfer", "Tunai"], {
    required_error: "Metode pembayaran wajib dipilih.",
    invalid_type_error: "Metode pembayaran tidak valid.",
  }),
  note: optionalTextField("Catatan pembayaran", 500),
});

export const reportRangeQuerySchema = z.object({
  startDate: optionalDateStringField("Tanggal mulai"),
  endDate: optionalDateStringField("Tanggal akhir"),
});

export const membersReportQuerySchema = z.object({
  query: optionalFilterTextField("Pencarian anggota"),
  status: z.enum(["Semua", "Aktif", "Nonaktif"]).optional(),
  joinedFrom: optionalDateStringField("Tanggal gabung mulai"),
  joinedTo: optionalDateStringField("Tanggal gabung akhir"),
  loanStatus: z.enum(["Semua", "Ada Pinjaman", "Tanpa Pinjaman"]).optional(),
  delinquencyStatus: z.enum(["Semua", "Lancar", "Menunggak", "Tanpa Pinjaman"]).optional(),
});

export const savingsReportQuerySchema = z.object({
  startDate: optionalDateStringField("Tanggal mulai"),
  endDate: optionalDateStringField("Tanggal akhir"),
  memberCode: optionalFilterTextField("Kode anggota"),
  savingsType: z
    .enum(["Semua", "Simpanan Pokok", "Simpanan Wajib", "Simpanan Sukarela"])
    .optional(),
});

export const loansReportQuerySchema = z.object({
  startDate: optionalDateStringField("Tanggal mulai"),
  endDate: optionalDateStringField("Tanggal akhir"),
  query: optionalFilterTextField("Pencarian pinjaman"),
  status: z.enum(["Semua", "Lancar", "Menunggak", "Lunas"]).optional(),
});

export const installmentsReportQuerySchema = z.object({
  startDate: optionalDateStringField("Tanggal mulai"),
  endDate: optionalDateStringField("Tanggal akhir"),
  query: optionalFilterTextField("Pencarian angsuran"),
  loanCode: optionalFilterTextField("Nomor pinjaman"),
  status: z.enum(["Semua", "Berhasil", "Jatuh Tempo", "Menunggak"]).optional(),
});

export const arrearsReportQuerySchema = z.object({
  query: optionalFilterTextField("Pencarian tunggakan"),
  agingBucket: z.enum(["Semua", "1–7 hari", "8–30 hari", "Lebih dari 30 hari"]).optional(),
});

export const cashflowReportQuerySchema = z.object({
  startDate: optionalDateStringField("Tanggal mulai"),
  endDate: optionalDateStringField("Tanggal akhir"),
  category: z
    .enum(["Semua", "Simpanan Masuk", "Angsuran Masuk", "Pencairan Pinjaman", "Biaya Operasional"])
    .optional(),
  direction: z.enum(["Semua", "Masuk", "Keluar"]).optional(),
});

export const dailyTransactionsReportQuerySchema = z.object({
  date: optionalDateStringField("Tanggal laporan"),
});

export const monthlyRecapReportQuerySchema = z.object({
  month: optionalMonthStringField("Bulan laporan"),
});
