import {
  LoanApplicationStatus,
  LoanStatus,
  MemberStatus,
  NotificationType,
  PaymentMethod,
  Role,
  TransactionCategory,
  TransactionType,
} from "@prisma/client";
import { env } from "./server.config.env.js";
import { prisma as defaultPrisma } from "./server.db.js";
import type {
  AppRole,
  AppServices,
  LoanApplicationItem,
  LoanListItem,
  TransactionItem,
  UserSummary,
} from "./server.types.js";
import {
  AppError,
  addMonths,
  asNumber,
  comparePassword,
  computeInstallment,
  createJwt,
  formatDateOnly,
  hashPassword,
  maybeNull,
  normalizePhone,
} from "./server.utils.js";

type PrismaLike = typeof defaultPrisma;

const ACTIVE_LOAN_STATUSES: LoanStatus[] = [LoanStatus.ACTIVE, LoanStatus.DELINQUENT];
const MEMBER_LOAN_STATUS_FILTER = {
  in: ACTIVE_LOAN_STATUSES,
};

const uniqueCode = (prefix: string) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

const toRole = (role: Role): AppRole => (role === Role.ADMIN ? "admin" : "member");

const toMemberStatusLabel = (status: MemberStatus) =>
  status === MemberStatus.ACTIVE ? "Aktif" : "Nonaktif";

const toLoanApplicationStatusLabel = (
  status: LoanApplicationStatus,
): LoanApplicationItem["status"] => {
  if (status === LoanApplicationStatus.NEW) return "Baru";
  if (status === LoanApplicationStatus.UNDER_REVIEW) return "Ditinjau";
  if (status === LoanApplicationStatus.APPROVED) return "Disetujui";
  return "Ditolak";
};

const toLoanApplicationStatus = (status: "Ditinjau" | "Disetujui" | "Ditolak") => {
  if (status === "Ditinjau") return LoanApplicationStatus.UNDER_REVIEW;
  if (status === "Disetujui") return LoanApplicationStatus.APPROVED;
  return LoanApplicationStatus.REJECTED;
};

const toPaymentMethod = (method: "Transfer" | "Tunai") =>
  method === "Transfer" ? PaymentMethod.TRANSFER : PaymentMethod.CASH;

const toLoanStatusLabel = (
  status: LoanStatus,
  memberFacing = false,
): LoanListItem["status"] => {
  if (status === LoanStatus.DELINQUENT) return "Menunggak";
  if (status === LoanStatus.COMPLETED) return "Lunas";
  return memberFacing ? "Aktif" : "Lancar";
};

const toTransactionLabel = (type: TransactionType) => {
  if (type === TransactionType.MANDATORY_SAVING_DEPOSIT) return "Setoran Wajib";
  if (type === TransactionType.VOLUNTARY_SAVING_DEPOSIT) return "Setoran Sukarela";
  return "Angsuran Pinjaman";
};

const toTransactionCategory = (
  category: TransactionCategory,
): TransactionItem["category"] => (category === TransactionCategory.SAVINGS ? "simpanan" : "pinjaman");

const mapUserSummary = (user: {
  id: string;
  role: Role;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  memberProfile?: {
    memberCode: string;
  } | null;
}): UserSummary => ({
  id: user.id,
  role: toRole(user.role),
  name: user.name,
  phone: user.phone,
  email: user.email,
  address: user.address,
  memberId: user.memberProfile?.memberCode ?? env.ADMIN_CODE,
});

const mapLoanApplication = (item: {
  id: string;
  amount: unknown;
  tenor: number;
  purpose: string;
  createdAt: Date;
  status: LoanApplicationStatus;
  estimatedInstallment: unknown;
  reviewNote: string | null;
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
  status: toLoanApplicationStatusLabel(item.status),
  estimatedInstallment: asNumber(item.estimatedInstallment as never),
  reviewNote: item.reviewNote,
});

const mapLoan = (
  item: {
    id: string;
    principalAmount: unknown;
    remainingAmount: unknown;
    installmentAmount: unknown;
    nextDueDate: Date;
    tenor: number;
    paidMonths: number;
    status: LoanStatus;
    member: {
      memberCode: string;
      user: {
        name: string;
      };
    };
  },
  memberFacing = false,
): LoanListItem => ({
  id: item.id,
  memberId: item.member.memberCode,
  name: item.member.user.name,
  amount: asNumber(item.principalAmount as never),
  remaining: asNumber(item.remainingAmount as never),
  installment: asNumber(item.installmentAmount as never),
  nextDueDate: formatDateOnly(item.nextDueDate),
  tenor: item.tenor,
  paidMonths: item.paidMonths,
  status: toLoanStatusLabel(item.status, memberFacing),
});

const mapNotification = (item: {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}) => ({
  id: item.id,
  title: item.title,
  message: item.message,
  read: item.isRead,
  date: formatDateOnly(item.createdAt),
});

const mapSavingsProduct = (item: {
  id: string;
  name: string;
  defaultAmount: unknown;
  isMandatory: boolean;
}) => ({
  id: item.id,
  name: item.name,
  amount: asNumber(item.defaultAmount as never),
  isMandatory: item.isMandatory,
});

const mapLoanProduct = (item: {
  id: string;
  name: string;
  maxAmount: unknown;
  interestRate: unknown;
  adminFeeRate: unknown;
  maxTenor: number;
}) => ({
  id: item.id,
  name: item.name,
  maxAmount: asNumber(item.maxAmount as never),
  interestRate: asNumber(item.interestRate as never),
  adminFeeRate: asNumber(item.adminFeeRate as never),
  maxTenor: item.maxTenor,
});

const mapAnnouncement = (item: {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  publishedAt: Date;
}) => ({
  id: item.id,
  title: item.title,
  content: item.content,
  date: formatDateOnly(item.publishedAt),
  isActive: item.isActive,
});

const mapTransaction = (item: {
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

const buildSavingsSummary = (
  balances: Array<{
    amount: unknown;
    savingsProduct: {
      name: string;
    };
  }>,
) => {
  const summary = {
    pokok: 0,
    wajib: 0,
    sukarela: 0,
    total: 0,
  };

  for (const balance of balances) {
    const amount = asNumber(balance.amount as never);
    const name = balance.savingsProduct.name.toLowerCase();
    if (name.includes("pokok")) summary.pokok += amount;
    else if (name.includes("wajib")) summary.wajib += amount;
    else summary.sukarela += amount;
    summary.total += amount;
  }

  return summary;
};

const getAdminUser = async (prisma: PrismaLike, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberProfile: true },
  });
  if (!user || user.role !== Role.ADMIN) {
    throw new AppError(403, "FORBIDDEN", "Admin access is required.");
  }
  return user;
};

const getMemberUser = async (prisma: PrismaLike, userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberProfile: true },
  });
  if (!user || user.role !== Role.MEMBER || !user.memberProfile) {
    throw new AppError(404, "MEMBER_NOT_FOUND", "Member account was not found.");
  }
  return {
    ...user,
    memberProfile: user.memberProfile,
  };
};

const nextMemberCode = async (prisma: PrismaLike) => {
  const latest = await prisma.memberProfile.findMany({
    select: { memberCode: true },
    orderBy: { memberCode: "desc" },
    take: 1,
  });

  const latestNumber = latest[0]?.memberCode.match(/(\d+)$/)?.[1];
  const next = (latestNumber ? Number(latestNumber) : 10000) + 1;
  return `KSP-${String(next).padStart(5, "0")}`;
};

export const createServices = (prisma: PrismaLike = defaultPrisma): AppServices => ({
  auth: {
    async login(input) {
      const user = await prisma.user.findUnique({
        where: { phone: normalizePhone(input.phone) },
        include: { memberProfile: true },
      });

      if (!user || !(await comparePassword(input.password, user.passwordHash))) {
        throw new AppError(401, "INVALID_CREDENTIALS", "Invalid phone number or password.");
      }

      const mappedUser = mapUserSummary(user);
      return {
        token: createJwt({
          userId: user.id,
          role: mappedUser.role,
          name: user.name,
          phone: user.phone,
        }),
        user: mappedUser,
      };
    },
  },
  me: {
    async getCurrentUser(userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { memberProfile: true },
      });
      if (!user) throw new AppError(404, "USER_NOT_FOUND", "User was not found.");
      return mapUserSummary(user);
    },
    async updateProfile(userId, input) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: input.name.trim(),
          phone: normalizePhone(input.phone),
          email: maybeNull(input.email),
          address: maybeNull(input.address),
        },
        include: { memberProfile: true },
      });
      return mapUserSummary(user);
    },
    async changePassword(userId, input) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, "USER_NOT_FOUND", "User was not found.");
      if (!(await comparePassword(input.currentPassword, user.passwordHash))) {
        throw new AppError(400, "INVALID_PASSWORD", "Current password is incorrect.");
      }
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await hashPassword(input.newPassword) },
      });
    },
  },
  member: {
    async getDashboard(userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberProfile: {
            include: {
              savingsBalances: { include: { savingsProduct: true } },
              loans: {
                where: { status: MEMBER_LOAN_STATUS_FILTER },
                include: { member: { include: { user: true } } },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
              transactions: {
                include: { member: { include: { user: true } } },
                orderBy: { transactionDate: "desc" },
                take: 20,
              },
            },
          },
          notifications: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
      });

      if (!user || !user.memberProfile) {
        throw new AppError(404, "MEMBER_NOT_FOUND", "Member dashboard is unavailable.");
      }

      return {
        user: mapUserSummary(user),
        savings: buildSavingsSummary(user.memberProfile.savingsBalances),
        activeLoan: user.memberProfile.loans[0] ? mapLoan(user.memberProfile.loans[0], true) : null,
        recentTransactions: user.memberProfile.transactions.map(mapTransaction),
        notifications: user.notifications.map(mapNotification),
      };
    },
    async createLoanApplication(userId, input) {
      const memberUser = await getMemberUser(prisma, userId);
      const activeLoanCount = await prisma.loan.count({
        where: {
          memberId: memberUser.memberProfile.id,
          status: MEMBER_LOAN_STATUS_FILTER,
        },
      });
      if (activeLoanCount > 0) {
        throw new AppError(
          409,
          "ACTIVE_LOAN_EXISTS",
          "This member already has an active loan and cannot submit a new application.",
        );
      }

      const loanProduct =
        (input.loanProductId
          ? await prisma.loanProduct.findFirst({
              where: { id: input.loanProductId, isActive: true },
            })
          : null) ??
        (await prisma.loanProduct.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        }));

      if (!loanProduct) {
        throw new AppError(400, "LOAN_PRODUCT_MISSING", "No active loan product is configured.");
      }
      if (input.amount > asNumber(loanProduct.maxAmount)) {
        throw new AppError(400, "AMOUNT_TOO_HIGH", "Requested amount exceeds the configured loan product limit.");
      }
      if (input.tenor > loanProduct.maxTenor) {
        throw new AppError(400, "TENOR_TOO_HIGH", "Requested tenor exceeds the configured loan product limit.");
      }

      const application = await prisma.loanApplication.create({
        data: {
          applicationCode: uniqueCode("APP-"),
          memberId: memberUser.memberProfile.id,
          loanProductId: loanProduct.id,
          amount: input.amount,
          tenor: input.tenor,
          purpose: input.purpose.trim(),
          estimatedInstallment: computeInstallment(
            input.amount,
            input.tenor,
            asNumber(loanProduct.interestRate),
          ),
        },
        include: {
          member: { include: { user: true } },
        },
      });

      return mapLoanApplication(application);
    },
  },
  admin: {
    async getDashboard(userId) {
      const user = await getAdminUser(prisma, userId);

      const [
        memberCount,
        savingsAggregate,
        loansAggregate,
        pendingApplications,
        activeLoansCount,
        dueToday,
        loanApplications,
        transactions,
      ] = await Promise.all([
        prisma.memberProfile.count(),
        prisma.memberSavingsBalance.aggregate({ _sum: { amount: true } }),
        prisma.loan.aggregate({ _sum: { principalAmount: true } }),
        prisma.loanApplication.count({
          where: {
            status: {
              in: [LoanApplicationStatus.NEW, LoanApplicationStatus.UNDER_REVIEW],
            },
          },
        }),
        prisma.loan.count({
          where: { status: MEMBER_LOAN_STATUS_FILTER },
        }),
        prisma.loan.count({
          where: {
            status: MEMBER_LOAN_STATUS_FILTER,
            nextDueDate: { lte: new Date() },
          },
        }),
        prisma.loanApplication.findMany({
          include: { member: { include: { user: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.transaction.findMany({
          include: { member: { include: { user: true } } },
          orderBy: { transactionDate: "desc" },
          take: 10,
        }),
      ]);

      return {
        user: mapUserSummary(user),
        stats: {
          totalMembers: memberCount,
          totalSavings: asNumber(savingsAggregate._sum.amount as never),
          totalLoans: asNumber(loansAggregate._sum.principalAmount as never),
          pendingApplications,
          activeLoansCount,
          dueToday,
        },
        loanApplications: loanApplications.map(mapLoanApplication),
        transactions: transactions.map(mapTransaction),
      };
    },
    async listMembers(userId) {
      await getAdminUser(prisma, userId);
      const members = await prisma.memberProfile.findMany({
        include: {
          user: true,
          savingsBalances: true,
          loans: {
            where: { status: MEMBER_LOAN_STATUS_FILTER },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return members.map((member) => ({
        id: member.memberCode,
        name: member.user.name,
        phone: member.user.phone,
        status: toMemberStatusLabel(member.status),
        totalSavings: member.savingsBalances.reduce((sum, item) => sum + asNumber(item.amount), 0),
        hasActiveLoan: member.loans.length > 0,
        address: member.user.address,
        email: member.user.email,
      }));
    },
    async createMember(userId, input) {
      await getAdminUser(prisma, userId);
      const savingsProducts = await prisma.savingsProduct.findMany({
        where: { isActive: true },
      });
      const memberCode = await nextMemberCode(prisma);
      const user = await prisma.user.create({
        data: {
          role: Role.MEMBER,
          name: input.name.trim(),
          phone: normalizePhone(input.phone),
          passwordHash: await hashPassword(input.password),
          email: maybeNull(input.email),
          address: maybeNull(input.address),
          memberProfile: {
            create: {
              memberCode,
              status: input.status === "Aktif" ? MemberStatus.ACTIVE : MemberStatus.INACTIVE,
              savingsBalances: {
                create: savingsProducts.map((product) => ({
                  savingsProductId: product.id,
                  amount: 0,
                })),
              },
            },
          },
        },
      });

      return {
        id: memberCode,
        name: user.name,
        phone: user.phone,
        status: input.status,
        totalSavings: 0,
        hasActiveLoan: false,
        address: user.address,
        email: user.email,
      };
    },
    async updateMember(userId, memberId, input) {
      await getAdminUser(prisma, userId);
      const member = await prisma.memberProfile.findUnique({
        where: { memberCode: memberId },
      });
      if (!member) {
        throw new AppError(404, "MEMBER_NOT_FOUND", "Member was not found.");
      }

      const updated = await prisma.user.update({
        where: { id: member.userId },
        data: {
          name: input.name.trim(),
          phone: normalizePhone(input.phone),
          email: maybeNull(input.email),
          address: maybeNull(input.address),
          memberProfile: {
            update: {
              status: input.status === "Aktif" ? MemberStatus.ACTIVE : MemberStatus.INACTIVE,
            },
          },
        },
        include: {
          memberProfile: {
            include: {
              savingsBalances: true,
              loans: {
                where: { status: MEMBER_LOAN_STATUS_FILTER },
                take: 1,
              },
            },
          },
        },
      });

      return {
        id: updated.memberProfile!.memberCode,
        name: updated.name,
        phone: updated.phone,
        status: toMemberStatusLabel(updated.memberProfile!.status),
        totalSavings: updated.memberProfile!.savingsBalances.reduce(
          (sum, item) => sum + asNumber(item.amount),
          0,
        ),
        hasActiveLoan: updated.memberProfile!.loans.length > 0,
        address: updated.address,
        email: updated.email,
      };
    },
    async deleteMember(userId, memberId) {
      await getAdminUser(prisma, userId);
      const member = await prisma.memberProfile.findUnique({
        where: { memberCode: memberId },
      });
      if (!member) {
        throw new AppError(404, "MEMBER_NOT_FOUND", "Member was not found.");
      }

      const [loanCount, applicationCount, transactionCount] = await Promise.all([
        prisma.loan.count({ where: { memberId: member.id } }),
        prisma.loanApplication.count({ where: { memberId: member.id } }),
        prisma.transaction.count({ where: { memberId: member.id } }),
      ]);

      if (loanCount > 0 || applicationCount > 0 || transactionCount > 0) {
        throw new AppError(
          409,
          "MEMBER_HAS_HISTORY",
          "Members with transaction or loan history cannot be deleted. Set them inactive instead.",
        );
      }

      await prisma.user.delete({ where: { id: member.userId } });
    },
    async listSavingsProducts(userId) {
      await getAdminUser(prisma, userId);
      const products = await prisma.savingsProduct.findMany({
        orderBy: { createdAt: "asc" },
      });
      return products.map(mapSavingsProduct);
    },
    async createSavingsProduct(userId, input) {
      await getAdminUser(prisma, userId);
      const product = await prisma.savingsProduct.create({
        data: {
          code: uniqueCode("JS-"),
          name: input.name.trim(),
          defaultAmount: input.amount,
          isMandatory: input.isMandatory,
        },
      });
      return mapSavingsProduct(product);
    },
    async updateSavingsProduct(userId, productId, input) {
      await getAdminUser(prisma, userId);
      const product = await prisma.savingsProduct.update({
        where: { id: productId },
        data: {
          name: input.name.trim(),
          defaultAmount: input.amount,
          isMandatory: input.isMandatory,
        },
      });
      return mapSavingsProduct(product);
    },
    async deleteSavingsProduct(userId, productId) {
      await getAdminUser(prisma, userId);
      const [balanceCount, transactionCount] = await Promise.all([
        prisma.memberSavingsBalance.count({ where: { savingsProductId: productId } }),
        prisma.transaction.count({ where: { savingsProductId: productId } }),
      ]);
      if (balanceCount > 0 || transactionCount > 0) {
        throw new AppError(
          409,
          "PRODUCT_IN_USE",
          "Savings products with balances or transactions cannot be deleted.",
        );
      }
      await prisma.savingsProduct.delete({ where: { id: productId } });
    },
    async listLoanProducts(userId) {
      await getAdminUser(prisma, userId);
      const products = await prisma.loanProduct.findMany({
        orderBy: { createdAt: "asc" },
      });
      return products.map(mapLoanProduct);
    },
    async createLoanProduct(userId, input) {
      await getAdminUser(prisma, userId);
      const product = await prisma.loanProduct.create({
        data: {
          code: uniqueCode("JP-"),
          name: input.name.trim(),
          maxAmount: input.maxAmount,
          interestRate: input.interestRate,
          adminFeeRate: input.adminFeeRate,
          maxTenor: input.maxTenor,
        },
      });
      return mapLoanProduct(product);
    },
    async updateLoanProduct(userId, productId, input) {
      await getAdminUser(prisma, userId);
      const product = await prisma.loanProduct.update({
        where: { id: productId },
        data: {
          name: input.name.trim(),
          maxAmount: input.maxAmount,
          interestRate: input.interestRate,
          adminFeeRate: input.adminFeeRate,
          maxTenor: input.maxTenor,
        },
      });
      return mapLoanProduct(product);
    },
    async deleteLoanProduct(userId, productId) {
      await getAdminUser(prisma, userId);
      const [applicationCount, loanCount] = await Promise.all([
        prisma.loanApplication.count({ where: { loanProductId: productId } }),
        prisma.loan.count({ where: { loanProductId: productId } }),
      ]);
      if (applicationCount > 0 || loanCount > 0) {
        throw new AppError(
          409,
          "PRODUCT_IN_USE",
          "Loan products with applications or loans cannot be deleted.",
        );
      }
      await prisma.loanProduct.delete({ where: { id: productId } });
    },
    async listAnnouncements(userId) {
      await getAdminUser(prisma, userId);
      const items = await prisma.announcement.findMany({
        orderBy: { publishedAt: "desc" },
      });
      return items.map(mapAnnouncement);
    },
    async createAnnouncement(userId, input) {
      await getAdminUser(prisma, userId);
      const announcement = await prisma.$transaction(async (tx) => {
        const created = await tx.announcement.create({
          data: {
            announcementCode: uniqueCode("ANN-"),
            title: input.title.trim(),
            content: input.content.trim(),
            isActive: input.isActive,
            createdById: userId,
          },
        });

        if (input.isActive) {
          const members = await tx.user.findMany({
            where: {
              role: Role.MEMBER,
              memberProfile: { status: MemberStatus.ACTIVE },
            },
            select: { id: true },
          });

          if (members.length > 0) {
            await tx.notification.createMany({
              data: members.map((member) => ({
                notificationCode: uniqueCode("NOTIF-"),
                userId: member.id,
                type: NotificationType.ANNOUNCEMENT,
                title: created.title,
                message: created.content,
                announcementId: created.id,
              })),
            });
          }
        }

        return created;
      });

      return mapAnnouncement(announcement);
    },
    async updateAnnouncement(userId, announcementId, input) {
      await getAdminUser(prisma, userId);
      const current = await prisma.announcement.findUnique({
        where: { id: announcementId },
      });
      if (!current) {
        throw new AppError(404, "ANNOUNCEMENT_NOT_FOUND", "Announcement was not found.");
      }

      const announcement = await prisma.$transaction(async (tx) => {
        const updated = await tx.announcement.update({
          where: { id: announcementId },
          data: {
            title: input.title.trim(),
            content: input.content.trim(),
            isActive: input.isActive,
            updatedById: userId,
            publishedAt: new Date(),
          },
        });

        if (!current.isActive && updated.isActive) {
          const members = await tx.user.findMany({
            where: {
              role: Role.MEMBER,
              memberProfile: { status: MemberStatus.ACTIVE },
            },
            select: { id: true },
          });

          if (members.length > 0) {
            await tx.notification.createMany({
              data: members.map((member) => ({
                notificationCode: uniqueCode("NOTIF-"),
                userId: member.id,
                type: NotificationType.ANNOUNCEMENT,
                title: updated.title,
                message: updated.content,
                announcementId: updated.id,
              })),
            });
          }
        }

        return updated;
      });

      return mapAnnouncement(announcement);
    },
    async deleteAnnouncement(userId, announcementId) {
      await getAdminUser(prisma, userId);
      await prisma.announcement.delete({ where: { id: announcementId } });
    },
    async listLoanApplications(userId) {
      await getAdminUser(prisma, userId);
      const items = await prisma.loanApplication.findMany({
        include: { member: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      });
      return items.map(mapLoanApplication);
    },
    async reviewLoanApplication(userId, applicationId, input) {
      await getAdminUser(prisma, userId);
      const updated = await prisma.$transaction(async (tx) => {
        const application = await tx.loanApplication.findUnique({
          where: { id: applicationId },
          include: {
            member: { include: { user: true } },
            loanProduct: true,
          },
        });

        if (!application) {
          throw new AppError(404, "APPLICATION_NOT_FOUND", "Loan application was not found.");
        }
        if (
          application.status === LoanApplicationStatus.APPROVED ||
          application.status === LoanApplicationStatus.REJECTED
        ) {
          throw new AppError(409, "APPLICATION_FINALIZED", "This application has already been finalized.");
        }

        const nextStatus = toLoanApplicationStatus(input.status);
        const result = await tx.loanApplication.update({
          where: { id: applicationId },
          data: {
            status: nextStatus,
            reviewNote: maybeNull(input.reviewNote),
            reviewedAt: new Date(),
            reviewedById: userId,
          },
          include: { member: { include: { user: true } } },
        });

        if (nextStatus === LoanApplicationStatus.APPROVED) {
          const activeLoanCount = await tx.loan.count({
            where: {
              memberId: application.memberId,
              status: MEMBER_LOAN_STATUS_FILTER,
            },
          });
          if (activeLoanCount > 0) {
            throw new AppError(
              409,
              "ACTIVE_LOAN_EXISTS",
              "This member already has an active loan and cannot receive another one.",
            );
          }

          const loan = await tx.loan.create({
            data: {
              loanCode: uniqueCode("PJ-"),
              memberId: application.memberId,
              loanProductId: application.loanProductId,
              loanApplicationId: application.id,
              principalAmount: application.amount,
              remainingAmount: application.amount,
              installmentAmount: application.estimatedInstallment,
              tenor: application.tenor,
              nextDueDate: addMonths(new Date(), 1),
              status: LoanStatus.ACTIVE,
              approvedById: userId,
            },
          });

          await tx.notification.create({
            data: {
              notificationCode: uniqueCode("NOTIF-"),
              userId: application.member.userId,
              type: NotificationType.LOAN_APPROVED,
              title: "Pinjaman Disetujui",
              message: `Pengajuan pinjaman Anda sebesar Rp${asNumber(application.amount)} telah disetujui.`,
              loanApplicationId: application.id,
              loanId: loan.id,
            },
          });
        }

        return result;
      });

      return mapLoanApplication(updated);
    },
    async listLoans(userId) {
      await getAdminUser(prisma, userId);
      const items = await prisma.loan.findMany({
        include: { member: { include: { user: true } } },
        orderBy: { createdAt: "desc" },
      });
      return items.map((item) => mapLoan(item, false));
    },
    async recordLoanPayment(userId, loanId, input) {
      await getAdminUser(prisma, userId);
      const transaction = await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findUnique({
          where: { id: loanId },
          include: { member: { include: { user: true } } },
        });
        if (!loan) throw new AppError(404, "LOAN_NOT_FOUND", "Loan was not found.");
        if (loan.status === LoanStatus.COMPLETED) {
          throw new AppError(409, "LOAN_COMPLETED", "This loan is already completed.");
        }
        const remaining = asNumber(loan.remainingAmount);
        if (input.amount > remaining) {
          throw new AppError(400, "OVERPAYMENT", "Payment amount cannot exceed the remaining loan balance.");
        }

        const nextRemaining = Math.max(0, remaining - input.amount);
        const nextStatus = nextRemaining === 0 ? LoanStatus.COMPLETED : LoanStatus.ACTIVE;

        await tx.loanPayment.create({
          data: {
            paymentCode: uniqueCode("PAY-"),
            loanId,
            amount: input.amount,
            method: toPaymentMethod(input.method),
            note: maybeNull(input.note),
            recordedById: userId,
          },
        });

        const updatedLoan = await tx.loan.update({
          where: { id: loanId },
          data: {
            remainingAmount: nextRemaining,
            paidMonths: loan.paidMonths + 1,
            nextDueDate:
              nextStatus === LoanStatus.COMPLETED
                ? loan.nextDueDate
                : addMonths(new Date(loan.nextDueDate), 1),
            status: nextStatus,
          },
        });

        const createdTransaction = await tx.transaction.create({
          data: {
            transactionCode: uniqueCode("TRX-"),
            memberId: loan.memberId,
            loanId: loan.id,
            category: TransactionCategory.LOAN,
            type: TransactionType.LOAN_PAYMENT,
            amount: input.amount,
            status: "Berhasil",
            description: input.note?.trim() || "Pembayaran angsuran pinjaman",
            createdById: userId,
          },
          include: { member: { include: { user: true } } },
        });

        await tx.notification.create({
          data: {
            notificationCode: uniqueCode("NOTIF-"),
            userId: loan.member.userId,
            type: NotificationType.PAYMENT_POSTED,
            title: "Pembayaran Berhasil",
            message:
              nextStatus === LoanStatus.COMPLETED
                ? `Pembayaran pinjaman Anda sebesar Rp${input.amount} telah melunasi pinjaman.`
                : `Angsuran pinjaman sebesar Rp${input.amount} telah dicatat. Sisa pinjaman Anda Rp${nextRemaining}.`,
            loanId: updatedLoan.id,
          },
        });

        return createdTransaction;
      });

      return mapTransaction(transaction);
    },
  },
  notifications: {
    async list(userId) {
      const items = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return items.map(mapNotification);
    },
    async markRead(userId, notificationId) {
      const item = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });
      if (!item) {
        throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification was not found.");
      }
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
      return mapNotification(updated);
    },
  },
  transactions: {
    async list(userId, role) {
      if (role === "admin") {
        await getAdminUser(prisma, userId);
        const items = await prisma.transaction.findMany({
          include: { member: { include: { user: true } } },
          orderBy: { transactionDate: "desc" },
        });
        return items.map(mapTransaction);
      }

      const memberUser = await getMemberUser(prisma, userId);
      const items = await prisma.transaction.findMany({
        where: { memberId: memberUser.memberProfile.id },
        include: { member: { include: { user: true } } },
        orderBy: { transactionDate: "desc" },
      });
      return items.map(mapTransaction);
    },
  },
});



