import {
  LoanApplicationStatus,
  LoanStatus,
  MemberStatus,
  NotificationType,
  PaymentMethod,
  PrismaClient,
  Role,
  TransactionCategory,
  TransactionType,
} from "@prisma/client";
import { hashPassword } from "./server.utils.js";

const prisma = new PrismaClient();

async function main() {
  const shouldReset = process.env.SEED_RESET === "true";
  const existingUsers = await prisma.user.count();

  if (existingUsers > 0 && !shouldReset) {
    throw new Error(
      "Refusing to reseed a non-empty database. Set SEED_RESET=true if you intentionally want to clear and reseed this database.",
    );
  }

  if (shouldReset) {
    await prisma.notification.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.loanPayment.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.loanApplication.deleteMany();
    await prisma.memberSavingsBalance.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.loanProduct.deleteMany();
    await prisma.savingsProduct.deleteMany();
    await prisma.memberProfile.deleteMany();
    await prisma.user.deleteMany();
  }

  const [adminPassword, memberPassword] = await Promise.all([
    hashPassword("admin"),
    hashPassword("user"),
  ]);

  const savingsProducts = await Promise.all([
    prisma.savingsProduct.create({
      data: { code: "JS-001", name: "Simpanan Pokok", defaultAmount: 500000, isMandatory: true },
    }),
    prisma.savingsProduct.create({
      data: { code: "JS-002", name: "Simpanan Wajib", defaultAmount: 50000, isMandatory: true },
    }),
    prisma.savingsProduct.create({
      data: { code: "JS-003", name: "Simpanan Sukarela", defaultAmount: 0, isMandatory: false },
    }),
  ]);

  const [regularLoanProduct, businessLoanProduct] = await Promise.all([
    prisma.loanProduct.create({
      data: {
        code: "JP-001",
        name: "Pinjaman Reguler",
        maxAmount: 10000000,
        interestRate: 2,
        adminFeeRate: 1,
        maxTenor: 24,
      },
    }),
    prisma.loanProduct.create({
      data: {
        code: "JP-002",
        name: "Pinjaman Usaha",
        maxAmount: 50000000,
        interestRate: 1.5,
        adminFeeRate: 1,
        maxTenor: 36,
      },
    }),
  ]);

  const admin = await prisma.user.create({
    data: {
      role: Role.ADMIN,
      name: "Siti Rahma",
      phone: "08111111111",
      email: "admin@koperasi.com",
      address: "Kantor Pusat",
      passwordHash: adminPassword,
    },
  });

  const budi = await prisma.user.create({
    data: {
      role: Role.MEMBER,
      name: "Budi Santoso",
      phone: "08222222222",
      address: "Jl. Merdeka No. 45, Jakarta",
      passwordHash: memberPassword,
      memberProfile: { create: { memberCode: "KSP-10248", status: MemberStatus.ACTIVE } },
    },
    include: { memberProfile: true },
  });

  const siti = await prisma.user.create({
    data: {
      role: Role.MEMBER,
      name: "Siti Aminah",
      phone: "08333333333",
      address: "Jl. Sudirman No. 10, Jakarta",
      passwordHash: memberPassword,
      memberProfile: { create: { memberCode: "KSP-10555", status: MemberStatus.ACTIVE } },
    },
    include: { memberProfile: true },
  });

  const ahmad = await prisma.user.create({
    data: {
      role: Role.MEMBER,
      name: "Ahmad Fauzi",
      phone: "08444444444",
      address: "Jl. Kebon Sirih No. 22, Jakarta",
      passwordHash: memberPassword,
      memberProfile: { create: { memberCode: "KSP-10601", status: MemberStatus.ACTIVE } },
    },
    include: { memberProfile: true },
  });

  const dewi = await prisma.user.create({
    data: {
      role: Role.MEMBER,
      name: "Dewi Lestari",
      phone: "08555555555",
      address: "Jl. Cikini No. 8, Jakarta",
      passwordHash: memberPassword,
      memberProfile: { create: { memberCode: "KSP-10602", status: MemberStatus.INACTIVE } },
    },
    include: { memberProfile: true },
  });

  const joko = await prisma.user.create({
    data: {
      role: Role.MEMBER,
      name: "Joko Anwar",
      phone: "08666666666",
      address: "Jl. Diponegoro No. 12, Jakarta",
      passwordHash: memberPassword,
      memberProfile: { create: { memberCode: "KSP-10002", status: MemberStatus.ACTIVE } },
    },
    include: { memberProfile: true },
  });

  const productByName = Object.fromEntries(savingsProducts.map((product) => [product.name, product]));

  const createBalances = async (memberId: string, amounts: Record<string, number>) => {
    await prisma.memberSavingsBalance.createMany({
      data: Object.entries(amounts).map(([name, amount]) => ({
        memberId,
        savingsProductId: productByName[name].id,
        amount,
      })),
    });
  };

  await createBalances(budi.memberProfile!.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 1250000,
    "Simpanan Sukarela": 3800000,
  });
  await createBalances(siti.memberProfile!.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 500000,
    "Simpanan Sukarela": 1000000,
  });
  await createBalances(ahmad.memberProfile!.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 500000,
    "Simpanan Sukarela": 500000,
  });
  await createBalances(dewi.memberProfile!.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 0,
    "Simpanan Sukarela": 0,
  });
  await createBalances(joko.memberProfile!.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 750000,
    "Simpanan Sukarela": 0,
  });

  const applicationAhmad = await prisma.loanApplication.create({
    data: {
      applicationCode: "APP-002",
      memberId: ahmad.memberProfile!.id,
      loanProductId: regularLoanProduct.id,
      amount: 10000000,
      tenor: 24,
      purpose: "Renovasi Rumah",
      status: LoanApplicationStatus.APPROVED,
      estimatedInstallment: 516667,
      reviewedAt: new Date("2026-04-01"),
      reviewedById: admin.id,
    },
  });

  await prisma.loanApplication.createMany({
    data: [
      {
        applicationCode: "APP-001",
        memberId: siti.memberProfile!.id,
        loanProductId: regularLoanProduct.id,
        amount: 5000000,
        tenor: 12,
        purpose: "Modal Usaha",
        status: LoanApplicationStatus.NEW,
        estimatedInstallment: 458334,
      },
      {
        applicationCode: "APP-003",
        memberId: dewi.memberProfile!.id,
        loanProductId: businessLoanProduct.id,
        amount: 2000000,
        tenor: 6,
        purpose: "Pendidikan",
        status: LoanApplicationStatus.REJECTED,
        estimatedInstallment: 353334,
        reviewNote: "Status anggota belum aktif.",
        reviewedAt: new Date("2026-03-28"),
        reviewedById: admin.id,
      },
    ],
  });

  const loanBudi = await prisma.loan.create({
    data: {
      loanCode: "PJ-2026-001",
      memberId: budi.memberProfile!.id,
      loanProductId: regularLoanProduct.id,
      principalAmount: 7500000,
      remainingAmount: 5000000,
      installmentAmount: 750000,
      tenor: 10,
      paidMonths: 3,
      nextDueDate: new Date("2026-05-12"),
      status: LoanStatus.ACTIVE,
      approvedById: admin.id,
    },
  });

  const loanAhmad = await prisma.loan.create({
    data: {
      loanCode: "PJ-2026-002",
      memberId: ahmad.memberProfile!.id,
      loanProductId: regularLoanProduct.id,
      loanApplicationId: applicationAhmad.id,
      principalAmount: 10000000,
      remainingAmount: 10000000,
      installmentAmount: 516667,
      tenor: 24,
      paidMonths: 0,
      nextDueDate: new Date("2026-05-01"),
      status: LoanStatus.ACTIVE,
      approvedById: admin.id,
    },
  });

  const loanJoko = await prisma.loan.create({
    data: {
      loanCode: "PJ-2025-089",
      memberId: joko.memberProfile!.id,
      loanProductId: businessLoanProduct.id,
      principalAmount: 15000000,
      remainingAmount: 2000000,
      installmentAmount: 1500000,
      tenor: 12,
      paidMonths: 10,
      nextDueDate: new Date("2026-04-10"),
      status: LoanStatus.DELINQUENT,
      approvedById: admin.id,
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        transactionCode: "TRX-001",
        memberId: budi.memberProfile!.id,
        savingsProductId: productByName["Simpanan Wajib"].id,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.MANDATORY_SAVING_DEPOSIT,
        amount: 50000,
        status: "Berhasil",
        description: "Setoran wajib bulanan",
        transactionDate: new Date("2026-04-01"),
        createdById: admin.id,
      },
      {
        transactionCode: "TRX-002",
        memberId: budi.memberProfile!.id,
        loanId: loanBudi.id,
        category: TransactionCategory.LOAN,
        type: TransactionType.LOAN_PAYMENT,
        amount: 750000,
        status: "Berhasil",
        description: "Angsuran pinjaman bulan Maret",
        transactionDate: new Date("2026-03-12"),
        createdById: admin.id,
      },
      {
        transactionCode: "TRX-003",
        memberId: budi.memberProfile!.id,
        savingsProductId: productByName["Simpanan Sukarela"].id,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.VOLUNTARY_SAVING_DEPOSIT,
        amount: 200000,
        status: "Berhasil",
        description: "Setoran sukarela",
        transactionDate: new Date("2026-03-05"),
        createdById: admin.id,
      },
      {
        transactionCode: "TRX-004",
        memberId: siti.memberProfile!.id,
        savingsProductId: productByName["Simpanan Wajib"].id,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.MANDATORY_SAVING_DEPOSIT,
        amount: 50000,
        status: "Berhasil",
        description: "Setoran wajib bulanan",
        transactionDate: new Date("2026-04-01"),
        createdById: admin.id,
      },
      {
        transactionCode: "TRX-005",
        memberId: siti.memberProfile!.id,
        savingsProductId: productByName["Simpanan Sukarela"].id,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.VOLUNTARY_SAVING_DEPOSIT,
        amount: 500000,
        status: "Berhasil",
        description: "Setoran sukarela",
        transactionDate: new Date("2026-03-15"),
        createdById: admin.id,
      },
    ],
  });

  await prisma.loanPayment.create({
    data: {
      paymentCode: "PAY-001",
      loanId: loanBudi.id,
      amount: 750000,
      method: PaymentMethod.TRANSFER,
      note: "Pembayaran via transfer",
      paymentDate: new Date("2026-03-12"),
      recordedById: admin.id,
    },
  });

  const annualMeeting = await prisma.announcement.create({
    data: {
      announcementCode: "ANN-001",
      title: "Rapat Anggota Tahunan",
      content: "Rapat Anggota Tahunan akan diadakan pada 20 Mei 2026 di Aula Utama.",
      isActive: true,
      publishedAt: new Date("2026-03-10"),
      createdById: admin.id,
    },
  });

  await prisma.announcement.create({
    data: {
      announcementCode: "ANN-002",
      title: "Perubahan Jam Operasional",
      content: "Selama bulan Ramadhan, jam operasional kantor maju 1 jam.",
      isActive: false,
      publishedAt: new Date("2026-02-15"),
      createdById: admin.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        notificationCode: "NOTIF-001",
        userId: budi.id,
        type: NotificationType.PAYMENT_POSTED,
        title: "Pembayaran Berhasil",
        message: "Angsuran pinjaman bulan Maret telah diterima.",
        createdAt: new Date("2026-03-12"),
        isRead: true,
        loanId: loanBudi.id,
      },
      {
        notificationCode: "NOTIF-002-BUDI",
        userId: budi.id,
        type: NotificationType.ANNOUNCEMENT,
        title: annualMeeting.title,
        message: annualMeeting.content,
        createdAt: new Date("2026-03-10"),
        isRead: false,
        announcementId: annualMeeting.id,
      },
      {
        notificationCode: "NOTIF-002-SITI",
        userId: siti.id,
        type: NotificationType.ANNOUNCEMENT,
        title: annualMeeting.title,
        message: annualMeeting.content,
        createdAt: new Date("2026-03-10"),
        isRead: false,
        announcementId: annualMeeting.id,
      },
      {
        notificationCode: "NOTIF-003",
        userId: ahmad.id,
        type: NotificationType.LOAN_APPROVED,
        title: "Pinjaman Disetujui",
        message: "Pengajuan pinjaman Anda sebesar Rp10000000 telah disetujui.",
        createdAt: new Date("2026-04-01"),
        isRead: false,
        loanApplicationId: applicationAhmad.id,
        loanId: loanAhmad.id,
      },
      {
        notificationCode: "NOTIF-004",
        userId: joko.id,
        type: NotificationType.SYSTEM,
        title: "Pengingat Pembayaran",
        message: "Terdapat keterlambatan pembayaran pinjaman. Mohon lakukan pembayaran segera.",
        createdAt: new Date("2026-04-03"),
        isRead: false,
        loanId: loanJoko.id,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

