import {
  LoanApplicationStatus,
  LoanStatus,
  MemberStatus,
  PaymentMethod,
  Role,
  TransactionCategory,
  TransactionType,
} from "@prisma/client";
import { prisma as defaultPrisma } from "./server.db.js";
import type {
  ArrearsReport,
  ArrearsReportItem,
  CashflowReport,
  CashflowReportItem,
  DailyTransactionReportItem,
  DailyTransactionsReport,
  InstallmentDueItem,
  InstallmentReport,
  InstallmentReportPayment,
  LoanApplicationItem,
  LoanReport,
  LoanReportItem,
  MemberDetailReport,
  MemberReport,
  MemberReportItem,
  MonthlyRecapReport,
  SavingsReport,
  SummaryReport,
  TransactionItem,
} from "./server.types.js";
import { AppError, asNumber, formatDateOnly } from "./server.utils.js";

type PrismaLike = typeof defaultPrisma;

const ACTIVE_LOAN_STATUSES: LoanStatus[] = [LoanStatus.ACTIVE, LoanStatus.DELINQUENT];

const createDateStart = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const createDateEnd = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
};

const toMonthValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const resolveDateRange = (startDate?: string, endDate?: string) => {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const start = startDate ? createDateStart(startDate) : defaultStart;
  const end = endDate ? createDateEnd(endDate) : defaultEnd;

  return {
    start,
    end,
    label:
      startDate || endDate
        ? `${formatDateOnly(start)} s.d. ${formatDateOnly(end)}`
        : "Bulan ini",
  };
};

const resolveMonthRange = (month?: string) => {
  const now = new Date();
  const [year, monthNumber] = (month ?? toMonthValue(now)).split("-").map(Number);
  const start = new Date(year, monthNumber - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, monthNumber, 0, 23, 59, 59, 999);

  return {
    month: `${year}-${String(monthNumber).padStart(2, "0")}`,
    start,
    end,
  };
};

const getTodayRange = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
  };
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const diffInDays = (date: Date, compareTo = new Date()) => {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const compare = new Date(
    compareTo.getFullYear(),
    compareTo.getMonth(),
    compareTo.getDate(),
  ).getTime();

  return Math.max(0, Math.floor((compare - target) / (1000 * 60 * 60 * 24)));
};

const containsQuery = (...values: Array<string | null | undefined>) => (query?: string) => {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(normalized));
};

const toMemberStatusLabel = (status: MemberStatus): "Aktif" | "Nonaktif" =>
  status === MemberStatus.ACTIVE ? "Aktif" : "Nonaktif";

const toLoanStatusLabel = (status: LoanStatus): "Lancar" | "Menunggak" | "Lunas" => {
  if (status === LoanStatus.DELINQUENT) return "Menunggak";
  if (status === LoanStatus.COMPLETED) return "Lunas";
  return "Lancar";
};

const toPaymentMethodLabel = (method: PaymentMethod): "Transfer" | "Tunai" =>
  method === PaymentMethod.TRANSFER ? "Transfer" : "Tunai";

const toSavingsTypeLabel = (
  type: TransactionType,
  productName?: string | null,
): "Simpanan Pokok" | "Simpanan Wajib" | "Simpanan Sukarela" => {
  const normalizedName = productName?.toLowerCase() ?? "";
  if (normalizedName.includes("pokok")) return "Simpanan Pokok";
  if (normalizedName.includes("wajib")) return "Simpanan Wajib";
  if (normalizedName.includes("sukarela")) return "Simpanan Sukarela";
  return type === TransactionType.MANDATORY_SAVING_DEPOSIT ? "Simpanan Wajib" : "Simpanan Sukarela";
};

const toTransactionLabel = (type: TransactionType) => {
  if (type === TransactionType.MANDATORY_SAVING_DEPOSIT) return "Setoran Wajib";
  if (type === TransactionType.VOLUNTARY_SAVING_DEPOSIT) return "Setoran Sukarela";
  return "Angsuran Pinjaman";
};

const toTransactionCategory = (
  category: TransactionCategory,
): TransactionItem["category"] => (category === TransactionCategory.SAVINGS ? "simpanan" : "pinjaman");

const getAgingBucket = (
  daysOverdue: number,
): ArrearsReportItem["agingBucket"] => {
  if (daysOverdue <= 7) return "1–7 hari";
  if (daysOverdue <= 30) return "8–30 hari";
  return "Lebih dari 30 hari";
};

const mapTransactionItem = (item: {
  id: string;
  type: TransactionType;
  amount: unknown;
  transactionDate: Date;
  status: string;
  category: TransactionCategory;
  proofUrl?: string | null;
  member?: {
    user: {
      name: string;
    };
  };
}): TransactionItem => ({
  id: item.id,
  type: toTransactionLabel(item.type),
  amount: asNumber(item.amount as never),
  date: formatDateOnly(item.transactionDate),
  status: item.status,
  category: toTransactionCategory(item.category),
  memberName: item.member?.user.name ?? "",
  proofUrl: item.proofUrl ?? null,
});

const mapApplicationItem = (item: {
  id: string;
  amount: unknown;
  tenor: number;
  purpose: string;
  createdAt: Date;
  estimatedInstallment: unknown;
  reviewNote: string | null;
  status: LoanApplicationStatus;
  member: {
    memberCode: string;
    user: {
      name: string;
    };
  };
}): LoanApplicationItem => ({
  id: item.id,
  memberId: item.member.memberCode,
  name: item.member.user.name,
  amount: asNumber(item.amount as never),
  tenor: item.tenor,
  purpose: item.purpose,
  date: formatDateOnly(item.createdAt),
  status:
    item.status === "NEW"
      ? "Baru"
      : item.status === "UNDER_REVIEW"
        ? "Ditinjau"
        : item.status === "APPROVED"
          ? "Disetujui"
          : "Ditolak",
  estimatedInstallment: asNumber(item.estimatedInstallment as never),
  reviewNote: item.reviewNote,
});

const getAdminUser = async (prisma: PrismaLike, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user || user.role !== Role.ADMIN) {
    throw new AppError(403, "FORBIDDEN", "Akses admin diperlukan.");
  }
};

const buildCashflowItems = async (prisma: PrismaLike) => {
  const [transactions, loans] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        transactionDate: "desc",
      },
    }),
    prisma.loan.findMany({
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const incomingItems: CashflowReportItem[] = transactions.map((item) => ({
    code: item.transactionCode,
    date: formatDateOnly(item.transactionDate),
    category:
      item.type === TransactionType.LOAN_PAYMENT ? "Angsuran Masuk" : "Simpanan Masuk",
    direction: "Masuk",
    amount: asNumber(item.amount as never),
    memberName: item.member.user.name,
    description: item.description,
  }));

  const outgoingItems: CashflowReportItem[] = loans.map((item) => ({
    code: item.loanCode,
    date: formatDateOnly(item.createdAt),
    category: "Pencairan Pinjaman",
    direction: "Keluar",
    amount: asNumber(item.principalAmount as never),
    memberName: item.member.user.name,
    description: `Pencairan pinjaman ${item.loanCode}`,
  }));

  return [...incomingItems, ...outgoingItems].sort((left, right) =>
    right.date.localeCompare(left.date),
  );
};

const matchesCashflowFilters = (
  item: CashflowReportItem,
  filters: {
    startDate?: string;
    endDate?: string;
    category?: "Semua" | "Simpanan Masuk" | "Angsuran Masuk" | "Pencairan Pinjaman" | "Biaya Operasional";
    direction?: "Semua" | "Masuk" | "Keluar";
  },
) => {
  const afterStart = !filters.startDate || item.date >= filters.startDate;
  const beforeEnd = !filters.endDate || item.date <= filters.endDate;
  const categoryMatches = !filters.category || filters.category === "Semua" || item.category === filters.category;
  const directionMatches = !filters.direction || filters.direction === "Semua" || item.direction === filters.direction;

  return afterStart && beforeEnd && categoryMatches && directionMatches;
};

const buildDelinquencyStatus = (loans: Array<{ status: LoanStatus; nextDueDate: Date }>) => {
  const today = getTodayRange().start;
  const hasDelinquent = loans.some(
    (loan) => loan.status === LoanStatus.DELINQUENT || loan.nextDueDate < today,
  );

  if (hasDelinquent) return "Menunggak" as const;
  if (loans.length > 0) return "Lancar" as const;
  return "Tanpa Pinjaman" as const;
};

export const createAdminReportServices = (prisma: PrismaLike = defaultPrisma) => ({
  async getSummaryReport(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
    },
  ): Promise<SummaryReport> {
    await getAdminUser(prisma, userId);

    const period = resolveDateRange(filters.startDate, filters.endDate);
    const monthRange = resolveMonthRange();
    const today = getTodayRange();

    const [
      activeMembers,
      inactiveMembers,
      savingsAggregate,
      activeLoansAggregate,
      totalTransactionAggregate,
      totalLoansDisbursedAggregate,
      installmentsTodayAggregate,
      loansDisbursedThisMonthAggregate,
      savingsInThisMonthAggregate,
      pendingApplications,
      dueToday,
      delinquentLoans,
      arrearsLoans,
      recentTransactions,
      latestApplications,
    ] = await Promise.all([
      prisma.memberProfile.count({
        where: { status: MemberStatus.ACTIVE },
      }),
      prisma.memberProfile.count({
        where: { status: MemberStatus.INACTIVE },
      }),
      prisma.memberSavingsBalance.aggregate({
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        where: { status: { in: ACTIVE_LOAN_STATUSES } },
        _sum: { remainingAmount: true },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        _sum: { principalAmount: true },
      }),
      prisma.loanPayment.aggregate({
        where: {
          paymentDate: {
            gte: today.start,
            lte: today.end,
          },
        },
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        where: {
          createdAt: {
            gte: monthRange.start,
            lte: monthRange.end,
          },
        },
        _sum: { principalAmount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          category: TransactionCategory.SAVINGS,
          transactionDate: {
            gte: monthRange.start,
            lte: monthRange.end,
          },
        },
        _sum: { amount: true },
      }),
      prisma.loanApplication.count({
        where: {
          status: {
            in: [LoanApplicationStatus.NEW, LoanApplicationStatus.UNDER_REVIEW],
          },
        },
      }),
      prisma.loan.count({
        where: {
          status: { in: ACTIVE_LOAN_STATUSES },
          nextDueDate: {
            gte: today.start,
            lte: today.end,
          },
        },
      }),
      prisma.loan.count({
        where: {
          OR: [
            { status: LoanStatus.DELINQUENT },
            {
              status: LoanStatus.ACTIVE,
              nextDueDate: {
                lt: today.start,
              },
            },
          ],
        },
      }),
      prisma.loan.findMany({
        where: {
          OR: [
            { status: LoanStatus.DELINQUENT },
            {
              status: LoanStatus.ACTIVE,
              nextDueDate: {
                lt: today.start,
              },
            },
          ],
        },
        select: {
          installmentAmount: true,
        },
      }),
      prisma.transaction.findMany({
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          transactionDate: "desc",
        },
        take: 5,
      }),
      prisma.loanApplication.findMany({
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    return {
      period: {
        startDate: formatDateOnly(period.start),
        endDate: formatDateOnly(period.end),
        label: period.label,
      },
      metrics: {
        totalActiveMembers: activeMembers,
        totalSavings: asNumber(savingsAggregate._sum.amount as never),
        totalActiveLoans: asNumber(activeLoansAggregate._sum.remainingAmount as never),
        totalInstallmentsToday: asNumber(installmentsTodayAggregate._sum.amount as never),
        totalArrears: arrearsLoans.reduce(
          (sum, loan) => sum + asNumber(loan.installmentAmount as never),
          0,
        ),
        cashBalance:
          asNumber(totalTransactionAggregate._sum.amount as never) -
          asNumber(totalLoansDisbursedAggregate._sum.principalAmount as never),
        loansDisbursedThisMonth: asNumber(
          loansDisbursedThisMonthAggregate._sum.principalAmount as never,
        ),
        savingsInThisMonth: asNumber(savingsInThisMonthAggregate._sum.amount as never),
      },
      quickStats: {
        pendingApplications,
        dueToday,
        delinquentLoans,
        inactiveMembers,
      },
      recentTransactions: recentTransactions.map(mapTransactionItem),
      latestApplications: latestApplications.map((item) =>
        mapApplicationItem({
          ...item,
          status: item.status,
        }),
      ),
    };
  },

  async getMembersReport(
    userId: string,
    filters: {
      query?: string;
      status?: "Semua" | "Aktif" | "Nonaktif";
      joinedFrom?: string;
      joinedTo?: string;
      loanStatus?: "Semua" | "Ada Pinjaman" | "Tanpa Pinjaman";
      delinquencyStatus?: "Semua" | "Lancar" | "Menunggak" | "Tanpa Pinjaman";
    },
  ): Promise<MemberReport> {
    await getAdminUser(prisma, userId);

    const members = await prisma.memberProfile.findMany({
      where: {
        ...(filters.status && filters.status !== "Semua"
          ? {
              status:
                filters.status === "Aktif" ? MemberStatus.ACTIVE : MemberStatus.INACTIVE,
            }
          : {}),
        ...(filters.joinedFrom || filters.joinedTo
          ? {
              createdAt: {
                ...(filters.joinedFrom ? { gte: createDateStart(filters.joinedFrom) } : {}),
                ...(filters.joinedTo ? { lte: createDateEnd(filters.joinedTo) } : {}),
              },
            }
          : {}),
        ...(filters.query
          ? {
              OR: [
                {
                  memberCode: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
                {
                  user: {
                    name: {
                      contains: filters.query,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  user: {
                    phone: {
                      contains: filters.query,
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        user: true,
        savingsBalances: true,
        loans: {
          where: {
            status: {
              in: ACTIVE_LOAN_STATUSES,
            },
          },
          select: {
            status: true,
            nextDueDate: true,
            remainingAmount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const items = members
      .map<MemberReportItem>((member) => {
        const totalSavings = member.savingsBalances.reduce(
          (sum, item) => sum + asNumber(item.amount as never),
          0,
        );
        const activeLoanAmount = member.loans.reduce(
          (sum, loan) => sum + asNumber(loan.remainingAmount as never),
          0,
        );
        const delinquencyStatus = buildDelinquencyStatus(member.loans);

        return {
          memberCode: member.memberCode,
          name: member.user.name,
          phone: member.user.phone,
          joinedDate: formatDateOnly(member.createdAt),
          status: toMemberStatusLabel(member.status),
          totalSavings,
          activeLoanCount: member.loans.length,
          activeLoanAmount,
          delinquencyStatus,
        };
      })
      .filter((item) => {
        const loanStatusMatches =
          !filters.loanStatus ||
          filters.loanStatus === "Semua" ||
          (filters.loanStatus === "Ada Pinjaman" ? item.activeLoanCount > 0 : item.activeLoanCount === 0);
        const delinquencyMatches =
          !filters.delinquencyStatus ||
          filters.delinquencyStatus === "Semua" ||
          item.delinquencyStatus === filters.delinquencyStatus;

        return loanStatusMatches && delinquencyMatches;
      });

    return {
      summary: {
        totalMembers: items.length,
        activeMembers: items.filter((item) => item.status === "Aktif").length,
        inactiveMembers: items.filter((item) => item.status === "Nonaktif").length,
        membersWithActiveLoans: items.filter((item) => item.activeLoanCount > 0).length,
        membersInArrears: items.filter((item) => item.delinquencyStatus === "Menunggak").length,
      },
      items,
    };
  },

  async getSavingsReport(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      memberCode?: string;
      savingsType?: "Semua" | "Simpanan Pokok" | "Simpanan Wajib" | "Simpanan Sukarela";
    },
  ): Promise<SavingsReport> {
    await getAdminUser(prisma, userId);

    const period = resolveDateRange(filters.startDate, filters.endDate);

    const [transactions, members] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          category: TransactionCategory.SAVINGS,
          transactionDate: {
            gte: period.start,
            lte: period.end,
          },
          ...(filters.memberCode
            ? {
                member: {
                  memberCode: filters.memberCode,
                },
              }
            : {}),
        },
        include: {
          member: {
            include: {
              user: true,
            },
          },
          savingsProduct: true,
        },
        orderBy: {
          transactionDate: "desc",
        },
      }),
      prisma.memberProfile.findMany({
        where: {
          ...(filters.memberCode ? { memberCode: filters.memberCode } : {}),
        },
        include: {
          user: true,
          savingsBalances: {
            include: {
              savingsProduct: true,
            },
          },
        },
        orderBy: {
          memberCode: "asc",
        },
      }),
    ]);

    const filteredTransactions = transactions
      .map((item) => ({
        id: item.id,
        transactionCode: item.transactionCode,
        date: formatDateOnly(item.transactionDate),
        memberCode: item.member.memberCode,
        memberName: item.member.user.name,
        savingsType: toSavingsTypeLabel(item.type, item.savingsProduct?.name),
        amount: asNumber(item.amount as never),
        status: item.status,
      }))
      .filter((item) =>
        !filters.savingsType || filters.savingsType === "Semua"
          ? true
          : item.savingsType === filters.savingsType,
      );

    const memberTotals = members.map((member) => {
      const breakdown = {
        pokok: 0,
        wajib: 0,
        sukarela: 0,
        total: 0,
      };

      for (const balance of member.savingsBalances) {
        const amount = asNumber(balance.amount as never);
        const name = balance.savingsProduct.name.toLowerCase();
        if (name.includes("pokok")) breakdown.pokok += amount;
        else if (name.includes("wajib")) breakdown.wajib += amount;
        else breakdown.sukarela += amount;
        breakdown.total += amount;
      }

      return {
        memberCode: member.memberCode,
        memberName: member.user.name,
        ...breakdown,
      };
    });

    return {
      summary: {
        periodTotal: filteredTransactions.reduce((sum, item) => sum + item.amount, 0),
        totalPokok: memberTotals.reduce((sum, item) => sum + item.pokok, 0),
        totalWajib: memberTotals.reduce((sum, item) => sum + item.wajib, 0),
        totalSukarela: memberTotals.reduce((sum, item) => sum + item.sukarela, 0),
        transactionCount: filteredTransactions.length,
      },
      transactions: filteredTransactions,
      memberTotals,
    };
  },

  async getLoansReport(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      query?: string;
      status?: "Semua" | "Lancar" | "Menunggak" | "Lunas";
    },
  ): Promise<LoanReport> {
    await getAdminUser(prisma, userId);

    const period = resolveDateRange(filters.startDate, filters.endDate);

    const loans = await prisma.loan.findMany({
      where: {
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
        ...(filters.query
          ? {
              OR: [
                {
                  loanCode: {
                    contains: filters.query,
                    mode: "insensitive",
                  },
                },
                {
                  member: {
                    memberCode: {
                      contains: filters.query,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  member: {
                    user: {
                      name: {
                        contains: filters.query,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const items = loans
      .map<LoanReportItem>((loan) => ({
        loanId: loan.id,
        loanCode: loan.loanCode,
        memberCode: loan.member.memberCode,
        memberName: loan.member.user.name,
        dateDisbursed: formatDateOnly(loan.createdAt),
        principalAmount: asNumber(loan.principalAmount as never),
        remainingAmount: asNumber(loan.remainingAmount as never),
        installmentAmount: asNumber(loan.installmentAmount as never),
        tenor: loan.tenor,
        paidMonths: loan.paidMonths,
        status: toLoanStatusLabel(loan.status),
      }))
      .filter((item) =>
        !filters.status || filters.status === "Semua" ? true : item.status === filters.status,
      );

    return {
      summary: {
        activeCount: items.filter((item) => item.status !== "Lunas").length,
        completedCount: items.filter((item) => item.status === "Lunas").length,
        disbursedTotal: items.reduce((sum, item) => sum + item.principalAmount, 0),
        remainingTotal: items.reduce((sum, item) => sum + item.remainingAmount, 0),
        delinquentCount: items.filter((item) => item.status === "Menunggak").length,
      },
      items,
    };
  },

  async getInstallmentsReport(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      query?: string;
      loanCode?: string;
      status?: "Semua" | "Berhasil" | "Jatuh Tempo" | "Menunggak";
    },
  ): Promise<InstallmentReport> {
    await getAdminUser(prisma, userId);

    const period = resolveDateRange(filters.startDate, filters.endDate);
    const today = getTodayRange();
    const dueSoonEnd = addDays(today.end, 7);
    const currentMonth = resolveMonthRange();

    const [payments, loans, paymentsTodayAggregate, paymentsThisMonthAggregate] = await Promise.all([
      prisma.loanPayment.findMany({
        where: {
          paymentDate: {
            gte: period.start,
            lte: period.end,
          },
          ...(filters.loanCode
            ? {
                loan: {
                  loanCode: filters.loanCode,
                },
              }
            : {}),
        },
        include: {
          loan: {
            include: {
              member: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          paymentDate: "desc",
        },
      }),
      prisma.loan.findMany({
        where: {
          status: {
            in: ACTIVE_LOAN_STATUSES,
          },
          ...(filters.loanCode
            ? {
                loanCode: filters.loanCode,
              }
            : {}),
        },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          nextDueDate: "asc",
        },
      }),
      prisma.loanPayment.aggregate({
        where: {
          paymentDate: {
            gte: today.start,
            lte: today.end,
          },
        },
        _sum: { amount: true },
      }),
      prisma.loanPayment.aggregate({
        where: {
          paymentDate: {
            gte: currentMonth.start,
            lte: currentMonth.end,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const filteredPayments = payments
      .map<InstallmentReportPayment>((payment) => ({
        paymentId: payment.id,
        paymentCode: payment.paymentCode,
        loanCode: payment.loan.loanCode,
        memberCode: payment.loan.member.memberCode,
        memberName: payment.loan.member.user.name,
        paymentDate: formatDateOnly(payment.paymentDate),
        amount: asNumber(payment.amount as never),
        method: toPaymentMethodLabel(payment.method),
        status: "Berhasil",
        note: payment.note,
      }))
      .filter((item) => {
        const queryMatches = containsQuery(item.loanCode, item.memberCode, item.memberName)(
          filters.query,
        );
        const statusMatches =
          !filters.status || filters.status === "Semua" || filters.status === "Berhasil";
        return queryMatches && statusMatches;
      });

    const dueItems = loans
      .map<InstallmentDueItem>((loan) => {
        const nextDueDate = formatDateOnly(loan.nextDueDate);
        const status =
          loan.status === LoanStatus.DELINQUENT || loan.nextDueDate < today.start
            ? "Menunggak"
            : loan.nextDueDate <= dueSoonEnd
              ? "Jatuh Tempo"
              : "Lancar";

        return {
          loanId: loan.id,
          loanCode: loan.loanCode,
          memberCode: loan.member.memberCode,
          memberName: loan.member.user.name,
          nextDueDate,
          installmentAmount: asNumber(loan.installmentAmount as never),
          status,
        };
      })
      .filter((item) => {
        const queryMatches = containsQuery(item.loanCode, item.memberCode, item.memberName)(
          filters.query,
        );
        const statusMatches =
          !filters.status ||
          filters.status === "Semua" ||
          item.status === filters.status ||
          (filters.status === "Berhasil" ? item.status === "Lancar" : false);
        return queryMatches && statusMatches;
      });

    return {
      summary: {
        paymentsToday: asNumber(paymentsTodayAggregate._sum.amount as never),
        paymentsThisMonth: asNumber(paymentsThisMonthAggregate._sum.amount as never),
        paymentCount: filteredPayments.length,
        dueSoonCount: dueItems.filter((item) => item.status !== "Lancar").length,
      },
      payments: filteredPayments,
      dueItems,
    };
  },

  async getArrearsReport(
    userId: string,
    filters: {
      query?: string;
      agingBucket?: "Semua" | "1–7 hari" | "8–30 hari" | "Lebih dari 30 hari";
    },
  ): Promise<ArrearsReport> {
    await getAdminUser(prisma, userId);

    const today = getTodayRange().start;
    const loans = await prisma.loan.findMany({
      where: {
        OR: [
          { status: LoanStatus.DELINQUENT },
          {
            status: LoanStatus.ACTIVE,
            nextDueDate: {
              lt: today,
            },
          },
        ],
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        nextDueDate: "asc",
      },
    });

    const items = loans
      .map<ArrearsReportItem>((loan) => {
        const daysOverdue = Math.max(1, diffInDays(loan.nextDueDate));
        return {
          loanId: loan.id,
          loanCode: loan.loanCode,
          memberCode: loan.member.memberCode,
          memberName: loan.member.user.name,
          nextDueDate: formatDateOnly(loan.nextDueDate),
          daysOverdue,
          agingBucket: getAgingBucket(daysOverdue),
          amountDue: asNumber(loan.installmentAmount as never),
          remainingAmount: asNumber(loan.remainingAmount as never),
          status: "Menunggak",
        };
      })
      .filter((item) => {
        const queryMatches = containsQuery(item.loanCode, item.memberCode, item.memberName)(
          filters.query,
        );
        const bucketMatches =
          !filters.agingBucket ||
          filters.agingBucket === "Semua" ||
          item.agingBucket === filters.agingBucket;
        return queryMatches && bucketMatches;
      });

    return {
      summary: {
        totalLoans: items.length,
        totalMembers: new Set(items.map((item) => item.memberCode)).size,
        totalAmountDue: items.reduce((sum, item) => sum + item.amountDue, 0),
        bucket1To7: items.filter((item) => item.agingBucket === "1–7 hari").length,
        bucket8To30: items.filter((item) => item.agingBucket === "8–30 hari").length,
        bucketAbove30: items.filter((item) => item.agingBucket === "Lebih dari 30 hari").length,
      },
      items,
    };
  },

  async getCashflowReport(
    userId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      category?: "Semua" | "Simpanan Masuk" | "Angsuran Masuk" | "Pencairan Pinjaman" | "Biaya Operasional";
      direction?: "Semua" | "Masuk" | "Keluar";
    },
  ): Promise<CashflowReport> {
    await getAdminUser(prisma, userId);

    const period = resolveDateRange(filters.startDate, filters.endDate);
    const allItems = await buildCashflowItems(prisma);
    const periodFilters = {
      ...filters,
      startDate: formatDateOnly(period.start),
      endDate: formatDateOnly(period.end),
    };
    const items = allItems.filter((item) => matchesCashflowFilters(item, periodFilters));
    const previousItems = allItems.filter((item) => {
      const beforeStart = item.date < formatDateOnly(period.start);
      const categoryMatches =
        !filters.category || filters.category === "Semua" || item.category === filters.category;
      const directionMatches =
        !filters.direction || filters.direction === "Semua" || item.direction === filters.direction;
      return beforeStart && categoryMatches && directionMatches;
    });

    const openingBalance = previousItems.reduce(
      (sum, item) => sum + (item.direction === "Masuk" ? item.amount : -item.amount),
      0,
    );
    const cashIn = items
      .filter((item) => item.direction === "Masuk")
      .reduce((sum, item) => sum + item.amount, 0);
    const cashOut = items
      .filter((item) => item.direction === "Keluar")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      summary: {
        openingBalance,
        cashIn,
        cashOut,
        closingBalance: openingBalance + cashIn - cashOut,
      },
      items,
    };
  },

  async getDailyTransactionsReport(
    userId: string,
    filters: {
      date?: string;
    },
  ): Promise<DailyTransactionsReport> {
    await getAdminUser(prisma, userId);

    const selectedDate = filters.date ? createDateStart(filters.date) : getTodayRange().start;
    const selectedStart = createDateStart(formatDateOnly(selectedDate));
    const selectedEnd = createDateEnd(formatDateOnly(selectedDate));

    const [savingsTransactions, loanPayments, disbursedLoans] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          category: TransactionCategory.SAVINGS,
          transactionDate: {
            gte: selectedStart,
            lte: selectedEnd,
          },
        },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          transactionDate: "desc",
        },
      }),
      prisma.loanPayment.findMany({
        where: {
          paymentDate: {
            gte: selectedStart,
            lte: selectedEnd,
          },
        },
        include: {
          loan: {
            include: {
              member: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: {
          paymentDate: "desc",
        },
      }),
      prisma.loan.findMany({
        where: {
          createdAt: {
            gte: selectedStart,
            lte: selectedEnd,
          },
        },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const items = [
      ...savingsTransactions.map<DailyTransactionReportItem>((item) => ({
        code: item.transactionCode,
        timeLabel: new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(item.transactionDate),
        type: toTransactionLabel(item.type),
        memberName: item.member.user.name,
        amount: asNumber(item.amount as never),
        direction: "Masuk",
        status: item.status,
      })),
      ...loanPayments.map<DailyTransactionReportItem>((item) => ({
        code: item.paymentCode,
        timeLabel: new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(item.paymentDate),
        type: "Pembayaran Angsuran",
        memberName: item.loan.member.user.name,
        amount: asNumber(item.amount as never),
        direction: "Masuk",
        status: "Berhasil",
      })),
      ...disbursedLoans.map<DailyTransactionReportItem>((item) => ({
        code: item.loanCode,
        timeLabel: new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(item.createdAt),
        type: "Pencairan Pinjaman",
        memberName: item.member.user.name,
        amount: asNumber(item.principalAmount as never),
        direction: "Keluar",
        status: "Berhasil",
      })),
    ].sort((left, right) => right.timeLabel.localeCompare(left.timeLabel));

    const savingsIn = savingsTransactions.reduce(
      (sum, item) => sum + asNumber(item.amount as never),
      0,
    );
    const installmentsPaid = loanPayments.reduce(
      (sum, item) => sum + asNumber(item.amount as never),
      0,
    );
    const loansDisbursed = disbursedLoans.reduce(
      (sum, item) => sum + asNumber(item.principalAmount as never),
      0,
    );

    return {
      date: formatDateOnly(selectedDate),
      summary: {
        savingsIn,
        loansDisbursed,
        installmentsPaid,
        cashIn: savingsIn + installmentsPaid,
        cashOut: loansDisbursed,
        transactionCount: items.length,
      },
      items,
    };
  },

  async getMonthlyRecapReport(
    userId: string,
    filters: {
      month?: string;
    },
  ): Promise<MonthlyRecapReport> {
    await getAdminUser(prisma, userId);

    const period = resolveMonthRange(filters.month);

    const [
      savingsAggregate,
      loansAggregate,
      installmentsAggregate,
      newMembers,
      arrearsLoans,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          category: TransactionCategory.SAVINGS,
          transactionDate: {
            gte: period.start,
            lte: period.end,
          },
        },
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        where: {
          createdAt: {
            gte: period.start,
            lte: period.end,
          },
        },
        _sum: { principalAmount: true },
      }),
      prisma.loanPayment.aggregate({
        where: {
          paymentDate: {
            gte: period.start,
            lte: period.end,
          },
        },
        _sum: { amount: true },
      }),
      prisma.memberProfile.count({
        where: {
          createdAt: {
            gte: period.start,
            lte: period.end,
          },
        },
      }),
      prisma.loan.findMany({
        where: {
          OR: [
            { status: LoanStatus.DELINQUENT },
            {
              status: LoanStatus.ACTIVE,
              nextDueDate: {
                lt: period.end,
              },
            },
          ],
        },
        select: {
          installmentAmount: true,
        },
      }),
    ]);

    const totalSavings = asNumber(savingsAggregate._sum.amount as never);
    const totalLoansDisbursed = asNumber(loansAggregate._sum.principalAmount as never);
    const totalInstallments = asNumber(installmentsAggregate._sum.amount as never);

    return {
      month: period.month,
      summary: {
        totalSavings,
        totalLoansDisbursed,
        totalInstallments,
        totalArrears: arrearsLoans.reduce(
          (sum, loan) => sum + asNumber(loan.installmentAmount as never),
          0,
        ),
        cashIn: totalSavings + totalInstallments,
        cashOut: totalLoansDisbursed,
        newMembers,
      },
    };
  },

  async getMemberDetailReport(
    userId: string,
    memberCode: string,
  ): Promise<MemberDetailReport> {
    await getAdminUser(prisma, userId);

    const member = await prisma.memberProfile.findUnique({
      where: {
        memberCode,
      },
      include: {
        user: true,
        savingsBalances: {
          include: {
            savingsProduct: true,
          },
        },
        loans: {
          include: {
            payments: {
              orderBy: {
                paymentDate: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        transactions: {
          include: {
            member: {
              include: {
                user: true,
              },
            },
          },
          orderBy: {
            transactionDate: "desc",
          },
          take: 20,
        },
      },
    });

    if (!member) {
      throw new AppError(404, "MEMBER_NOT_FOUND", "Data anggota tidak ditemukan.");
    }

    const savingsBreakdown = {
      pokok: 0,
      wajib: 0,
      sukarela: 0,
      total: 0,
    };

    for (const balance of member.savingsBalances) {
      const amount = asNumber(balance.amount as never);
      const name = balance.savingsProduct.name.toLowerCase();
      if (name.includes("pokok")) savingsBreakdown.pokok += amount;
      else if (name.includes("wajib")) savingsBreakdown.wajib += amount;
      else savingsBreakdown.sukarela += amount;
      savingsBreakdown.total += amount;
    }

    const activeLoans = member.loans.filter((loan) =>
      ACTIVE_LOAN_STATUSES.includes(loan.status),
    );

    const activeLoanItems: LoanReportItem[] = activeLoans.map((loan) => ({
      loanId: loan.id,
      loanCode: loan.loanCode,
      memberCode: member.memberCode,
      memberName: member.user.name,
      dateDisbursed: formatDateOnly(loan.createdAt),
      principalAmount: asNumber(loan.principalAmount as never),
      remainingAmount: asNumber(loan.remainingAmount as never),
      installmentAmount: asNumber(loan.installmentAmount as never),
      tenor: loan.tenor,
      paidMonths: loan.paidMonths,
      status: toLoanStatusLabel(loan.status),
    }));

    const paymentHistory = member.loans
      .flatMap((loan) =>
        loan.payments.map<InstallmentReportPayment>((payment) => ({
          paymentId: payment.id,
          paymentCode: payment.paymentCode,
          loanCode: loan.loanCode,
          memberCode: member.memberCode,
          memberName: member.user.name,
          paymentDate: formatDateOnly(payment.paymentDate),
          amount: asNumber(payment.amount as never),
          method: toPaymentMethodLabel(payment.method),
          status: "Berhasil",
          note: payment.note,
        })),
      )
      .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate));

    return {
      member: {
        memberCode: member.memberCode,
        name: member.user.name,
        phone: member.user.phone,
        status: toMemberStatusLabel(member.status),
        joinedDate: formatDateOnly(member.createdAt),
        email: member.user.email,
        address: member.user.address,
      },
      summary: {
        totalSavings: savingsBreakdown.total,
        totalLoans: member.loans.reduce(
          (sum, loan) => sum + asNumber(loan.principalAmount as never),
          0,
        ),
        activeLoanCount: activeLoanItems.length,
        activeLoanAmount: activeLoanItems.reduce(
          (sum, loan) => sum + loan.principalAmount,
          0,
        ),
        remainingLoan: activeLoanItems.reduce(
          (sum, loan) => sum + loan.remainingAmount,
          0,
        ),
        delinquencyStatus: buildDelinquencyStatus(
          activeLoans.map((loan) => ({
            status: loan.status,
            nextDueDate: loan.nextDueDate,
          })),
        ),
      },
      savingsBreakdown,
      activeLoans: activeLoanItems,
      paymentHistory,
      recentTransactions: member.transactions.map(mapTransactionItem),
    };
  },
});
