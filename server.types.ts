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

export type ReportPeriod = {
  startDate: string;
  endDate: string;
  label: string;
};

export type SummaryReport = {
  period: ReportPeriod;
  metrics: {
    totalActiveMembers: number;
    totalSavings: number;
    totalActiveLoans: number;
    totalInstallmentsToday: number;
    totalArrears: number;
    cashBalance: number;
    loansDisbursedThisMonth: number;
    savingsInThisMonth: number;
  };
  quickStats: {
    pendingApplications: number;
    dueToday: number;
    delinquentLoans: number;
    inactiveMembers: number;
  };
  recentTransactions: TransactionItem[];
  latestApplications: LoanApplicationItem[];
};

export type MemberReportItem = {
  memberCode: string;
  name: string;
  phone: string;
  joinedDate: string;
  status: "Aktif" | "Nonaktif";
  totalSavings: number;
  activeLoanCount: number;
  activeLoanAmount: number;
  delinquencyStatus: "Lancar" | "Menunggak" | "Tanpa Pinjaman";
};

export type MemberReport = {
  summary: {
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    membersWithActiveLoans: number;
    membersInArrears: number;
  };
  items: MemberReportItem[];
};

export type SavingsReportTransaction = {
  id: string;
  transactionCode: string;
  date: string;
  memberCode: string;
  memberName: string;
  savingsType: "Simpanan Pokok" | "Simpanan Wajib" | "Simpanan Sukarela";
  amount: number;
  status: string;
};

export type SavingsReportMemberItem = {
  memberCode: string;
  memberName: string;
  pokok: number;
  wajib: number;
  sukarela: number;
  total: number;
};

export type SavingsReport = {
  summary: {
    periodTotal: number;
    totalPokok: number;
    totalWajib: number;
    totalSukarela: number;
    transactionCount: number;
  };
  transactions: SavingsReportTransaction[];
  memberTotals: SavingsReportMemberItem[];
};

export type LoanReportItem = {
  loanId: string;
  loanCode: string;
  memberCode: string;
  memberName: string;
  dateDisbursed: string;
  principalAmount: number;
  remainingAmount: number;
  installmentAmount: number;
  tenor: number;
  paidMonths: number;
  status: "Lancar" | "Menunggak" | "Lunas";
};

export type LoanReport = {
  summary: {
    activeCount: number;
    completedCount: number;
    disbursedTotal: number;
    remainingTotal: number;
    delinquentCount: number;
  };
  items: LoanReportItem[];
};

export type InstallmentReportPayment = {
  paymentId: string;
  paymentCode: string;
  loanCode: string;
  memberCode: string;
  memberName: string;
  paymentDate: string;
  amount: number;
  method: "Transfer" | "Tunai";
  status: "Berhasil";
  note?: string | null;
};

export type InstallmentDueItem = {
  loanId: string;
  loanCode: string;
  memberCode: string;
  memberName: string;
  nextDueDate: string;
  installmentAmount: number;
  status: "Lancar" | "Jatuh Tempo" | "Menunggak";
};

export type InstallmentReport = {
  summary: {
    paymentsToday: number;
    paymentsThisMonth: number;
    paymentCount: number;
    dueSoonCount: number;
  };
  payments: InstallmentReportPayment[];
  dueItems: InstallmentDueItem[];
};

export type ArrearsReportItem = {
  loanId: string;
  loanCode: string;
  memberCode: string;
  memberName: string;
  nextDueDate: string;
  daysOverdue: number;
  agingBucket: "1–7 hari" | "8–30 hari" | "Lebih dari 30 hari";
  amountDue: number;
  remainingAmount: number;
  status: "Menunggak";
};

export type ArrearsReport = {
  summary: {
    totalLoans: number;
    totalMembers: number;
    totalAmountDue: number;
    bucket1To7: number;
    bucket8To30: number;
    bucketAbove30: number;
  };
  items: ArrearsReportItem[];
};

export type CashflowReportItem = {
  code: string;
  date: string;
  category: "Simpanan Masuk" | "Angsuran Masuk" | "Pencairan Pinjaman" | "Biaya Operasional";
  direction: "Masuk" | "Keluar";
  amount: number;
  memberName: string | null;
  description: string;
};

export type CashflowReport = {
  summary: {
    openingBalance: number;
    cashIn: number;
    cashOut: number;
    closingBalance: number;
  };
  items: CashflowReportItem[];
};

export type DailyTransactionReportItem = {
  code: string;
  timeLabel: string;
  type: string;
  memberName: string | null;
  amount: number;
  direction: "Masuk" | "Keluar";
  status: string;
};

export type DailyTransactionsReport = {
  date: string;
  summary: {
    savingsIn: number;
    loansDisbursed: number;
    installmentsPaid: number;
    cashIn: number;
    cashOut: number;
    transactionCount: number;
  };
  items: DailyTransactionReportItem[];
};

export type MonthlyRecapReport = {
  month: string;
  summary: {
    totalSavings: number;
    totalLoansDisbursed: number;
    totalInstallments: number;
    totalArrears: number;
    cashIn: number;
    cashOut: number;
    newMembers: number;
  };
};

export type MemberDetailReport = {
  member: {
    memberCode: string;
    name: string;
    phone: string;
    status: "Aktif" | "Nonaktif";
    joinedDate: string;
    email: string | null;
    address: string | null;
  };
  summary: {
    totalSavings: number;
    totalLoans: number;
    activeLoanCount: number;
    activeLoanAmount: number;
    remainingLoan: number;
    delinquencyStatus: "Lancar" | "Menunggak" | "Tanpa Pinjaman";
  };
  savingsBreakdown: {
    pokok: number;
    wajib: number;
    sukarela: number;
    total: number;
  };
  activeLoans: LoanReportItem[];
  paymentHistory: InstallmentReportPayment[];
  recentTransactions: TransactionItem[];
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
    getSummaryReport(
      userId: string,
      filters: {
        startDate?: string;
        endDate?: string;
      },
    ): Promise<SummaryReport>;
    getMembersReport(
      userId: string,
      filters: {
        query?: string;
        status?: "Semua" | "Aktif" | "Nonaktif";
        joinedFrom?: string;
        joinedTo?: string;
        loanStatus?: "Semua" | "Ada Pinjaman" | "Tanpa Pinjaman";
        delinquencyStatus?: "Semua" | "Lancar" | "Menunggak" | "Tanpa Pinjaman";
      },
    ): Promise<MemberReport>;
    getSavingsReport(
      userId: string,
      filters: {
        startDate?: string;
        endDate?: string;
        memberCode?: string;
        savingsType?: "Semua" | "Simpanan Pokok" | "Simpanan Wajib" | "Simpanan Sukarela";
      },
    ): Promise<SavingsReport>;
    getLoansReport(
      userId: string,
      filters: {
        startDate?: string;
        endDate?: string;
        query?: string;
        status?: "Semua" | "Lancar" | "Menunggak" | "Lunas";
      },
    ): Promise<LoanReport>;
    getInstallmentsReport(
      userId: string,
      filters: {
        startDate?: string;
        endDate?: string;
        query?: string;
        loanCode?: string;
        status?: "Semua" | "Berhasil" | "Jatuh Tempo" | "Menunggak";
      },
    ): Promise<InstallmentReport>;
    getArrearsReport(
      userId: string,
      filters: {
        query?: string;
        agingBucket?: "Semua" | "1–7 hari" | "8–30 hari" | "Lebih dari 30 hari";
      },
    ): Promise<ArrearsReport>;
    getCashflowReport(
      userId: string,
      filters: {
        startDate?: string;
        endDate?: string;
        category?: "Semua" | "Simpanan Masuk" | "Angsuran Masuk" | "Pencairan Pinjaman" | "Biaya Operasional";
        direction?: "Semua" | "Masuk" | "Keluar";
      },
    ): Promise<CashflowReport>;
    getDailyTransactionsReport(
      userId: string,
      filters: {
        date?: string;
      },
    ): Promise<DailyTransactionsReport>;
    getMonthlyRecapReport(
      userId: string,
      filters: {
        month?: string;
      },
    ): Promise<MonthlyRecapReport>;
    getMemberDetailReport(userId: string, memberCode: string): Promise<MemberDetailReport>;
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



