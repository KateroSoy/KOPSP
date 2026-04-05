import type {
  AppServices,
  LoanApplicationItem,
  LoanListItem,
  MemberDashboard,
  MemberListItem,
  NotificationItem,
  SavingsProductItem,
  TransactionItem,
  UserSummary,
} from "./server.types.js";
import { AppError, addMonths, computeInstallment, createJwt, formatDateOnly, normalizePhone } from "./server.utils.js";

type InternalApplicationStatus = "NEW" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
type InternalLoanStatus = "ACTIVE" | "DELINQUENT" | "COMPLETED";

type DemoUser = UserSummary & {
  password: string;
  status?: MemberListItem["status"];
};

type DemoLoanProduct = {
  id: string;
  name: string;
  maxAmount: number;
  interestRate: number;
  adminFeeRate: number;
  maxTenor: number;
  isActive: boolean;
};

type DemoLoanApplication = Omit<LoanApplicationItem, "status"> & {
  statusCode: InternalApplicationStatus;
  userId: string;
  loanProductId: string;
};

type DemoLoan = Omit<LoanListItem, "status"> & {
  statusCode: InternalLoanStatus;
  userId: string;
  loanProductId: string;
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
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    date: string;
    isActive: boolean;
  }>;
  notifications: DemoNotification[];
  counters: Record<string, number>;
};

const clone = <T>(value: T): T => structuredClone(value);

const toApplicationStatusLabel = (
  status: InternalApplicationStatus,
): LoanApplicationItem["status"] => {
  if (status === "NEW") return "Baru";
  if (status === "UNDER_REVIEW") return "Ditinjau";
  if (status === "APPROVED") return "Disetujui";
  return "Ditolak";
};

const toLoanStatusLabel = (
  status: InternalLoanStatus,
  memberFacing = false,
): LoanListItem["status"] => {
  if (status === "DELINQUENT") return "Menunggak";
  if (status === "COMPLETED") return "Lunas";
  return memberFacing ? "Aktif" : "Lancar";
};

const isActiveLoanStatus = (status: InternalLoanStatus) =>
  status === "ACTIVE" || status === "DELINQUENT";

const getToday = () => formatDateOnly(new Date());

const getFutureDate = (months: number) => formatDateOnly(addMonths(new Date(), months));

const createDemoStore = (): DemoStore => ({
  users: [
    {
      id: "admin-1",
      role: "admin",
      name: "Siti Rahma",
      phone: "08111111111",
      email: "admin@koperasi.com",
      address: "Kantor Pusat",
      memberId: "ADM-001",
      password: "admin",
    },
    {
      id: "member-1",
      role: "member",
      name: "Budi Santoso",
      phone: "08222222222",
      email: null,
      address: "Jl. Merdeka No. 45, Jakarta",
      memberId: "KSP-10248",
      password: "user",
      status: "Aktif",
    },
    {
      id: "member-2",
      role: "member",
      name: "Siti Aminah",
      phone: "08333333333",
      email: null,
      address: "Jl. Sudirman No. 10, Jakarta",
      memberId: "KSP-10555",
      password: "user",
      status: "Aktif",
    },
    {
      id: "member-3",
      role: "member",
      name: "Ahmad Fauzi",
      phone: "08444444444",
      email: null,
      address: "Jl. Kebon Sirih No. 22, Jakarta",
      memberId: "KSP-10601",
      password: "user",
      status: "Aktif",
    },
    {
      id: "member-4",
      role: "member",
      name: "Dewi Lestari",
      phone: "08555555555",
      email: null,
      address: "Jl. Cikini No. 8, Jakarta",
      memberId: "KSP-10602",
      password: "user",
      status: "Nonaktif",
    },
    {
      id: "member-5",
      role: "member",
      name: "Joko Anwar",
      phone: "08666666666",
      email: null,
      address: "Jl. Diponegoro No. 12, Jakarta",
      memberId: "KSP-10002",
      password: "user",
      status: "Aktif",
    },
  ],
  savingsProducts: [
    { id: "JS-001", name: "Simpanan Pokok", amount: 500000, isMandatory: true },
    { id: "JS-002", name: "Simpanan Wajib", amount: 50000, isMandatory: true },
    { id: "JS-003", name: "Simpanan Sukarela", amount: 0, isMandatory: false },
  ],
  loanProducts: [
    {
      id: "JP-001",
      name: "Pinjaman Reguler",
      maxAmount: 10000000,
      interestRate: 2,
      adminFeeRate: 1,
      maxTenor: 24,
      isActive: true,
    },
    {
      id: "JP-002",
      name: "Pinjaman Usaha",
      maxAmount: 50000000,
      interestRate: 1.5,
      adminFeeRate: 1,
      maxTenor: 36,
      isActive: true,
    },
  ],
  memberBalances: {
    "KSP-10248": { "JS-001": 500000, "JS-002": 1250000, "JS-003": 3800000 },
    "KSP-10555": { "JS-001": 500000, "JS-002": 500000, "JS-003": 1000000 },
    "KSP-10601": { "JS-001": 500000, "JS-002": 500000, "JS-003": 500000 },
    "KSP-10602": { "JS-001": 500000, "JS-002": 0, "JS-003": 0 },
    "KSP-10002": { "JS-001": 500000, "JS-002": 750000, "JS-003": 0 },
  },
  loanApplications: [
    {
      id: "app-1",
      memberId: "KSP-10555",
      userId: "member-2",
      name: "Siti Aminah",
      amount: 5000000,
      tenor: 12,
      purpose: "Modal Usaha",
      date: "2026-04-01",
      statusCode: "NEW",
      estimatedInstallment: 458334,
      reviewNote: null,
      loanProductId: "JP-001",
    },
    {
      id: "app-2",
      memberId: "KSP-10601",
      userId: "member-3",
      name: "Ahmad Fauzi",
      amount: 10000000,
      tenor: 24,
      purpose: "Renovasi Rumah",
      date: "2026-04-01",
      statusCode: "APPROVED",
      estimatedInstallment: 516667,
      reviewNote: null,
      loanProductId: "JP-001",
    },
    {
      id: "app-3",
      memberId: "KSP-10602",
      userId: "member-4",
      name: "Dewi Lestari",
      amount: 2000000,
      tenor: 6,
      purpose: "Pendidikan",
      date: "2026-03-28",
      statusCode: "REJECTED",
      estimatedInstallment: 353334,
      reviewNote: "Status anggota belum aktif.",
      loanProductId: "JP-002",
    },
  ],
  loans: [
    {
      id: "loan-1",
      memberId: "KSP-10248",
      userId: "member-1",
      name: "Budi Santoso",
      amount: 7500000,
      remaining: 5000000,
      installment: 750000,
      nextDueDate: "2026-05-12",
      tenor: 10,
      paidMonths: 3,
      statusCode: "ACTIVE",
      loanProductId: "JP-001",
    },
    {
      id: "loan-2",
      memberId: "KSP-10601",
      userId: "member-3",
      name: "Ahmad Fauzi",
      amount: 10000000,
      remaining: 10000000,
      installment: 516667,
      nextDueDate: "2026-05-01",
      tenor: 24,
      paidMonths: 0,
      statusCode: "ACTIVE",
      loanProductId: "JP-001",
    },
    {
      id: "loan-3",
      memberId: "KSP-10002",
      userId: "member-5",
      name: "Joko Anwar",
      amount: 15000000,
      remaining: 2000000,
      installment: 1500000,
      nextDueDate: "2026-04-10",
      tenor: 12,
      paidMonths: 10,
      statusCode: "DELINQUENT",
      loanProductId: "JP-002",
    },
  ],
  transactions: [
    {
      id: "trx-1",
      type: "Setoran Wajib",
      amount: 50000,
      date: "2026-04-01",
      status: "Berhasil",
      category: "simpanan",
      memberName: "Budi Santoso",
      memberCode: "KSP-10248",
      savingsProductId: "JS-002",
    },
    {
      id: "trx-2",
      type: "Angsuran Pinjaman",
      amount: 750000,
      date: "2026-03-12",
      status: "Berhasil",
      category: "pinjaman",
      memberName: "Budi Santoso",
      memberCode: "KSP-10248",
      loanId: "loan-1",
    },
    {
      id: "trx-3",
      type: "Setoran Sukarela",
      amount: 200000,
      date: "2026-03-05",
      status: "Berhasil",
      category: "simpanan",
      memberName: "Budi Santoso",
      memberCode: "KSP-10248",
      savingsProductId: "JS-003",
    },
    {
      id: "trx-4",
      type: "Setoran Wajib",
      amount: 50000,
      date: "2026-04-01",
      status: "Berhasil",
      category: "simpanan",
      memberName: "Siti Aminah",
      memberCode: "KSP-10555",
      savingsProductId: "JS-002",
    },
    {
      id: "trx-5",
      type: "Setoran Sukarela",
      amount: 500000,
      date: "2026-03-15",
      status: "Berhasil",
      category: "simpanan",
      memberName: "Siti Aminah",
      memberCode: "KSP-10555",
      savingsProductId: "JS-003",
    },
  ],
  announcements: [
    {
      id: "ann-1",
      title: "Rapat Anggota Tahunan",
      content: "Rapat Anggota Tahunan akan diadakan pada 20 Mei 2026 di Aula Utama.",
      date: "2026-03-10",
      isActive: true,
    },
    {
      id: "ann-2",
      title: "Perubahan Jam Operasional",
      content: "Selama bulan Ramadhan, jam operasional kantor maju 1 jam.",
      date: "2026-02-15",
      isActive: false,
    },
  ],
  notifications: [
    {
      id: "notif-1",
      userId: "member-1",
      title: "Pembayaran Berhasil",
      message: "Angsuran pinjaman bulan Maret telah diterima.",
      date: "2026-03-12",
      read: true,
    },
    {
      id: "notif-2",
      userId: "member-1",
      title: "Rapat Anggota Tahunan",
      message: "Rapat Anggota Tahunan akan diadakan pada 20 Mei 2026 di Aula Utama.",
      date: "2026-03-10",
      read: false,
    },
    {
      id: "notif-3",
      userId: "member-2",
      title: "Rapat Anggota Tahunan",
      message: "Rapat Anggota Tahunan akan diadakan pada 20 Mei 2026 di Aula Utama.",
      date: "2026-03-10",
      read: false,
    },
    {
      id: "notif-4",
      userId: "member-3",
      title: "Pinjaman Disetujui",
      message: "Pengajuan pinjaman Anda sebesar Rp10000000 telah disetujui.",
      date: "2026-04-01",
      read: false,
    },
    {
      id: "notif-5",
      userId: "member-5",
      title: "Pengingat Pembayaran",
      message: "Terdapat keterlambatan pembayaran pinjaman. Mohon lakukan pembayaran segera.",
      date: "2026-04-03",
      read: false,
    },
  ],
  counters: {
    member: 20000,
    app: 10,
    loan: 10,
    trx: 10,
    notif: 10,
    ann: 10,
    savings: 10,
    loanProduct: 10,
  },
});

const getUserOrThrow = (store: DemoStore, userId: string) => {
  const user = store.users.find((item) => item.id === userId);
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "User was not found.");
  return user;
};

const getAdminOrThrow = (store: DemoStore, userId: string) => {
  const user = getUserOrThrow(store, userId);
  if (user.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "You do not have access to this resource.");
  }
  return user;
};

const getMemberOrThrow = (store: DemoStore, userId: string) => {
  const user = getUserOrThrow(store, userId);
  if (user.role !== "member") {
    throw new AppError(404, "MEMBER_NOT_FOUND", "Member dashboard is unavailable.");
  }
  return user;
};

const nextCounter = (store: DemoStore, key: keyof DemoStore["counters"]) => {
  store.counters[key] += 1;
  return store.counters[key];
};

const nextMemberCode = (store: DemoStore) => `KSP-${String(nextCounter(store, "member")).padStart(5, "0")}`;

const mapLoanApplication = (item: DemoLoanApplication): LoanApplicationItem => ({
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

const mapLoan = (item: DemoLoan, memberFacing = false): LoanListItem => ({
  id: item.id,
  memberId: item.memberId,
  name: item.name,
  amount: item.amount,
  remaining: item.remaining,
  installment: item.installment,
  nextDueDate: item.nextDueDate,
  tenor: item.tenor,
  paidMonths: item.paidMonths,
  status: toLoanStatusLabel(item.statusCode, memberFacing),
});

const findUserByPhone = (store: DemoStore, phone: string) =>
  store.users.find((user) => normalizePhone(user.phone) === normalizePhone(phone));

const getSavingsSummary = (store: DemoStore, memberCode: string): MemberDashboard["savings"] => {
  const balances = store.memberBalances[memberCode] ?? {};
  const summary = {
    pokok: balances["JS-001"] ?? 0,
    wajib: balances["JS-002"] ?? 0,
    sukarela: balances["JS-003"] ?? 0,
    total: 0,
  };
  summary.total = summary.pokok + summary.wajib + summary.sukarela;
  return summary;
};

const listMemberTransactions = (store: DemoStore, memberCode: string) =>
  store.transactions
    .filter((item) => item.memberCode === memberCode)
    .sort((left, right) => right.date.localeCompare(left.date))
    .map((item) => clone(item));

const listUserNotifications = (store: DemoStore, userId: string) =>
  store.notifications
    .filter((item) => item.userId === userId)
    .sort((left, right) => right.date.localeCompare(left.date))
    .map(({ userId: _userId, ...item }) => clone(item));

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
    .map((loan) => mapLoan(loan, false));

const fanOutAnnouncementNotifications = (
  store: DemoStore,
  announcement: DemoStore["announcements"][number],
) => {
  const activeMembers = store.users.filter((user) => user.role === "member" && user.status === "Aktif");
  for (const member of activeMembers) {
    store.notifications.push({
      id: `notif-${nextCounter(store, "notif")}`,
      userId: member.id,
      title: announcement.title,
      message: announcement.content,
      date: getToday(),
      read: false,
    });
  }
};

export const createDemoServices = (): AppServices => {
  const store = createDemoStore();

  return {
    auth: {
      async login(input) {
        const user = findUserByPhone(store, input.phone);
        if (!user || user.password !== input.password) {
          throw new AppError(401, "INVALID_CREDENTIALS", "Invalid phone number or password.");
        }

        return {
          token: createJwt({
            userId: user.id,
            role: user.role,
            name: user.name,
            phone: user.phone,
          }),
          user: clone({
            id: user.id,
            role: user.role,
            name: user.name,
            phone: user.phone,
            email: user.email,
            address: user.address,
            memberId: user.memberId,
          }),
        };
      },
    },
    me: {
      async getCurrentUser(userId) {
        const user = getUserOrThrow(store, userId);
        return clone({
          id: user.id,
          role: user.role,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          memberId: user.memberId,
        });
      },
      async updateProfile(userId, input) {
        const user = getUserOrThrow(store, userId);
        user.name = input.name.trim();
        user.phone = normalizePhone(input.phone);
        user.email = input.email?.trim() || null;
        user.address = input.address?.trim() || null;
        return clone({
          id: user.id,
          role: user.role,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          memberId: user.memberId,
        });
      },
      async changePassword(userId, input) {
        const user = getUserOrThrow(store, userId);
        if (user.password !== input.currentPassword) {
          throw new AppError(400, "INVALID_PASSWORD", "Current password is incorrect.");
        }
        user.password = input.newPassword;
      },
    },
    member: {
      async getDashboard(userId) {
        const user = getMemberOrThrow(store, userId);
        const activeLoan = store.loans.find(
          (loan) => loan.memberId === user.memberId && isActiveLoanStatus(loan.statusCode),
        );

        return clone({
          user: {
            id: user.id,
            role: user.role,
            name: user.name,
            phone: user.phone,
            email: user.email,
            address: user.address,
            memberId: user.memberId,
          },
          savings: getSavingsSummary(store, user.memberId),
          activeLoan: activeLoan ? mapLoan(activeLoan, true) : null,
          recentTransactions: listMemberTransactions(store, user.memberId).slice(0, 20),
          notifications: listUserNotifications(store, user.id).slice(0, 50),
        });
      },
      async createLoanApplication(userId, input) {
        const user = getMemberOrThrow(store, userId);
        if (store.loans.some((loan) => loan.memberId === user.memberId && isActiveLoanStatus(loan.statusCode))) {
          throw new AppError(
            409,
            "ACTIVE_LOAN_EXISTS",
            "This member already has an active loan and cannot submit a new application.",
          );
        }

        const loanProduct =
          (input.loanProductId
            ? store.loanProducts.find((item) => item.id === input.loanProductId && item.isActive)
            : undefined) ?? store.loanProducts.find((item) => item.isActive);

        if (!loanProduct) {
          throw new AppError(400, "LOAN_PRODUCT_MISSING", "No active loan product is configured.");
        }
        if (input.amount > loanProduct.maxAmount) {
          throw new AppError(400, "AMOUNT_TOO_HIGH", "Requested amount exceeds the configured loan product limit.");
        }
        if (input.tenor > loanProduct.maxTenor) {
          throw new AppError(400, "TENOR_TOO_HIGH", "Requested tenor exceeds the configured loan product limit.");
        }

        const application: DemoLoanApplication = {
          id: `app-${nextCounter(store, "app")}`,
          userId: user.id,
          memberId: user.memberId,
          name: user.name,
          amount: input.amount,
          tenor: input.tenor,
          purpose: input.purpose.trim(),
          date: getToday(),
          statusCode: "NEW",
          estimatedInstallment: computeInstallment(input.amount, input.tenor, loanProduct.interestRate),
          reviewNote: null,
          loanProductId: loanProduct.id,
        };
        store.loanApplications.unshift(application);
        return mapLoanApplication(application);
      },
    },
    admin: {
      async getDashboard(userId) {
        const admin = getAdminOrThrow(store, userId);
        const members = listAdminMembers(store);
        const activeLoans = store.loans.filter((loan) => isActiveLoanStatus(loan.statusCode));
        const pendingApplications = store.loanApplications.filter(
          (item) => item.statusCode === "NEW" || item.statusCode === "UNDER_REVIEW",
        );
        const totalSavings = members.reduce((sum, item) => sum + item.totalSavings, 0);
        const totalLoans = store.loans.reduce((sum, item) => sum + item.amount, 0);

        return clone({
          user: {
            id: admin.id,
            role: admin.role,
            name: admin.name,
            phone: admin.phone,
            email: admin.email,
            address: admin.address,
            memberId: admin.memberId,
          },
          stats: {
            totalMembers: members.length,
            totalSavings,
            totalLoans,
            pendingApplications: pendingApplications.length,
            activeLoansCount: activeLoans.length,
            dueToday: activeLoans.filter((loan) => loan.nextDueDate <= getToday()).length,
          },
          loanApplications: pendingApplications.map(mapLoanApplication),
          transactions: store.transactions
            .slice()
            .sort((left, right) => right.date.localeCompare(left.date))
            .slice(0, 10)
            .map((item) => clone(item)),
        });
      },
      async listMembers(userId) {
        getAdminOrThrow(store, userId);
        return clone(listAdminMembers(store));
      },
      async createMember(userId, input) {
        getAdminOrThrow(store, userId);
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
        };
        store.users.push(user);
        store.memberBalances[memberCode] = Object.fromEntries(
          store.savingsProducts.map((product) => [product.id, 0]),
        );
        return clone({
          id: memberCode,
          name: user.name,
          phone: user.phone,
          status: input.status,
          totalSavings: 0,
          hasActiveLoan: false,
          address: user.address,
          email: user.email,
        });
      },
      async updateMember(userId, memberId, input) {
        getAdminOrThrow(store, userId);
        const user = store.users.find((item) => item.memberId === memberId && item.role === "member");
        if (!user) throw new AppError(404, "MEMBER_NOT_FOUND", "Member was not found.");
        user.name = input.name.trim();
        user.phone = normalizePhone(input.phone);
        user.email = input.email?.trim() || null;
        user.address = input.address?.trim() || null;
        user.status = input.status;
        return clone({
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
        });
      },
      async deleteMember(userId, memberId) {
        getAdminOrThrow(store, userId);
        const user = store.users.find((item) => item.memberId === memberId && item.role === "member");
        if (!user) throw new AppError(404, "MEMBER_NOT_FOUND", "Member was not found.");

        const hasHistory =
          store.loans.some((loan) => loan.memberId === memberId) ||
          store.loanApplications.some((item) => item.memberId === memberId) ||
          store.transactions.some((item) => item.memberCode === memberId);

        if (hasHistory) {
          throw new AppError(
            409,
            "MEMBER_HAS_HISTORY",
            "Members with transaction or loan history cannot be deleted. Set them inactive instead.",
          );
        }

        store.users = store.users.filter((item) => item.id !== user.id);
        delete store.memberBalances[memberId];
      },
      async listSavingsProducts(userId) {
        getAdminOrThrow(store, userId);
        return clone(store.savingsProducts);
      },
      async createSavingsProduct(userId, input) {
        getAdminOrThrow(store, userId);
        const product: SavingsProductItem = {
          id: `JS-${String(nextCounter(store, "savings")).padStart(3, "0")}`,
          name: input.name.trim(),
          amount: input.amount,
          isMandatory: input.isMandatory,
        };
        store.savingsProducts.push(product);
        for (const memberCode of Object.keys(store.memberBalances)) {
          store.memberBalances[memberCode][product.id] = 0;
        }
        return clone(product);
      },
      async updateSavingsProduct(userId, productId, input) {
        getAdminOrThrow(store, userId);
        const product = store.savingsProducts.find((item) => item.id === productId);
        if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Savings product was not found.");
        product.name = input.name.trim();
        product.amount = input.amount;
        product.isMandatory = input.isMandatory;
        return clone(product);
      },
      async deleteSavingsProduct(userId, productId) {
        getAdminOrThrow(store, userId);
        const hasBalances = Object.values(store.memberBalances).some((balances) => (balances[productId] ?? 0) > 0);
        const hasTransactions = store.transactions.some((item) => item.savingsProductId === productId);
        if (hasBalances || hasTransactions) {
          throw new AppError(
            409,
            "PRODUCT_IN_USE",
            "Savings products with balances or transactions cannot be deleted.",
          );
        }
        store.savingsProducts = store.savingsProducts.filter((item) => item.id !== productId);
        for (const balances of Object.values(store.memberBalances)) {
          delete balances[productId];
        }
      },
      async listLoanProducts(userId) {
        getAdminOrThrow(store, userId);
        return clone(
          store.loanProducts.map((item) => ({
            id: item.id,
            name: item.name,
            maxAmount: item.maxAmount,
            interestRate: item.interestRate,
            adminFeeRate: item.adminFeeRate,
            maxTenor: item.maxTenor,
          })),
        );
      },
      async createLoanProduct(userId, input) {
        getAdminOrThrow(store, userId);
        const product: DemoLoanProduct = {
          id: `JP-${String(nextCounter(store, "loanProduct")).padStart(3, "0")}`,
          name: input.name.trim(),
          maxAmount: input.maxAmount,
          interestRate: input.interestRate,
          adminFeeRate: input.adminFeeRate,
          maxTenor: input.maxTenor,
          isActive: true,
        };
        store.loanProducts.push(product);
        return clone({
          id: product.id,
          name: product.name,
          maxAmount: product.maxAmount,
          interestRate: product.interestRate,
          adminFeeRate: product.adminFeeRate,
          maxTenor: product.maxTenor,
        });
      },
      async updateLoanProduct(userId, productId, input) {
        getAdminOrThrow(store, userId);
        const product = store.loanProducts.find((item) => item.id === productId);
        if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Loan product was not found.");
        product.name = input.name.trim();
        product.maxAmount = input.maxAmount;
        product.interestRate = input.interestRate;
        product.adminFeeRate = input.adminFeeRate;
        product.maxTenor = input.maxTenor;
        return clone({
          id: product.id,
          name: product.name,
          maxAmount: product.maxAmount,
          interestRate: product.interestRate,
          adminFeeRate: product.adminFeeRate,
          maxTenor: product.maxTenor,
        });
      },
      async deleteLoanProduct(userId, productId) {
        getAdminOrThrow(store, userId);
        const hasApplications = store.loanApplications.some((item) => item.loanProductId === productId);
        const hasLoans = store.loans.some((item) => item.loanProductId === productId);
        if (hasApplications || hasLoans) {
          throw new AppError(
            409,
            "PRODUCT_IN_USE",
            "Loan products with applications or loans cannot be deleted.",
          );
        }
        store.loanProducts = store.loanProducts.filter((item) => item.id !== productId);
      },
      async listAnnouncements(userId) {
        getAdminOrThrow(store, userId);
        return clone(store.announcements.slice().sort((left, right) => right.date.localeCompare(left.date)));
      },
      async createAnnouncement(userId, input) {
        getAdminOrThrow(store, userId);
        const announcement = {
          id: `ann-${nextCounter(store, "ann")}`,
          title: input.title.trim(),
          content: input.content.trim(),
          isActive: input.isActive,
          date: getToday(),
        };
        store.announcements.unshift(announcement);
        if (announcement.isActive) {
          fanOutAnnouncementNotifications(store, announcement);
        }
        return clone(announcement);
      },
      async updateAnnouncement(userId, announcementId, input) {
        getAdminOrThrow(store, userId);
        const announcement = store.announcements.find((item) => item.id === announcementId);
        if (!announcement) {
          throw new AppError(404, "ANNOUNCEMENT_NOT_FOUND", "Announcement was not found.");
        }
        const wasActive = announcement.isActive;
        announcement.title = input.title.trim();
        announcement.content = input.content.trim();
        announcement.isActive = input.isActive;
        announcement.date = getToday();
        if (!wasActive && announcement.isActive) {
          fanOutAnnouncementNotifications(store, announcement);
        }
        return clone(announcement);
      },
      async deleteAnnouncement(userId, announcementId) {
        getAdminOrThrow(store, userId);
        store.announcements = store.announcements.filter((item) => item.id !== announcementId);
      },
      async listLoanApplications(userId) {
        getAdminOrThrow(store, userId);
        return clone(
          store.loanApplications
            .slice()
            .sort((left, right) => right.date.localeCompare(left.date))
            .map(mapLoanApplication),
        );
      },
      async reviewLoanApplication(userId, applicationId, input) {
        getAdminOrThrow(store, userId);
        const application = store.loanApplications.find((item) => item.id === applicationId);
        if (!application) {
          throw new AppError(404, "APPLICATION_NOT_FOUND", "Loan application was not found.");
        }
        if (application.statusCode === "APPROVED" || application.statusCode === "REJECTED") {
          throw new AppError(409, "APPLICATION_FINALIZED", "This application has already been finalized.");
        }

        if (input.status === "Ditinjau") {
          application.statusCode = "UNDER_REVIEW";
        } else if (input.status === "Ditolak") {
          application.statusCode = "REJECTED";
        } else {
          if (store.loans.some((loan) => loan.memberId === application.memberId && isActiveLoanStatus(loan.statusCode))) {
            throw new AppError(
              409,
              "ACTIVE_LOAN_EXISTS",
              "This member already has an active loan and cannot receive another one.",
            );
          }
          application.statusCode = "APPROVED";
          store.loans.unshift({
            id: `loan-${nextCounter(store, "loan")}`,
            memberId: application.memberId,
            userId: application.userId,
            name: application.name,
            amount: application.amount,
            remaining: application.amount,
            installment: application.estimatedInstallment,
            nextDueDate: getFutureDate(1),
            tenor: application.tenor,
            paidMonths: 0,
            statusCode: "ACTIVE",
            loanProductId: application.loanProductId,
          });
          store.notifications.unshift({
            id: `notif-${nextCounter(store, "notif")}`,
            userId: application.userId,
            title: "Pinjaman Disetujui",
            message: `Pengajuan pinjaman Anda sebesar Rp${application.amount} telah disetujui.`,
            date: getToday(),
            read: false,
          });
        }

        application.reviewNote = input.reviewNote?.trim() || null;
        return mapLoanApplication(application);
      },
      async listLoans(userId) {
        getAdminOrThrow(store, userId);
        return clone(listAdminLoans(store));
      },
      async recordLoanPayment(userId, loanId, input) {
        getAdminOrThrow(store, userId);
        const loan = store.loans.find((item) => item.id === loanId);
        if (!loan) throw new AppError(404, "LOAN_NOT_FOUND", "Loan was not found.");
        if (loan.statusCode === "COMPLETED") {
          throw new AppError(409, "LOAN_COMPLETED", "This loan is already completed.");
        }
        if (input.amount > loan.remaining) {
          throw new AppError(400, "OVERPAYMENT", "Payment amount cannot exceed the remaining loan balance.");
        }

        loan.remaining = Math.max(0, loan.remaining - input.amount);
        loan.paidMonths += 1;
        loan.statusCode = loan.remaining === 0 ? "COMPLETED" : "ACTIVE";
        loan.nextDueDate = loan.statusCode === "COMPLETED" ? loan.nextDueDate : getFutureDate(1);

        const transaction: DemoTransaction = {
          id: `trx-${nextCounter(store, "trx")}`,
          type: "Angsuran Pinjaman",
          amount: input.amount,
          date: getToday(),
          status: "Berhasil",
          category: "pinjaman",
          memberName: loan.name,
          memberCode: loan.memberId,
          loanId: loan.id,
        };
        store.transactions.unshift(transaction);
        store.notifications.unshift({
          id: `notif-${nextCounter(store, "notif")}`,
          userId: loan.userId,
          title: "Pembayaran Berhasil",
          message:
            loan.statusCode === "COMPLETED"
              ? `Pembayaran pinjaman Anda sebesar Rp${input.amount} telah melunasi pinjaman.`
              : `Angsuran pinjaman sebesar Rp${input.amount} telah dicatat. Sisa pinjaman Anda Rp${loan.remaining}.`,
          date: getToday(),
          read: false,
        });
        return clone(transaction);
      },
    },
    notifications: {
      async list(userId) {
        getUserOrThrow(store, userId);
        return clone(listUserNotifications(store, userId));
      },
      async markRead(userId, notificationId) {
        const notification = store.notifications.find(
          (item) => item.id === notificationId && item.userId === userId,
        );
        if (!notification) {
          throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification was not found.");
        }
        notification.read = true;
        const { userId: _userId, ...payload } = notification;
        return clone(payload);
      },
    },
    transactions: {
      async list(userId, role) {
        if (role === "admin") {
          getAdminOrThrow(store, userId);
          return clone(
            store.transactions.slice().sort((left, right) => right.date.localeCompare(left.date)),
          );
        }

        const user = getMemberOrThrow(store, userId);
        return clone(listMemberTransactions(store, user.memberId));
      },
    },
  };
};
