import type { Request } from "express";

export type AppRole = "admin" | "member";

export type SessionUser = {
  userId: string;
  role: AppRole;
  name: string;
  phone: string;
};

export type ApiErrorPayload = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiSuccessPayload<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type UserSummary = {
  id: string;
  role: AppRole;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  memberId: string;
};

export type MemberDashboard = {
  user: UserSummary;
  savings: {
    pokok: number;
    wajib: number;
    sukarela: number;
    total: number;
  };
  activeLoan: LoanListItem | null;
  recentTransactions: TransactionItem[];
  notifications: NotificationItem[];
};

export type AdminDashboard = {
  user: UserSummary;
  stats: {
    totalMembers: number;
    totalSavings: number;
    totalLoans: number;
    pendingApplications: number;
    activeLoansCount: number;
    dueToday: number;
  };
  loanApplications: LoanApplicationItem[];
  transactions: TransactionItem[];
};

export type MemberListItem = {
  id: string;
  name: string;
  phone: string;
  status: "Aktif" | "Nonaktif";
  totalSavings: number;
  hasActiveLoan: boolean;
  address?: string | null;
  email?: string | null;
};

export type SavingsProductItem = {
  id: string;
  name: string;
  amount: number;
  isMandatory: boolean;
};

export type LoanProductItem = {
  id: string;
  name: string;
  maxAmount: number;
  interestRate: number;
  adminFeeRate: number;
  maxTenor: number;
};

export type LoanApplicationItem = {
  id: string;
  memberId: string;
  name: string;
  amount: number;
  tenor: number;
  purpose: string;
  date: string;
  status: "Baru" | "Ditinjau" | "Disetujui" | "Ditolak";
  estimatedInstallment: number;
  reviewNote?: string | null;
};

export type LoanListItem = {
  id: string;
  memberId: string;
  name: string;
  amount: number;
  remaining: number;
  installment: number;
  nextDueDate: string;
  tenor: number;
  paidMonths: number;
  status: "Aktif" | "Lancar" | "Menunggak" | "Lunas";
};

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  date: string;
  isActive: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

export type TransactionItem = {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  category: "simpanan" | "pinjaman";
  memberName: string;
  proofUrl?: string | null;
};

export type AdminDataBundle = {
  dashboard: AdminDashboard;
  members: MemberListItem[];
  savingsProducts: SavingsProductItem[];
  loanProducts: LoanProductItem[];
  announcements: AnnouncementItem[];
  loans: LoanListItem[];
};

export type AppServices = {
  auth: {
    login(input: { phone: string; password: string }): Promise<{
      token: string;
      user: UserSummary;
    }>;
  };
  me: {
    getCurrentUser(userId: string): Promise<UserSummary>;
    updateProfile(
      userId: string,
      input: {
        name: string;
        phone: string;
        email?: string | null;
        address?: string | null;
      },
    ): Promise<UserSummary>;
    changePassword(
      userId: string,
      input: {
        currentPassword: string;
        newPassword: string;
      },
    ): Promise<void>;
  };
  member: {
    getDashboard(userId: string): Promise<MemberDashboard>;
    createLoanApplication(
      userId: string,
      input: {
        amount: number;
        tenor: number;
        purpose: string;
        loanProductId?: string;
      },
    ): Promise<LoanApplicationItem>;
  };
  admin: {
    getDashboard(userId: string): Promise<AdminDashboard>;
    listMembers(userId: string): Promise<MemberListItem[]>;
    createMember(
      userId: string,
      input: {
        name: string;
        phone: string;
        password: string;
        status: "Aktif" | "Nonaktif";
        address?: string | null;
        email?: string | null;
      },
    ): Promise<MemberListItem>;
    updateMember(
      userId: string,
      memberId: string,
      input: {
        name: string;
        phone: string;
        status: "Aktif" | "Nonaktif";
        address?: string | null;
        email?: string | null;
      },
    ): Promise<MemberListItem>;
    deleteMember(userId: string, memberId: string): Promise<void>;
    listSavingsProducts(userId: string): Promise<SavingsProductItem[]>;
    createSavingsProduct(
      userId: string,
      input: {
        name: string;
        amount: number;
        isMandatory: boolean;
      },
    ): Promise<SavingsProductItem>;
    updateSavingsProduct(
      userId: string,
      productId: string,
      input: {
        name: string;
        amount: number;
        isMandatory: boolean;
      },
    ): Promise<SavingsProductItem>;
    deleteSavingsProduct(userId: string, productId: string): Promise<void>;
    listLoanProducts(userId: string): Promise<LoanProductItem[]>;
    createLoanProduct(
      userId: string,
      input: {
        name: string;
        maxAmount: number;
        interestRate: number;
        adminFeeRate: number;
        maxTenor: number;
      },
    ): Promise<LoanProductItem>;
    updateLoanProduct(
      userId: string,
      productId: string,
      input: {
        name: string;
        maxAmount: number;
        interestRate: number;
        adminFeeRate: number;
        maxTenor: number;
      },
    ): Promise<LoanProductItem>;
    deleteLoanProduct(userId: string, productId: string): Promise<void>;
    listAnnouncements(userId: string): Promise<AnnouncementItem[]>;
    createAnnouncement(
      userId: string,
      input: {
        title: string;
        content: string;
        isActive: boolean;
      },
    ): Promise<AnnouncementItem>;
    updateAnnouncement(
      userId: string,
      announcementId: string,
      input: {
        title: string;
        content: string;
        isActive: boolean;
      },
    ): Promise<AnnouncementItem>;
    deleteAnnouncement(userId: string, announcementId: string): Promise<void>;
    listLoanApplications(userId: string): Promise<LoanApplicationItem[]>;
    reviewLoanApplication(
      userId: string,
      applicationId: string,
      input: {
        status: "Ditinjau" | "Disetujui" | "Ditolak";
        reviewNote?: string | null;
      },
    ): Promise<LoanApplicationItem>;
    listLoans(userId: string): Promise<LoanListItem[]>;
    recordLoanPayment(
      userId: string,
      loanId: string,
      input: {
        amount: number;
        method: "Transfer" | "Tunai";
        note?: string | null;
      },
    ): Promise<TransactionItem>;
  };
  notifications: {
    list(userId: string): Promise<NotificationItem[]>;
    markRead(userId: string, notificationId: string): Promise<NotificationItem>;
  };
  transactions: {
    list(userId: string, role: AppRole): Promise<TransactionItem[]>;
  };
};

export type AuthenticatedRequest = Request & {
  auth?: SessionUser;
};



