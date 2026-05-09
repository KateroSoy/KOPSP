import seedData from "./demoData.json";
import type {
  AdminBundle,
  AnnouncementItem,
  ArrearsReport,
  CashflowReport,
  DailyTransactionsReport,
  InstallmentReport,
  LoanApplicationItem,
  LoanListItem,
  LoanProductItem,
  LoanReport,
  MemberDashboard,
  MemberDetailReport,
  MemberListItem,
  MemberReport,
  MonthlyRecapReport,
  NotificationItem,
  SavingsProductItem,
  SavingsReport,
  SummaryReport,
  TransactionItem,
  UserSummary,
} from "@/api";

type ApplicationStatusCode = "NEW" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
type LoanStatusCode = "ACTIVE" | "DELINQUENT" | "COMPLETED";

type DemoUser = UserSummary & {
  password: string;
  status?: MemberListItem["status"];
  joinedDate: string;
};

type DemoLoanProduct = LoanProductItem & {
  isActive: boolean;
};

type DemoLoanApplication = Omit<LoanApplicationItem, "status"> & {
  statusCode: ApplicationStatusCode;
  userId: string;
  loanProductId: string;
};

type DemoLoan = Omit<LoanListItem, "status"> & {
  statusCode: LoanStatusCode;
  userId: string;
  loanProductId: string;
  dateDisbursed: string;
};

type DemoTransaction = TransactionItem & {
  memberCode: string;
  savingsProductId?: string;
  loanId?: string;
};

type DemoNotification = NotificationItem & {
  userId: string;
};

type DemoStore = {
  users: DemoUser[];
  savingsProducts: SavingsProductItem[];
  loanProducts: DemoLoanProduct[];
  memberBalances: Record<string, Record<string, number>>;
  loanApplications: DemoLoanApplication[];
  loans: DemoLoan[];
  transactions: DemoTransaction[];
  announcements: AnnouncementItem[];
  notifications: DemoNotification[];
  counters: Record<"member" | "app" | "loan" | "trx" | "notif" | "ann" | "savings" | "loanProduct", number>;
};

const DEMO_STORAGE_KEY = "simpan-pinjam-demo-store";
const DEMO_TOKEN_PREFIX = "demo-session:";

class DemoApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const isDemoMode =
  import.meta.env.VITE_DEMO_APP !== "false" &&
  import.meta.env.VITE_USE_BACKEND !== "true";

const clone = <T>(value: T): T => structuredClone(value);

const loadStore = (): DemoStore => {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!stored) return clone(seedData.store as DemoStore);

  try {
    return JSON.parse(stored) as DemoStore;
  } catch {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    return clone(seedData.store as DemoStore);
  }
};

const saveStore = (store: DemoStore) => {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(store));
};

const withStore = async <T>(callback: (store: DemoStore) => T | Promise<T>) => {
  const store = loadStore();
  const result = await callback(store);
  saveStore(store);
  return clone(result);
};

const readStore = async <T>(callback: (store: DemoStore) => T | Promise<T>) => {
  const result = await callback(loadStore());
  return clone(result);
};

const normalizePhone = (value: string) => value.replace(/[^\d+]/g, "").replace(/^\+62/, "0");

const today = () => new Date().toISOString().slice(0, 10);

const addMonths = (dateValue: string, months: number) => {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

const computeInstallment = (amount: number, tenor: number, interestRate: number) =>
  Math.ceil((amount + amount * (interestRate / 100) * tenor) / tenor);

const createToken = (user: DemoUser) => `${DEMO_TOKEN_PREFIX}${user.id}`;

const parseUserId = (token: string) => {
  if (!token.startsWith(DEMO_TOKEN_PREFIX)) {
    throw new DemoApiError("Sesi demo tidak valid. Silakan masuk ulang.", 401, "INVALID_SESSION");
  }
  return token.slice(DEMO_TOKEN_PREFIX.length);
};

const toPublicUser = (user: DemoUser): UserSummary => ({
  id: user.id,
  role: user.role,
  name: user.name,
  phone: user.phone,
  email: user.email,
  address: user.address,
  memberId: user.memberId,
});

const getUserOrThrow = (store: DemoStore, tokenOrUserId: string) => {
  const userId = tokenOrUserId.startsWith(DEMO_TOKEN_PREFIX) ? parseUserId(tokenOrUserId) : tokenOrUserId;
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new DemoApiError("Pengguna demo tidak ditemukan.", 404, "USER_NOT_FOUND");
  return user;
};

const getAdminOrThrow = (store: DemoStore, token: string) => {
  const user = getUserOrThrow(store, token);
  if (user.role !== "admin") {
    throw new DemoApiError("Anda tidak memiliki akses admin.", 403, "FORBIDDEN");
  }
  return user;
};

const getMemberOrThrow = (store: DemoStore, token: string) => {
  const user = getUserOrThrow(store, token);
  if (user.role !== "member") {
    throw new DemoApiError("Dashboard anggota hanya tersedia untuk akun anggota.", 403, "FORBIDDEN");
  }
  return user;
};

const nextCounter = (store: DemoStore, key: keyof DemoStore["counters"]) => {
  store.counters[key] += 1;
  return store.counters[key];
};

const nextMemberCode = (store: DemoStore) => `KSP-${String(nextCounter(store, "member")).padStart(5, "0")}`;

const toApplicationStatusLabel = (status: ApplicationStatusCode): LoanApplicationItem["status"] => {
  if (status === "NEW") return "Baru";
  if (status === "UNDER_REVIEW") return "Ditinjau";
  if (status === "APPROVED") return "Disetujui";
  return "Ditolak";
};

const toApplicationStatusCode = (status: LoanApplicationItem["status"]): ApplicationStatusCode => {
  if (status === "Baru") return "NEW";
  if (status === "Ditinjau") return "UNDER_REVIEW";
  if (status === "Disetujui") return "APPROVED";
  return "REJECTED";
};

const toLoanStatusLabel = (status: LoanStatusCode, memberFacing = false): LoanListItem["status"] => {
  if (status === "DELINQUENT") return "Menunggak";
  if (status === "COMPLETED") return "Lunas";
  return memberFacing ? "Aktif" : "Lancar";
};

const isActiveLoanStatus = (status: LoanStatusCode) => status === "ACTIVE" || status === "DELINQUENT";

const mapApplication = (item: DemoLoanApplication): LoanApplicationItem => ({
  id: item.id,
  memberId: item.memberId,
  name: item.name,
  amount: item.amount,
  tenor: item.tenor,
  purpose: item.purpose,
  date: item.date,
  status: toApplicationStatusLabel(item.statusCode),
  estimatedInstallment: item.estimatedInstallment,
  reviewNote: item.reviewNote ?? null,
});

const mapLoan = (loan: DemoLoan, memberFacing = false): LoanListItem => ({
  id: loan.id,
  memberId: loan.memberId,
  name: loan.name,
  amount: loan.amount,
  remaining: loan.remaining,
  installment: loan.installment,
  nextDueDate: loan.nextDueDate,
  tenor: loan.tenor,
  paidMonths: loan.paidMonths,
  status: toLoanStatusLabel(loan.statusCode, memberFacing),
});

const getSavingsSummary = (store: DemoStore, memberCode: string): MemberDashboard["savings"] => {
  const balances = store.memberBalances[memberCode] ?? {};
  const pokok = balances["JS-001"] ?? 0;
  const wajib = balances["JS-002"] ?? 0;
  const sukarela = balances["JS-003"] ?? 0;
  return { pokok, wajib, sukarela, total: pokok + wajib + sukarela };
};

const listMemberTransactions = (store: DemoStore, memberCode: string) =>
  store.transactions
    .filter((item) => item.memberCode === memberCode)
    .sort((left, right) => right.date.localeCompare(left.date))
    .map(({ memberCode: _memberCode, savingsProductId: _savingsProductId, loanId: _loanId, ...item }) => item);

const listUserNotifications = (store: DemoStore, userId: string) =>
  store.notifications
    .filter((item) => item.userId === userId)
    .sort((left, right) => right.date.localeCompare(left.date))
    .map(({ userId: _userId, ...item }) => item);

const listAdminMembers = (store: DemoStore): MemberListItem[] =>
  store.users
    .filter((user) => user.role === "member")
    .map((user) => ({
      id: user.memberId,
      name: user.name,
      phone: user.phone,
      status: user.status ?? "Aktif",
      totalSavings: getSavingsSummary(store, user.memberId).total,
      hasActiveLoan: store.loans.some(
        (loan) => loan.memberId === user.memberId && isActiveLoanStatus(loan.statusCode),
      ),
      address: user.address,
      email: user.email,
    }))
    .sort((left, right) => right.id.localeCompare(left.id));

const listAdminLoans = (store: DemoStore) =>
  store.loans
    .slice()
    .sort((left, right) => right.id.localeCompare(left.id))
    .map((loan) => mapLoan(loan));

const listApplications = (store: DemoStore) =>
  store.loanApplications
    .slice()
    .sort((left, right) => right.date.localeCompare(left.date))
    .map(mapApplication);

const listTransactionsForUser = (store: DemoStore, user: DemoUser) => {
  if (user.role === "admin") {
    return store.transactions
      .slice()
      .sort((left, right) => right.date.localeCompare(left.date))
      .map(({ memberCode: _memberCode, savingsProductId: _savingsProductId, loanId: _loanId, ...item }) => item);
  }
  return listMemberTransactions(store, user.memberId);
};

const getAdminDashboard = (store: DemoStore, admin: DemoUser) => {
  const members = listAdminMembers(store);
  const activeLoans = store.loans.filter((loan) => isActiveLoanStatus(loan.statusCode));
  const pendingApplications = store.loanApplications.filter(
    (item) => item.statusCode === "NEW" || item.statusCode === "UNDER_REVIEW",
  );

  return {
    user: toPublicUser(admin),
    stats: {
      totalMembers: members.length,
      totalSavings: members.reduce((sum, item) => sum + item.totalSavings, 0),
      totalLoans: store.loans.reduce((sum, item) => sum + item.amount, 0),
      pendingApplications: pendingApplications.length,
      activeLoansCount: activeLoans.length,
      dueToday: activeLoans.filter((loan) => loan.nextDueDate <= today()).length,
    },
    loanApplications: listApplications(store).slice(0, 5),
    transactions: listTransactionsForUser(store, admin).slice(0, 10),
  };
};

const getAdminBundle = (store: DemoStore, admin: DemoUser): AdminBundle => ({
  dashboard: getAdminDashboard(store, admin),
  members: listAdminMembers(store),
  savingsProducts: store.savingsProducts.slice(),
  loanProducts: store.loanProducts.filter((item) => item.isActive).map(({ isActive: _isActive, ...item }) => item),
  announcements: store.announcements.slice().sort((left, right) => right.date.localeCompare(left.date)),
  loans: listAdminLoans(store),
});

const findMemberUser = (store: DemoStore, memberCode: string) =>
  store.users.find((user) => user.role === "member" && user.memberId === memberCode);

const pushNotification = (store: DemoStore, userId: string, title: string, message: string) => {
  store.notifications.unshift({
    id: `notif-${nextCounter(store, "notif")}`,
    userId,
    title,
    message,
    date: today(),
    read: false,
  });
};

const fanOutAnnouncement = (store: DemoStore, announcement: AnnouncementItem) => {
  for (const user of store.users) {
    if (user.role === "member" && (user.status ?? "Aktif") === "Aktif") {
      pushNotification(store, user.id, announcement.title, announcement.content);
    }
  }
};

const withinRange = (value: string, startDate?: string, endDate?: string) =>
  (!startDate || value >= startDate) && (!endDate || value <= endDate);

const containsQuery = (query: string | undefined, ...values: Array<string | null | undefined>) => {
  if (!query) return true;
  const normalized = query.trim().toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(normalized));
};

const daysOverdue = (dateValue: string) => {
  const current = new Date(`${today()}T00:00:00`);
  const dueDate = new Date(`${dateValue}T00:00:00`);
  return Math.max(0, Math.floor((current.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
};

const agingBucket = (days: number): "1–7 hari" | "8–30 hari" | "Lebih dari 30 hari" => {
  if (days <= 7) return "1–7 hari";
  if (days <= 30) return "8–30 hari";
  return "Lebih dari 30 hari";
};

const loanReportItem = (loan: DemoLoan) => ({
  loanId: loan.id,
  loanCode: loan.id.toUpperCase().replace("LOAN", "PJ"),
  memberCode: loan.memberId,
  memberName: loan.name,
  dateDisbursed: loan.dateDisbursed,
  principalAmount: loan.amount,
  remainingAmount: loan.remaining,
  installmentAmount: loan.installment,
  tenor: loan.tenor,
  paidMonths: loan.paidMonths,
  status: toLoanStatusLabel(loan.statusCode) as "Lancar" | "Menunggak" | "Lunas",
});

const getSavingsType = (store: DemoStore, transaction: DemoTransaction) => {
  const product = store.savingsProducts.find((item) => item.id === transaction.savingsProductId);
  const name = product?.name ?? transaction.type;
  if (name.includes("Pokok")) return "Simpanan Pokok" as const;
  if (name.includes("Wajib")) return "Simpanan Wajib" as const;
  return "Simpanan Sukarela" as const;
};

const installmentPayments = (store: DemoStore, transactions = store.transactions) =>
  transactions
    .filter((item) => item.category === "pinjaman")
    .map((item) => {
      const loan = store.loans.find((candidate) => candidate.id === item.loanId);
      return {
        paymentId: item.id,
        paymentCode: item.id.toUpperCase().replace("TRX", "BYR"),
        loanCode: (loan?.id ?? item.loanId ?? "-").toUpperCase().replace("LOAN", "PJ"),
        memberCode: item.memberCode,
        memberName: item.memberName,
        paymentDate: item.date,
        amount: item.amount,
        method: "Transfer" as const,
        status: "Berhasil" as const,
        note: null,
      };
    })
    .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate));

const loanDueStatus = (loan: DemoLoan): "Lancar" | "Jatuh Tempo" | "Menunggak" => {
  if (loan.statusCode === "DELINQUENT") return "Menunggak";
  if (loan.nextDueDate <= today()) return "Jatuh Tempo";
  return "Lancar";
};

const cashflowItems = (store: DemoStore) => {
  const savingsItems = store.transactions.map((item) => ({
    code: item.id.toUpperCase(),
    date: item.date,
    category: item.category === "simpanan" ? ("Simpanan Masuk" as const) : ("Angsuran Masuk" as const),
    direction: "Masuk" as const,
    amount: item.amount,
    memberName: item.memberName,
    description: item.type,
  }));
  const loanItems = store.loans.map((loan) => ({
    code: loan.id.toUpperCase().replace("LOAN", "PJ"),
    date: loan.dateDisbursed,
    category: "Pencairan Pinjaman" as const,
    direction: "Keluar" as const,
    amount: loan.amount,
    memberName: loan.name,
    description: `Pencairan pinjaman ${loan.name}`,
  }));
  return [...savingsItems, ...loanItems].sort((left, right) => right.date.localeCompare(left.date));
};

const activeLoanAmountFor = (store: DemoStore, memberCode: string) =>
  store.loans
    .filter((loan) => loan.memberId === memberCode && isActiveLoanStatus(loan.statusCode))
    .reduce((sum, loan) => sum + loan.amount, 0);

const delinquencyStatusFor = (store: DemoStore, memberCode: string): "Lancar" | "Menunggak" | "Tanpa Pinjaman" => {
  const loans = store.loans.filter((loan) => loan.memberId === memberCode && isActiveLoanStatus(loan.statusCode));
  if (loans.length === 0) return "Tanpa Pinjaman";
  if (loans.some((loan) => loan.statusCode === "DELINQUENT")) return "Menunggak";
  return "Lancar";
};

export const demoApi = {
  login: (input: { phone: string; password: string }) =>
    readStore((store) => {
      const user = store.users.find((item) => normalizePhone(item.phone) === normalizePhone(input.phone));
      if (!user || user.password !== input.password) {
        throw new DemoApiError("Nomor HP atau kata sandi demo tidak sesuai.", 401, "INVALID_CREDENTIALS");
      }
      return { token: createToken(user), user: toPublicUser(user) };
    }),
  getMe: (token: string) => readStore((store) => toPublicUser(getUserOrThrow(store, token))),
  updateProfile: (
    token: string,
    input: { name: string; phone: string; email?: string | null; address?: string | null },
  ) =>
    withStore((store) => {
      const user = getUserOrThrow(store, token);
      user.name = input.name.trim();
      user.phone = normalizePhone(input.phone);
      user.email = input.email?.trim() || null;
      user.address = input.address?.trim() || null;
      for (const loan of store.loans.filter((item) => item.userId === user.id)) loan.name = user.name;
      for (const app of store.loanApplications.filter((item) => item.userId === user.id)) app.name = user.name;
      for (const trx of store.transactions.filter((item) => item.memberCode === user.memberId)) trx.memberName = user.name;
      return toPublicUser(user);
    }),
  changePassword: (token: string, input: { currentPassword: string; newPassword: string }) =>
    withStore((store) => {
      const user = getUserOrThrow(store, token);
      if (user.password !== input.currentPassword) {
        throw new DemoApiError("Kata sandi saat ini tidak sesuai.", 400, "INVALID_PASSWORD");
      }
      user.password = input.newPassword;
      return { changed: true };
    }),
  getMemberDashboard: (token: string) =>
    readStore((store) => {
      const user = getMemberOrThrow(store, token);
      const activeLoan = store.loans.find(
        (loan) => loan.memberId === user.memberId && isActiveLoanStatus(loan.statusCode),
      );
      return {
        user: toPublicUser(user),
        savings: getSavingsSummary(store, user.memberId),
        activeLoan: activeLoan ? mapLoan(activeLoan, true) : null,
        recentTransactions: listMemberTransactions(store, user.memberId).slice(0, 20),
        notifications: listUserNotifications(store, user.id).slice(0, 50),
      };
    }),
  createLoanApplication: (
    token: string,
    input: { amount: number; tenor: number; purpose: string; loanProductId?: string },
  ) =>
    withStore((store) => {
      const user = getMemberOrThrow(store, token);
      if (store.loans.some((loan) => loan.memberId === user.memberId && isActiveLoanStatus(loan.statusCode))) {
        throw new DemoApiError(
          "Anggota masih memiliki pinjaman aktif, sehingga belum bisa mengajukan pinjaman baru.",
          409,
          "ACTIVE_LOAN_EXISTS",
        );
      }

      const product =
        (input.loanProductId
          ? store.loanProducts.find((item) => item.id === input.loanProductId && item.isActive)
          : undefined) ?? store.loanProducts.find((item) => item.isActive);
      if (!product) throw new DemoApiError("Produk pinjaman belum tersedia.", 400, "LOAN_PRODUCT_MISSING");
      if (input.amount > product.maxAmount) throw new DemoApiError("Nominal melebihi batas produk pinjaman.", 400, "AMOUNT_TOO_HIGH");
      if (input.tenor > product.maxTenor) throw new DemoApiError("Tenor melebihi batas produk pinjaman.", 400, "TENOR_TOO_HIGH");

      const application: DemoLoanApplication = {
        id: `app-${nextCounter(store, "app")}`,
        userId: user.id,
        memberId: user.memberId,
        name: user.name,
        amount: input.amount,
        tenor: input.tenor,
        purpose: input.purpose.trim(),
        date: today(),
        statusCode: "NEW",
        estimatedInstallment: computeInstallment(input.amount, input.tenor, product.interestRate),
        reviewNote: null,
        loanProductId: product.id,
      };
      store.loanApplications.unshift(application);
      pushNotification(store, user.id, "Pengajuan Dikirim", "Pengajuan pinjaman Anda sudah masuk ke antrean review admin.");
      return mapApplication(application);
    }),
  getAdminBundle: (token: string) => readStore((store) => getAdminBundle(store, getAdminOrThrow(store, token))),
  getSummaryReport: (token: string, filters: { startDate?: string; endDate?: string } = {}) =>
    readStore((store): SummaryReport => {
      getAdminOrThrow(store, token);
      const range = { startDate: filters.startDate || `${today().slice(0, 7)}-01`, endDate: filters.endDate || today() };
      const transactions = listTransactionsForUser(store, store.users.find((user) => user.role === "admin")!);
      const periodTransactions = transactions.filter((item) => withinRange(item.date, range.startDate, range.endDate));
      const loansInPeriod = store.loans.filter((loan) => withinRange(loan.dateDisbursed, range.startDate, range.endDate));
      const activeMembers = store.users.filter((user) => user.role === "member" && user.status === "Aktif");
      const activeLoans = store.loans.filter((loan) => isActiveLoanStatus(loan.statusCode));
      return {
        period: { ...range, label: `${range.startDate} s/d ${range.endDate}` },
        metrics: {
          totalActiveMembers: activeMembers.length,
          totalSavings: listAdminMembers(store).reduce((sum, item) => sum + item.totalSavings, 0),
          totalActiveLoans: activeLoans.reduce((sum, item) => sum + item.remaining, 0),
          totalInstallmentsToday: store.transactions
            .filter((item) => item.category === "pinjaman" && item.date === today())
            .reduce((sum, item) => sum + item.amount, 0),
          totalArrears: store.loans
            .filter((loan) => loan.statusCode === "DELINQUENT")
            .reduce((sum, loan) => sum + Math.min(loan.installment, loan.remaining), 0),
          cashBalance: cashflowItems(store).reduce((sum, item) => sum + (item.direction === "Masuk" ? item.amount : -item.amount), 0),
          loansDisbursedThisMonth: loansInPeriod.reduce((sum, loan) => sum + loan.amount, 0),
          savingsInThisMonth: periodTransactions
            .filter((item) => item.category === "simpanan")
            .reduce((sum, item) => sum + item.amount, 0),
        },
        quickStats: {
          pendingApplications: store.loanApplications.filter((item) => item.statusCode === "NEW" || item.statusCode === "UNDER_REVIEW").length,
          dueToday: activeLoans.filter((loan) => loan.nextDueDate <= today()).length,
          delinquentLoans: store.loans.filter((loan) => loan.statusCode === "DELINQUENT").length,
          inactiveMembers: store.users.filter((user) => user.role === "member" && user.status === "Nonaktif").length,
        },
        recentTransactions: periodTransactions.slice(0, 8),
        latestApplications: listApplications(store).slice(0, 5),
      };
    }),
  getMembersReport: (
    token: string,
    filters: {
      query?: string;
      status?: "Semua" | "Aktif" | "Nonaktif";
      joinedFrom?: string;
      joinedTo?: string;
      loanStatus?: "Semua" | "Ada Pinjaman" | "Tanpa Pinjaman";
      delinquencyStatus?: "Semua" | "Lancar" | "Menunggak" | "Tanpa Pinjaman";
    } = {},
  ) =>
    readStore((store): MemberReport => {
      getAdminOrThrow(store, token);
      const items = store.users
        .filter((user) => user.role === "member")
        .map((user) => {
          const activeLoans = store.loans.filter((loan) => loan.memberId === user.memberId && isActiveLoanStatus(loan.statusCode));
          return {
            memberCode: user.memberId,
            name: user.name,
            phone: user.phone,
            joinedDate: user.joinedDate,
            status: user.status ?? "Aktif",
            totalSavings: getSavingsSummary(store, user.memberId).total,
            activeLoanCount: activeLoans.length,
            activeLoanAmount: activeLoans.reduce((sum, loan) => sum + loan.amount, 0),
            delinquencyStatus: delinquencyStatusFor(store, user.memberId),
          };
        })
        .filter((item) => filters.status && filters.status !== "Semua" ? item.status === filters.status : true)
        .filter((item) => withinRange(item.joinedDate, filters.joinedFrom, filters.joinedTo))
        .filter((item) => {
          if (!filters.loanStatus || filters.loanStatus === "Semua") return true;
          return filters.loanStatus === "Ada Pinjaman" ? item.activeLoanCount > 0 : item.activeLoanCount === 0;
        })
        .filter((item) => !filters.delinquencyStatus || filters.delinquencyStatus === "Semua" ? true : item.delinquencyStatus === filters.delinquencyStatus)
        .filter((item) => containsQuery(filters.query, item.memberCode, item.name, item.phone))
        .sort((left, right) => right.memberCode.localeCompare(left.memberCode));

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
    }),
  getSavingsReport: (
    token: string,
    filters: {
      startDate?: string;
      endDate?: string;
      memberCode?: string;
      savingsType?: "Semua" | "Simpanan Pokok" | "Simpanan Wajib" | "Simpanan Sukarela";
    } = {},
  ) =>
    readStore((store): SavingsReport => {
      getAdminOrThrow(store, token);
      const transactions = store.transactions
        .filter((item) => item.category === "simpanan")
        .filter((item) => withinRange(item.date, filters.startDate, filters.endDate))
        .filter((item) => !filters.memberCode || item.memberCode === filters.memberCode)
        .map((item) => ({
          id: item.id,
          transactionCode: item.id.toUpperCase(),
          date: item.date,
          memberCode: item.memberCode,
          memberName: item.memberName,
          savingsType: getSavingsType(store, item),
          amount: item.amount,
          status: item.status,
        }))
        .filter((item) => !filters.savingsType || filters.savingsType === "Semua" ? true : item.savingsType === filters.savingsType);

      const totalByType = (type: SavingsReport["transactions"][number]["savingsType"]) =>
        transactions.filter((item) => item.savingsType === type).reduce((sum, item) => sum + item.amount, 0);

      return {
        summary: {
          periodTotal: transactions.reduce((sum, item) => sum + item.amount, 0),
          totalPokok: totalByType("Simpanan Pokok"),
          totalWajib: totalByType("Simpanan Wajib"),
          totalSukarela: totalByType("Simpanan Sukarela"),
          transactionCount: transactions.length,
        },
        transactions: transactions.sort((left, right) => right.date.localeCompare(left.date)),
        memberTotals: listAdminMembers(store).map((member) => ({
          memberCode: member.id,
          memberName: member.name,
          ...getSavingsSummary(store, member.id),
        })),
      };
    }),
  getLoansReport: (
    token: string,
    filters: { startDate?: string; endDate?: string; query?: string; status?: "Semua" | "Lancar" | "Menunggak" | "Lunas" } = {},
  ) =>
    readStore((store): LoanReport => {
      getAdminOrThrow(store, token);
      const items = store.loans
        .filter((loan) => withinRange(loan.dateDisbursed, filters.startDate, filters.endDate))
        .map(loanReportItem)
        .filter((item) => !filters.status || filters.status === "Semua" ? true : item.status === filters.status)
        .filter((item) => containsQuery(filters.query, item.loanCode, item.memberCode, item.memberName))
        .sort((left, right) => right.dateDisbursed.localeCompare(left.dateDisbursed));

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
    }),
  getInstallmentsReport: (
    token: string,
    filters: {
      startDate?: string;
      endDate?: string;
      query?: string;
      loanCode?: string;
      status?: "Semua" | "Berhasil" | "Jatuh Tempo" | "Menunggak";
    } = {},
  ) =>
    readStore((store): InstallmentReport => {
      getAdminOrThrow(store, token);
      const payments = installmentPayments(
        store,
        store.transactions
          .filter((item) => withinRange(item.date, filters.startDate, filters.endDate))
          .filter((item) => containsQuery(filters.query, item.id, item.memberCode, item.memberName))
          .filter((item) => !filters.loanCode || item.loanId?.toUpperCase().replace("LOAN", "PJ").includes(filters.loanCode.toUpperCase())),
      ).filter(() => !filters.status || filters.status === "Semua" || filters.status === "Berhasil");

      const dueItems = store.loans
        .filter((loan) => isActiveLoanStatus(loan.statusCode))
        .map((loan) => ({
          loanId: loan.id,
          loanCode: loan.id.toUpperCase().replace("LOAN", "PJ"),
          memberCode: loan.memberId,
          memberName: loan.name,
          nextDueDate: loan.nextDueDate,
          installmentAmount: loan.installment,
          status: loanDueStatus(loan),
        }))
        .filter((item) => containsQuery(filters.query, item.loanCode, item.memberCode, item.memberName))
        .filter((item) => !filters.loanCode || item.loanCode.includes(filters.loanCode.toUpperCase()))
        .filter((item) => {
          if (!filters.status || filters.status === "Semua") return true;
          if (filters.status === "Berhasil") return false;
          return item.status === filters.status;
        });

      return {
        summary: {
          paymentsToday: store.transactions
            .filter((item) => item.category === "pinjaman" && item.date === today())
            .reduce((sum, item) => sum + item.amount, 0),
          paymentsThisMonth: store.transactions
            .filter((item) => item.category === "pinjaman" && item.date.startsWith(today().slice(0, 7)))
            .reduce((sum, item) => sum + item.amount, 0),
          paymentCount: payments.length,
          dueSoonCount: dueItems.filter((item) => item.status !== "Lancar").length,
        },
        payments,
        dueItems,
      };
    }),
  getArrearsReport: (token: string, filters: { query?: string; agingBucket?: "Semua" | "1–7 hari" | "8–30 hari" | "Lebih dari 30 hari" } = {}) =>
    readStore((store): ArrearsReport => {
      getAdminOrThrow(store, token);
      const items = store.loans
        .filter((loan) => loan.statusCode === "DELINQUENT")
        .map((loan) => {
          const overdue = daysOverdue(loan.nextDueDate);
          return {
            loanId: loan.id,
            loanCode: loan.id.toUpperCase().replace("LOAN", "PJ"),
            memberCode: loan.memberId,
            memberName: loan.name,
            nextDueDate: loan.nextDueDate,
            daysOverdue: overdue,
            agingBucket: agingBucket(overdue),
            amountDue: Math.min(loan.installment, loan.remaining),
            remainingAmount: loan.remaining,
            status: "Menunggak" as const,
          };
        })
        .filter((item) => !filters.agingBucket || filters.agingBucket === "Semua" ? true : item.agingBucket === filters.agingBucket)
        .filter((item) => containsQuery(filters.query, item.loanCode, item.memberCode, item.memberName));

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
    }),
  getCashflowReport: (
    token: string,
    filters: {
      startDate?: string;
      endDate?: string;
      category?: "Semua" | "Simpanan Masuk" | "Angsuran Masuk" | "Pencairan Pinjaman" | "Biaya Operasional";
      direction?: "Semua" | "Masuk" | "Keluar";
    } = {},
  ) =>
    readStore((store): CashflowReport => {
      getAdminOrThrow(store, token);
      const allItems = cashflowItems(store);
      const items = allItems
        .filter((item) => withinRange(item.date, filters.startDate, filters.endDate))
        .filter((item) => !filters.category || filters.category === "Semua" ? true : item.category === filters.category)
        .filter((item) => !filters.direction || filters.direction === "Semua" ? true : item.direction === filters.direction);
      const openingBalance = allItems
        .filter((item) => filters.startDate && item.date < filters.startDate)
        .reduce((sum, item) => sum + (item.direction === "Masuk" ? item.amount : -item.amount), 0);
      const cashIn = items.filter((item) => item.direction === "Masuk").reduce((sum, item) => sum + item.amount, 0);
      const cashOut = items.filter((item) => item.direction === "Keluar").reduce((sum, item) => sum + item.amount, 0);
      return { summary: { openingBalance, cashIn, cashOut, closingBalance: openingBalance + cashIn - cashOut }, items };
    }),
  getDailyTransactionsReport: (token: string, filters: { date?: string } = {}) =>
    readStore((store): DailyTransactionsReport => {
      getAdminOrThrow(store, token);
      const date = filters.date || today();
      const items = cashflowItems(store)
        .filter((item) => item.date === date)
        .map((item) => ({
          code: item.code,
          timeLabel: "09:00",
          type: item.category,
          memberName: item.memberName,
          amount: item.amount,
          direction: item.direction,
          status: "Berhasil",
        }));
      const savingsIn = items.filter((item) => item.type === "Simpanan Masuk").reduce((sum, item) => sum + item.amount, 0);
      const installmentsPaid = items.filter((item) => item.type === "Angsuran Masuk").reduce((sum, item) => sum + item.amount, 0);
      const loansDisbursed = items.filter((item) => item.type === "Pencairan Pinjaman").reduce((sum, item) => sum + item.amount, 0);
      return {
        date,
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
    }),
  getMonthlyRecapReport: (token: string, filters: { month?: string } = {}) =>
    readStore((store): MonthlyRecapReport => {
      getAdminOrThrow(store, token);
      const month = filters.month || today().slice(0, 7);
      const items = cashflowItems(store).filter((item) => item.date.startsWith(month));
      return {
        month,
        summary: {
          totalSavings: items.filter((item) => item.category === "Simpanan Masuk").reduce((sum, item) => sum + item.amount, 0),
          totalLoansDisbursed: items.filter((item) => item.category === "Pencairan Pinjaman").reduce((sum, item) => sum + item.amount, 0),
          totalInstallments: items.filter((item) => item.category === "Angsuran Masuk").reduce((sum, item) => sum + item.amount, 0),
          totalArrears: store.loans.filter((loan) => loan.statusCode === "DELINQUENT").reduce((sum, loan) => sum + Math.min(loan.installment, loan.remaining), 0),
          cashIn: items.filter((item) => item.direction === "Masuk").reduce((sum, item) => sum + item.amount, 0),
          cashOut: items.filter((item) => item.direction === "Keluar").reduce((sum, item) => sum + item.amount, 0),
          newMembers: store.users.filter((user) => user.role === "member" && user.joinedDate.startsWith(month)).length,
        },
      };
    }),
  getMemberDetailReport: (token: string, memberCode: string) =>
    readStore((store): MemberDetailReport => {
      getAdminOrThrow(store, token);
      const member = findMemberUser(store, memberCode);
      if (!member) throw new DemoApiError("Anggota demo tidak ditemukan.", 404, "MEMBER_NOT_FOUND");
      const activeLoans = store.loans.filter((loan) => loan.memberId === memberCode && isActiveLoanStatus(loan.statusCode));
      return {
        member: {
          memberCode: member.memberId,
          name: member.name,
          phone: member.phone,
          status: member.status ?? "Aktif",
          joinedDate: member.joinedDate,
          email: member.email,
          address: member.address,
        },
        summary: {
          totalSavings: getSavingsSummary(store, memberCode).total,
          totalLoans: store.loans.filter((loan) => loan.memberId === memberCode).reduce((sum, loan) => sum + loan.amount, 0),
          activeLoanCount: activeLoans.length,
          activeLoanAmount: activeLoanAmountFor(store, memberCode),
          remainingLoan: activeLoans.reduce((sum, loan) => sum + loan.remaining, 0),
          delinquencyStatus: delinquencyStatusFor(store, memberCode),
        },
        savingsBreakdown: getSavingsSummary(store, memberCode),
        activeLoans: activeLoans.map(loanReportItem),
        paymentHistory: installmentPayments(store, store.transactions.filter((item) => item.memberCode === memberCode)),
        recentTransactions: listMemberTransactions(store, memberCode),
      };
    }),
  listLoanApplications: (token: string) => readStore((store) => { getAdminOrThrow(store, token); return listApplications(store); }),
  reviewLoanApplication: (
    token: string,
    id: string,
    input: { status: "Ditinjau" | "Disetujui" | "Ditolak"; reviewNote?: string | null },
  ) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const application = store.loanApplications.find((item) => item.id === id);
      if (!application) throw new DemoApiError("Pengajuan tidak ditemukan.", 404, "APPLICATION_NOT_FOUND");
      const previousStatus = application.statusCode;
      application.statusCode = toApplicationStatusCode(input.status);
      application.reviewNote = input.reviewNote ?? null;

      if (
        application.statusCode === "APPROVED" &&
        previousStatus !== "APPROVED" &&
        !store.loans.some((loan) => loan.memberId === application.memberId && isActiveLoanStatus(loan.statusCode))
      ) {
        const loan: DemoLoan = {
          id: `loan-${nextCounter(store, "loan")}`,
          memberId: application.memberId,
          userId: application.userId,
          name: application.name,
          dateDisbursed: today(),
          amount: application.amount,
          remaining: application.amount,
          installment: application.estimatedInstallment,
          nextDueDate: addMonths(today(), 1),
          tenor: application.tenor,
          paidMonths: 0,
          statusCode: "ACTIVE",
          loanProductId: application.loanProductId,
        };
        store.loans.unshift(loan);
        pushNotification(store, application.userId, "Pinjaman Disetujui", `Pengajuan pinjaman Anda sebesar Rp${application.amount} telah disetujui.`);
      }

      if (application.statusCode === "REJECTED") {
        pushNotification(store, application.userId, "Pinjaman Ditolak", application.reviewNote || "Pengajuan pinjaman Anda belum dapat disetujui.");
      }

      return mapApplication(application);
    }),
  createMember: (
    token: string,
    input: { name: string; phone: string; password: string; status: "Aktif" | "Nonaktif"; email?: string | null; address?: string | null },
  ) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      if (store.users.some((user) => normalizePhone(user.phone) === normalizePhone(input.phone))) {
        throw new DemoApiError("Nomor HP sudah digunakan.", 409, "PHONE_EXISTS");
      }
      const memberCode = nextMemberCode(store);
      const user: DemoUser = {
        id: `member-${nextCounter(store, "member")}`,
        role: "member",
        name: input.name.trim(),
        phone: normalizePhone(input.phone),
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
        memberId: memberCode,
        password: input.password,
        status: input.status,
        joinedDate: today(),
      };
      store.users.push(user);
      store.memberBalances[memberCode] = {};
      return listAdminMembers(store).find((member) => member.id === memberCode)!;
    }),
  updateMember: (
    token: string,
    id: string,
    input: { name: string; phone: string; status: "Aktif" | "Nonaktif"; email?: string | null; address?: string | null },
  ) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const member = findMemberUser(store, id);
      if (!member) throw new DemoApiError("Anggota tidak ditemukan.", 404, "MEMBER_NOT_FOUND");
      member.name = input.name.trim();
      member.phone = normalizePhone(input.phone);
      member.status = input.status;
      member.email = input.email?.trim() || null;
      member.address = input.address?.trim() || null;
      for (const loan of store.loans.filter((item) => item.memberId === id)) loan.name = member.name;
      for (const app of store.loanApplications.filter((item) => item.memberId === id)) app.name = member.name;
      for (const trx of store.transactions.filter((item) => item.memberCode === id)) trx.memberName = member.name;
      return listAdminMembers(store).find((item) => item.id === id)!;
    }),
  deleteMember: (token: string, id: string) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      store.users = store.users.filter((user) => user.memberId !== id);
      delete store.memberBalances[id];
      store.loanApplications = store.loanApplications.filter((item) => item.memberId !== id);
      store.loans = store.loans.filter((item) => item.memberId !== id);
      store.transactions = store.transactions.filter((item) => item.memberCode !== id);
      return { deleted: true };
    }),
  createSavingsProduct: (token: string, input: { name: string; amount: number; isMandatory: boolean }) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const product = { id: `JS-${String(nextCounter(store, "savings")).padStart(3, "0")}`, ...input };
      store.savingsProducts.push(product);
      return product;
    }),
  updateSavingsProduct: (token: string, id: string, input: { name: string; amount: number; isMandatory: boolean }) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const product = store.savingsProducts.find((item) => item.id === id);
      if (!product) throw new DemoApiError("Produk simpanan tidak ditemukan.", 404, "SAVINGS_PRODUCT_NOT_FOUND");
      Object.assign(product, input);
      return product;
    }),
  deleteSavingsProduct: (token: string, id: string) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      store.savingsProducts = store.savingsProducts.filter((item) => item.id !== id);
      for (const balances of Object.values(store.memberBalances)) delete balances[id];
      return { deleted: true };
    }),
  createLoanProduct: (
    token: string,
    input: { name: string; maxAmount: number; interestRate: number; adminFeeRate: number; maxTenor: number },
  ) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const product = { id: `JP-${String(nextCounter(store, "loanProduct")).padStart(3, "0")}`, ...input, isActive: true };
      store.loanProducts.push(product);
      const { isActive: _isActive, ...publicProduct } = product;
      return publicProduct;
    }),
  updateLoanProduct: (
    token: string,
    id: string,
    input: { name: string; maxAmount: number; interestRate: number; adminFeeRate: number; maxTenor: number },
  ) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const product = store.loanProducts.find((item) => item.id === id);
      if (!product) throw new DemoApiError("Produk pinjaman tidak ditemukan.", 404, "LOAN_PRODUCT_NOT_FOUND");
      Object.assign(product, input);
      const { isActive: _isActive, ...publicProduct } = product;
      return publicProduct;
    }),
  deleteLoanProduct: (token: string, id: string) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      store.loanProducts = store.loanProducts.filter((item) => item.id !== id);
      return { deleted: true };
    }),
  createAnnouncement: (token: string, input: { title: string; content: string; isActive: boolean }) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const announcement = {
        id: `ann-${nextCounter(store, "ann")}`,
        title: input.title.trim(),
        content: input.content.trim(),
        date: today(),
        isActive: input.isActive,
      };
      store.announcements.unshift(announcement);
      if (announcement.isActive) fanOutAnnouncement(store, announcement);
      return announcement;
    }),
  updateAnnouncement: (token: string, id: string, input: { title: string; content: string; isActive: boolean }) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const announcement = store.announcements.find((item) => item.id === id);
      if (!announcement) throw new DemoApiError("Pengumuman tidak ditemukan.", 404, "ANNOUNCEMENT_NOT_FOUND");
      const wasInactive = !announcement.isActive;
      announcement.title = input.title.trim();
      announcement.content = input.content.trim();
      announcement.isActive = input.isActive;
      if (wasInactive && announcement.isActive) fanOutAnnouncement(store, announcement);
      return announcement;
    }),
  deleteAnnouncement: (token: string, id: string) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      store.announcements = store.announcements.filter((item) => item.id !== id);
      return { deleted: true };
    }),
  recordSavingsDeposit: (
    token: string,
    input: { memberId: string; savingsProductId: string; amount: number; note?: string | null },
  ) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const member = findMemberUser(store, input.memberId);
      if (!member) throw new DemoApiError("Anggota tidak ditemukan.", 404, "MEMBER_NOT_FOUND");
      const product = store.savingsProducts.find((item) => item.id === input.savingsProductId);
      if (!product) throw new DemoApiError("Jenis simpanan tidak ditemukan.", 404, "SAVINGS_PRODUCT_NOT_FOUND");
      if (input.amount <= 0) throw new DemoApiError("Nominal simpanan harus lebih dari 0.", 400, "INVALID_AMOUNT");

      const balances = store.memberBalances[member.memberId] ?? {};
      balances[product.id] = (balances[product.id] ?? 0) + input.amount;
      store.memberBalances[member.memberId] = balances;

      const transaction: DemoTransaction = {
        id: `trx-${nextCounter(store, "trx")}`,
        type: `Setoran ${product.name.replace(/^Simpanan\s+/i, "")}`,
        amount: input.amount,
        date: today(),
        status: "Berhasil",
        category: "simpanan",
        memberName: member.name,
        memberCode: member.memberId,
        savingsProductId: product.id,
      };
      store.transactions.unshift(transaction);
      pushNotification(store, member.id, "Simpanan Bertambah", `Setoran ${product.name} sebesar Rp${input.amount} telah dicatat.`);

      const { memberCode: _memberCode, savingsProductId: _savingsProductId, ...publicTransaction } = transaction;
      return publicTransaction;
    }),
  recordLoanPayment: (token: string, id: string, input: { amount: number; method: "Transfer" | "Tunai"; note?: string | null }) =>
    withStore((store) => {
      getAdminOrThrow(store, token);
      const loan = store.loans.find((item) => item.id === id);
      if (!loan) throw new DemoApiError("Pinjaman tidak ditemukan.", 404, "LOAN_NOT_FOUND");
      loan.remaining = Math.max(0, loan.remaining - input.amount);
      loan.paidMonths = Math.min(loan.tenor, loan.paidMonths + 1);
      loan.nextDueDate = addMonths(loan.nextDueDate, 1);
      if (loan.remaining === 0) loan.statusCode = "COMPLETED";
      else if (loan.statusCode === "DELINQUENT") loan.statusCode = "ACTIVE";
      const transaction: DemoTransaction = {
        id: `trx-${nextCounter(store, "trx")}`,
        type: "Angsuran Pinjaman",
        amount: input.amount,
        date: today(),
        status: "Berhasil",
        category: "pinjaman",
        memberName: loan.name,
        memberCode: loan.memberId,
        loanId: loan.id,
      };
      store.transactions.unshift(transaction);
      pushNotification(store, loan.userId, "Pembayaran Berhasil", `Pembayaran angsuran sebesar Rp${input.amount} telah dicatat.`);
      const { memberCode: _memberCode, loanId: _loanId, ...publicTransaction } = transaction;
      return publicTransaction;
    }),
  listTransactions: (token: string) => readStore((store) => listTransactionsForUser(store, getUserOrThrow(store, token))),
  listNotifications: (token: string) => readStore((store) => listUserNotifications(store, getUserOrThrow(store, token).id)),
  markNotificationRead: (token: string, id: string) =>
    withStore((store) => {
      const user = getUserOrThrow(store, token);
      const notification = store.notifications.find((item) => item.id === id && item.userId === user.id);
      if (!notification) throw new DemoApiError("Notifikasi tidak ditemukan.", 404, "NOTIFICATION_NOT_FOUND");
      notification.read = true;
      const { userId: _userId, ...publicNotification } = notification;
      return publicNotification;
    }),
};

export const resetDemoData = () => {
  localStorage.removeItem(DEMO_STORAGE_KEY);
};
