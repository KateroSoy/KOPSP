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

type ExistingMemberProfile = {
  id: string;
  memberCode: string;
  userId: string;
};

type SeedUserInput = {
  role: Role;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  passwordHash: string;
  memberProfile?: {
    memberCode: string;
    status: MemberStatus;
  };
};

const resolveAvailableEmail = async (preferredEmail?: string | null) => {
  if (!preferredEmail) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { email: preferredEmail },
  });

  return existing ? null : preferredEmail;
};

const syncMemberProfile = async (
  userId: string,
  existingProfile: ExistingMemberProfile | null,
  input: { memberCode: string; status: MemberStatus },
) => {
  const conflictingProfile = await prisma.memberProfile.findUnique({
    where: { memberCode: input.memberCode },
  });

  if (!existingProfile) {
    if (conflictingProfile && conflictingProfile.userId !== userId) {
      throw new Error(`Member code ${input.memberCode} is already used by another user.`);
    }

    return prisma.memberProfile.create({
      data: {
        userId,
        memberCode: input.memberCode,
        status: input.status,
      },
    });
  }

  const nextMemberCode =
    !conflictingProfile || conflictingProfile.userId === userId
      ? input.memberCode
      : existingProfile.memberCode;

  return prisma.memberProfile.update({
    where: { id: existingProfile.id },
    data: {
      memberCode: nextMemberCode,
      status: input.status,
    },
  });
};

const upsertSeedUser = async (input: SeedUserInput) => {
  const existingUserByPhone = await prisma.user.findUnique({
    where: { phone: input.phone },
    include: { memberProfile: true },
  });

  const existingUserByMemberCode = input.memberProfile
    ? (
        await prisma.memberProfile.findUnique({
          where: { memberCode: input.memberProfile.memberCode },
          include: {
            user: {
              include: { memberProfile: true },
            },
          },
        })
      )?.user ?? null
    : null;

  const existingUser = existingUserByPhone ?? existingUserByMemberCode;

  if (existingUser) {
    const email =
      existingUser.email !== null
        ? existingUser.email
        : input.email
          ? await resolveAvailableEmail(input.email)
          : undefined;

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: input.role,
        name: input.name,
        address: input.address ?? null,
        passwordHash: input.passwordHash,
        ...(email !== undefined ? { email } : {}),
      },
      include: { memberProfile: true },
    });

    if (input.memberProfile) {
      await syncMemberProfile(updatedUser.id, updatedUser.memberProfile, input.memberProfile);
    }

    return prisma.user.findUniqueOrThrow({
      where: { id: updatedUser.id },
      include: { memberProfile: true },
    });
  }

  const email = input.email ? await resolveAvailableEmail(input.email) : null;

  return prisma.user.create({
    data: {
      role: input.role,
      name: input.name,
      phone: input.phone,
      email,
      address: input.address ?? null,
      passwordHash: input.passwordHash,
      ...(input.memberProfile
        ? {
            memberProfile: {
              create: {
                memberCode: input.memberProfile.memberCode,
                status: input.memberProfile.status,
              },
            },
          }
        : {}),
    },
    include: { memberProfile: true },
  });
};

const getMemberProfileOrThrow = (
  user: Awaited<ReturnType<typeof upsertSeedUser>>,
  label: string,
) => {
  if (!user.memberProfile) {
    throw new Error(`${label} is missing a member profile after seeding.`);
  }

  return user.memberProfile;
};

async function main() {
  const shouldReset = process.env.SEED_RESET === "true";

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
    prisma.savingsProduct.upsert({
      where: { code: "JS-001" },
      update: {
        name: "Simpanan Pokok",
        defaultAmount: 500000,
        isMandatory: true,
        isActive: true,
      },
      create: {
        code: "JS-001",
        name: "Simpanan Pokok",
        defaultAmount: 500000,
        isMandatory: true,
        isActive: true,
      },
    }),
    prisma.savingsProduct.upsert({
      where: { code: "JS-002" },
      update: {
        name: "Simpanan Wajib",
        defaultAmount: 50000,
        isMandatory: true,
        isActive: true,
      },
      create: {
        code: "JS-002",
        name: "Simpanan Wajib",
        defaultAmount: 50000,
        isMandatory: true,
        isActive: true,
      },
    }),
    prisma.savingsProduct.upsert({
      where: { code: "JS-003" },
      update: {
        name: "Simpanan Sukarela",
        defaultAmount: 0,
        isMandatory: false,
        isActive: true,
      },
      create: {
        code: "JS-003",
        name: "Simpanan Sukarela",
        defaultAmount: 0,
        isMandatory: false,
        isActive: true,
      },
    }),
  ]);

  const [regularLoanProduct, businessLoanProduct] = await Promise.all([
    prisma.loanProduct.upsert({
      where: { code: "JP-001" },
      update: {
        name: "Pinjaman Reguler",
        maxAmount: 10000000,
        interestRate: 2,
        adminFeeRate: 1,
        maxTenor: 24,
        isActive: true,
      },
      create: {
        code: "JP-001",
        name: "Pinjaman Reguler",
        maxAmount: 10000000,
        interestRate: 2,
        adminFeeRate: 1,
        maxTenor: 24,
        isActive: true,
      },
    }),
    prisma.loanProduct.upsert({
      where: { code: "JP-002" },
      update: {
        name: "Pinjaman Usaha",
        maxAmount: 50000000,
        interestRate: 1.5,
        adminFeeRate: 1,
        maxTenor: 36,
        isActive: true,
      },
      create: {
        code: "JP-002",
        name: "Pinjaman Usaha",
        maxAmount: 50000000,
        interestRate: 1.5,
        adminFeeRate: 1,
        maxTenor: 36,
        isActive: true,
      },
    }),
  ]);

  const admin = await upsertSeedUser({
    role: Role.ADMIN,
    name: "Siti Rahma",
    phone: "08111111111",
    email: "admin@koperasi.com",
    address: "Kantor Pusat",
    passwordHash: adminPassword,
  });

  const budi = await upsertSeedUser({
    role: Role.MEMBER,
    name: "Budi Santoso",
    phone: "08222222222",
    address: "Jl. Merdeka No. 45, Jakarta",
    passwordHash: memberPassword,
    memberProfile: { memberCode: "KSP-10248", status: MemberStatus.ACTIVE },
  });

  const siti = await upsertSeedUser({
    role: Role.MEMBER,
    name: "Siti Aminah",
    phone: "08333333333",
    address: "Jl. Sudirman No. 10, Jakarta",
    passwordHash: memberPassword,
    memberProfile: { memberCode: "KSP-10555", status: MemberStatus.ACTIVE },
  });

  const ahmad = await upsertSeedUser({
    role: Role.MEMBER,
    name: "Ahmad Fauzi",
    phone: "08444444444",
    address: "Jl. Kebon Sirih No. 22, Jakarta",
    passwordHash: memberPassword,
    memberProfile: { memberCode: "KSP-10601", status: MemberStatus.ACTIVE },
  });

  const dewi = await upsertSeedUser({
    role: Role.MEMBER,
    name: "Dewi Lestari",
    phone: "08555555555",
    address: "Jl. Cikini No. 8, Jakarta",
    passwordHash: memberPassword,
    memberProfile: { memberCode: "KSP-10602", status: MemberStatus.INACTIVE },
  });

  const joko = await upsertSeedUser({
    role: Role.MEMBER,
    name: "Joko Anwar",
    phone: "08666666666",
    address: "Jl. Diponegoro No. 12, Jakarta",
    passwordHash: memberPassword,
    memberProfile: { memberCode: "KSP-10002", status: MemberStatus.ACTIVE },
  });

  const budiProfile = getMemberProfileOrThrow(budi, "Budi Santoso");
  const sitiProfile = getMemberProfileOrThrow(siti, "Siti Aminah");
  const ahmadProfile = getMemberProfileOrThrow(ahmad, "Ahmad Fauzi");
  const dewiProfile = getMemberProfileOrThrow(dewi, "Dewi Lestari");
  const jokoProfile = getMemberProfileOrThrow(joko, "Joko Anwar");

  const productByName = Object.fromEntries(savingsProducts.map((product) => [product.name, product]));

  const createBalances = async (memberId: string, amounts: Record<string, number>) => {
    await Promise.all(
      Object.entries(amounts).map(([name, amount]) =>
        prisma.memberSavingsBalance.upsert({
          where: {
            memberId_savingsProductId: {
              memberId,
              savingsProductId: productByName[name].id,
            },
          },
          update: { amount },
          create: {
            memberId,
            savingsProductId: productByName[name].id,
            amount,
          },
        }),
      ),
    );
  };

  await createBalances(budiProfile.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 1250000,
    "Simpanan Sukarela": 3800000,
  });
  await createBalances(sitiProfile.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 500000,
    "Simpanan Sukarela": 1000000,
  });
  await createBalances(ahmadProfile.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 500000,
    "Simpanan Sukarela": 500000,
  });
  await createBalances(dewiProfile.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 0,
    "Simpanan Sukarela": 0,
  });
  await createBalances(jokoProfile.id, {
    "Simpanan Pokok": 500000,
    "Simpanan Wajib": 750000,
    "Simpanan Sukarela": 0,
  });

  const applicationAhmad = await prisma.loanApplication.upsert({
    where: { applicationCode: "APP-002" },
    update: {
      memberId: ahmadProfile.id,
      loanProductId: regularLoanProduct.id,
      amount: 10000000,
      tenor: 24,
      purpose: "Renovasi Rumah",
      status: LoanApplicationStatus.APPROVED,
      estimatedInstallment: 516667,
      reviewNote: null,
      reviewedAt: new Date("2026-04-01"),
      reviewedById: admin.id,
    },
    create: {
      applicationCode: "APP-002",
      memberId: ahmadProfile.id,
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

  await Promise.all([
    prisma.loanApplication.upsert({
      where: { applicationCode: "APP-001" },
      update: {
        memberId: sitiProfile.id,
        loanProductId: regularLoanProduct.id,
        amount: 5000000,
        tenor: 12,
        purpose: "Modal Usaha",
        status: LoanApplicationStatus.NEW,
        estimatedInstallment: 458334,
        reviewNote: null,
        reviewedAt: null,
        reviewedById: null,
      },
      create: {
        applicationCode: "APP-001",
        memberId: sitiProfile.id,
        loanProductId: regularLoanProduct.id,
        amount: 5000000,
        tenor: 12,
        purpose: "Modal Usaha",
        status: LoanApplicationStatus.NEW,
        estimatedInstallment: 458334,
      },
    }),
    prisma.loanApplication.upsert({
      where: { applicationCode: "APP-003" },
      update: {
        memberId: dewiProfile.id,
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
      create: {
        applicationCode: "APP-003",
        memberId: dewiProfile.id,
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
    }),
  ]);

  const loanBudi = await prisma.loan.upsert({
    where: { loanCode: "PJ-2026-001" },
    update: {
      memberId: budiProfile.id,
      loanProductId: regularLoanProduct.id,
      loanApplicationId: null,
      principalAmount: 7500000,
      remainingAmount: 5000000,
      installmentAmount: 750000,
      tenor: 10,
      paidMonths: 3,
      nextDueDate: new Date("2026-05-12"),
      status: LoanStatus.ACTIVE,
      approvedById: admin.id,
    },
    create: {
      loanCode: "PJ-2026-001",
      memberId: budiProfile.id,
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

  const loanAhmad = await prisma.loan.upsert({
    where: { loanCode: "PJ-2026-002" },
    update: {
      memberId: ahmadProfile.id,
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
    create: {
      loanCode: "PJ-2026-002",
      memberId: ahmadProfile.id,
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

  const loanJoko = await prisma.loan.upsert({
    where: { loanCode: "PJ-2025-089" },
    update: {
      memberId: jokoProfile.id,
      loanProductId: businessLoanProduct.id,
      loanApplicationId: null,
      principalAmount: 15000000,
      remainingAmount: 2000000,
      installmentAmount: 1500000,
      tenor: 12,
      paidMonths: 10,
      nextDueDate: new Date("2026-04-10"),
      status: LoanStatus.DELINQUENT,
      approvedById: admin.id,
    },
    create: {
      loanCode: "PJ-2025-089",
      memberId: jokoProfile.id,
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

  await Promise.all([
    prisma.transaction.upsert({
      where: { transactionCode: "TRX-001" },
      update: {
        memberId: budiProfile.id,
        savingsProductId: productByName["Simpanan Wajib"].id,
        loanId: null,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.MANDATORY_SAVING_DEPOSIT,
        amount: 50000,
        status: "Berhasil",
        description: "Setoran wajib bulanan",
        transactionDate: new Date("2026-04-01"),
        createdById: admin.id,
      },
      create: {
        transactionCode: "TRX-001",
        memberId: budiProfile.id,
        savingsProductId: productByName["Simpanan Wajib"].id,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.MANDATORY_SAVING_DEPOSIT,
        amount: 50000,
        status: "Berhasil",
        description: "Setoran wajib bulanan",
        transactionDate: new Date("2026-04-01"),
        createdById: admin.id,
      },
    }),
    prisma.transaction.upsert({
      where: { transactionCode: "TRX-002" },
      update: {
        memberId: budiProfile.id,
        loanId: loanBudi.id,
        savingsProductId: null,
        category: TransactionCategory.LOAN,
        type: TransactionType.LOAN_PAYMENT,
        amount: 750000,
        status: "Berhasil",
        description: "Angsuran pinjaman bulan Maret",
        transactionDate: new Date("2026-03-12"),
        createdById: admin.id,
      },
      create: {
        transactionCode: "TRX-002",
        memberId: budiProfile.id,
        loanId: loanBudi.id,
        category: TransactionCategory.LOAN,
        type: TransactionType.LOAN_PAYMENT,
        amount: 750000,
        status: "Berhasil",
        description: "Angsuran pinjaman bulan Maret",
        transactionDate: new Date("2026-03-12"),
        createdById: admin.id,
      },
    }),
    prisma.transaction.upsert({
      where: { transactionCode: "TRX-003" },
      update: {
        memberId: budiProfile.id,
        savingsProductId: productByName["Simpanan Sukarela"].id,
        loanId: null,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.VOLUNTARY_SAVING_DEPOSIT,
        amount: 200000,
        status: "Berhasil",
        description: "Setoran sukarela",
        transactionDate: new Date("2026-03-05"),
        createdById: admin.id,
      },
      create: {
        transactionCode: "TRX-003",
        memberId: budiProfile.id,
        savingsProductId: productByName["Simpanan Sukarela"].id,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.VOLUNTARY_SAVING_DEPOSIT,
        amount: 200000,
        status: "Berhasil",
        description: "Setoran sukarela",
        transactionDate: new Date("2026-03-05"),
        createdById: admin.id,
      },
    }),
    prisma.transaction.upsert({
      where: { transactionCode: "TRX-004" },
      update: {
        memberId: sitiProfile.id,
        savingsProductId: productByName["Simpanan Wajib"].id,
        loanId: null,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.MANDATORY_SAVING_DEPOSIT,
        amount: 50000,
        status: "Berhasil",
        description: "Setoran wajib bulanan",
        transactionDate: new Date("2026-04-01"),
        createdById: admin.id,
      },
      create: {
        transactionCode: "TRX-004",
        memberId: sitiProfile.id,
        savingsProductId: productByName["Simpanan Wajib"].id,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.MANDATORY_SAVING_DEPOSIT,
        amount: 50000,
        status: "Berhasil",
        description: "Setoran wajib bulanan",
        transactionDate: new Date("2026-04-01"),
        createdById: admin.id,
      },
    }),
    prisma.transaction.upsert({
      where: { transactionCode: "TRX-005" },
      update: {
        memberId: sitiProfile.id,
        savingsProductId: productByName["Simpanan Sukarela"].id,
        loanId: null,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.VOLUNTARY_SAVING_DEPOSIT,
        amount: 500000,
        status: "Berhasil",
        description: "Setoran sukarela",
        transactionDate: new Date("2026-03-15"),
        createdById: admin.id,
      },
      create: {
        transactionCode: "TRX-005",
        memberId: sitiProfile.id,
        savingsProductId: productByName["Simpanan Sukarela"].id,
        category: TransactionCategory.SAVINGS,
        type: TransactionType.VOLUNTARY_SAVING_DEPOSIT,
        amount: 500000,
        status: "Berhasil",
        description: "Setoran sukarela",
        transactionDate: new Date("2026-03-15"),
        createdById: admin.id,
      },
    }),
  ]);

  await prisma.loanPayment.upsert({
    where: { paymentCode: "PAY-001" },
    update: {
      loanId: loanBudi.id,
      amount: 750000,
      method: PaymentMethod.TRANSFER,
      note: "Pembayaran via transfer",
      proofUrl: null,
      paymentDate: new Date("2026-03-12"),
      recordedById: admin.id,
    },
    create: {
      paymentCode: "PAY-001",
      loanId: loanBudi.id,
      amount: 750000,
      method: PaymentMethod.TRANSFER,
      note: "Pembayaran via transfer",
      paymentDate: new Date("2026-03-12"),
      recordedById: admin.id,
    },
  });

  const annualMeeting = await prisma.announcement.upsert({
    where: { announcementCode: "ANN-001" },
    update: {
      title: "Rapat Anggota Tahunan",
      content: "Rapat Anggota Tahunan akan diadakan pada 20 Mei 2026 di Aula Utama.",
      isActive: true,
      publishedAt: new Date("2026-03-10"),
      createdById: admin.id,
      updatedById: null,
    },
    create: {
      announcementCode: "ANN-001",
      title: "Rapat Anggota Tahunan",
      content: "Rapat Anggota Tahunan akan diadakan pada 20 Mei 2026 di Aula Utama.",
      isActive: true,
      publishedAt: new Date("2026-03-10"),
      createdById: admin.id,
    },
  });

  await prisma.announcement.upsert({
    where: { announcementCode: "ANN-002" },
    update: {
      title: "Perubahan Jam Operasional",
      content: "Selama bulan Ramadhan, jam operasional kantor maju 1 jam.",
      isActive: false,
      publishedAt: new Date("2026-02-15"),
      createdById: admin.id,
      updatedById: null,
    },
    create: {
      announcementCode: "ANN-002",
      title: "Perubahan Jam Operasional",
      content: "Selama bulan Ramadhan, jam operasional kantor maju 1 jam.",
      isActive: false,
      publishedAt: new Date("2026-02-15"),
      createdById: admin.id,
    },
  });

  await Promise.all([
    prisma.notification.upsert({
      where: { notificationCode: "NOTIF-001" },
      update: {
        userId: budi.id,
        type: NotificationType.PAYMENT_POSTED,
        title: "Pembayaran Berhasil",
        message: "Angsuran pinjaman bulan Maret telah diterima.",
        createdAt: new Date("2026-03-12"),
        isRead: true,
        announcementId: null,
        loanApplicationId: null,
        loanId: loanBudi.id,
      },
      create: {
        notificationCode: "NOTIF-001",
        userId: budi.id,
        type: NotificationType.PAYMENT_POSTED,
        title: "Pembayaran Berhasil",
        message: "Angsuran pinjaman bulan Maret telah diterima.",
        createdAt: new Date("2026-03-12"),
        isRead: true,
        loanId: loanBudi.id,
      },
    }),
    prisma.notification.upsert({
      where: { notificationCode: "NOTIF-002-BUDI" },
      update: {
        userId: budi.id,
        type: NotificationType.ANNOUNCEMENT,
        title: annualMeeting.title,
        message: annualMeeting.content,
        createdAt: new Date("2026-03-10"),
        isRead: false,
        announcementId: annualMeeting.id,
        loanApplicationId: null,
        loanId: null,
      },
      create: {
        notificationCode: "NOTIF-002-BUDI",
        userId: budi.id,
        type: NotificationType.ANNOUNCEMENT,
        title: annualMeeting.title,
        message: annualMeeting.content,
        createdAt: new Date("2026-03-10"),
        isRead: false,
        announcementId: annualMeeting.id,
      },
    }),
    prisma.notification.upsert({
      where: { notificationCode: "NOTIF-002-SITI" },
      update: {
        userId: siti.id,
        type: NotificationType.ANNOUNCEMENT,
        title: annualMeeting.title,
        message: annualMeeting.content,
        createdAt: new Date("2026-03-10"),
        isRead: false,
        announcementId: annualMeeting.id,
        loanApplicationId: null,
        loanId: null,
      },
      create: {
        notificationCode: "NOTIF-002-SITI",
        userId: siti.id,
        type: NotificationType.ANNOUNCEMENT,
        title: annualMeeting.title,
        message: annualMeeting.content,
        createdAt: new Date("2026-03-10"),
        isRead: false,
        announcementId: annualMeeting.id,
      },
    }),
    prisma.notification.upsert({
      where: { notificationCode: "NOTIF-003" },
      update: {
        userId: ahmad.id,
        type: NotificationType.LOAN_APPROVED,
        title: "Pinjaman Disetujui",
        message: "Pengajuan pinjaman Anda sebesar Rp10000000 telah disetujui.",
        createdAt: new Date("2026-04-01"),
        isRead: false,
        announcementId: null,
        loanApplicationId: applicationAhmad.id,
        loanId: loanAhmad.id,
      },
      create: {
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
    }),
    prisma.notification.upsert({
      where: { notificationCode: "NOTIF-004" },
      update: {
        userId: joko.id,
        type: NotificationType.SYSTEM,
        title: "Pengingat Pembayaran",
        message: "Terdapat keterlambatan pembayaran pinjaman. Mohon lakukan pembayaran segera.",
        createdAt: new Date("2026-04-03"),
        isRead: false,
        announcementId: null,
        loanApplicationId: null,
        loanId: loanJoko.id,
      },
      create: {
        notificationCode: "NOTIF-004",
        userId: joko.id,
        type: NotificationType.SYSTEM,
        title: "Pengingat Pembayaran",
        message: "Terdapat keterlambatan pembayaran pinjaman. Mohon lakukan pembayaran segera.",
        createdAt: new Date("2026-04-03"),
        isRead: false,
        loanId: loanJoko.id,
      },
    }),
  ]);
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
