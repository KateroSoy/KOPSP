export type AppRole = "admin" | "member";

export type UserSummary = {
  id: string;
  role: AppRole;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  memberId: string;
};

export type SavingsSummary = {
  pokok: number;
  wajib: number;
  sukarela: number;
  total: number;
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

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  date: string;
  isActive: boolean;
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

export type MemberDashboard = {
  user: UserSummary;
  savings: SavingsSummary;
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

export type AdminBundle = {
  dashboard: AdminDashboard;
  members: MemberListItem[];
  savingsProducts: SavingsProductItem[];
  loanProducts: LoanProductItem[];
  announcements: AnnouncementItem[];
  loans: LoanListItem[];
};

export type AuthSession = {
  token: string;
  user: UserSummary;
};

type ApiEnvelope<T> =
  | { success: true; data: T; meta?: Record<string, unknown> }
  | { success: false; error: { code: string; message: string; details?: unknown } };

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://127.0.0.1:4000" : "");
const SESSION_KEY = "simpan-pinjam-session";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;

  if (!response.ok || !payload || !payload.success) {
    const error =
      payload && payload.success === false ? payload.error : undefined;
    throw new ApiError(
      error?.message || `Request failed with status ${response.status}`,
      response.status,
      error?.code,
      error?.details,
    );
  }

  return payload.data;
}

export const saveSession = (session: AuthSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const loadSession = (): AuthSession | null => {
  const value = localStorage.getItem(SESSION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const api = {
  login: (input: { phone: string; password: string }) =>
    request<{ token: string; user: UserSummary }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getMe: (token: string) => request<UserSummary>("/api/me", {}, token),
  updateProfile: (
    token: string,
    input: { name: string; phone: string; email?: string | null; address?: string | null },
  ) =>
    request<UserSummary>(
      "/api/me/profile",
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
      token,
    ),
  changePassword: (
    token: string,
    input: { currentPassword: string; newPassword: string },
  ) =>
    request<{ changed: boolean }>(
      "/api/me/password",
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
      token,
    ),
  getMemberDashboard: (token: string) => request<MemberDashboard>("/api/member/dashboard", {}, token),
  createLoanApplication: (
    token: string,
    input: { amount: number; tenor: number; purpose: string; loanProductId?: string },
  ) =>
    request<LoanApplicationItem>(
      "/api/member/loan-applications",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    ),
  getAdminBundle: (token: string) => request<AdminBundle>("/api/admin/bundle", {}, token),
  listLoanApplications: (token: string) => request<LoanApplicationItem[]>("/api/admin/loan-applications", {}, token),
  reviewLoanApplication: (
    token: string,
    id: string,
    input: { status: "Ditinjau" | "Disetujui" | "Ditolak"; reviewNote?: string | null },
  ) =>
    request<LoanApplicationItem>(
      `/api/admin/loan-applications/${id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
      token,
    ),
  createMember: (
    token: string,
    input: {
      name: string;
      phone: string;
      password: string;
      status: "Aktif" | "Nonaktif";
      email?: string | null;
      address?: string | null;
    },
  ) =>
    request<MemberListItem>(
      "/api/admin/members",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    ),
  updateMember: (
    token: string,
    id: string,
    input: {
      name: string;
      phone: string;
      status: "Aktif" | "Nonaktif";
      email?: string | null;
      address?: string | null;
    },
  ) =>
    request<MemberListItem>(
      `/api/admin/members/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
      token,
    ),
  deleteMember: (token: string, id: string) =>
    request<{ deleted: boolean }>(
      `/api/admin/members/${id}`,
      {
        method: "DELETE",
      },
      token,
    ),
  createSavingsProduct: (
    token: string,
    input: { name: string; amount: number; isMandatory: boolean },
  ) =>
    request<SavingsProductItem>(
      "/api/admin/savings-products",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    ),
  updateSavingsProduct: (
    token: string,
    id: string,
    input: { name: string; amount: number; isMandatory: boolean },
  ) =>
    request<SavingsProductItem>(
      `/api/admin/savings-products/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
      token,
    ),
  deleteSavingsProduct: (token: string, id: string) =>
    request<{ deleted: boolean }>(
      `/api/admin/savings-products/${id}`,
      {
        method: "DELETE",
      },
      token,
    ),
  createLoanProduct: (
    token: string,
    input: {
      name: string;
      maxAmount: number;
      interestRate: number;
      adminFeeRate: number;
      maxTenor: number;
    },
  ) =>
    request<LoanProductItem>(
      "/api/admin/loan-products",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    ),
  updateLoanProduct: (
    token: string,
    id: string,
    input: {
      name: string;
      maxAmount: number;
      interestRate: number;
      adminFeeRate: number;
      maxTenor: number;
    },
  ) =>
    request<LoanProductItem>(
      `/api/admin/loan-products/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
      token,
    ),
  deleteLoanProduct: (token: string, id: string) =>
    request<{ deleted: boolean }>(
      `/api/admin/loan-products/${id}`,
      {
        method: "DELETE",
      },
      token,
    ),
  createAnnouncement: (
    token: string,
    input: { title: string; content: string; isActive: boolean },
  ) =>
    request<AnnouncementItem>(
      "/api/admin/announcements",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    ),
  updateAnnouncement: (
    token: string,
    id: string,
    input: { title: string; content: string; isActive: boolean },
  ) =>
    request<AnnouncementItem>(
      `/api/admin/announcements/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
      token,
    ),
  deleteAnnouncement: (token: string, id: string) =>
    request<{ deleted: boolean }>(
      `/api/admin/announcements/${id}`,
      {
        method: "DELETE",
      },
      token,
    ),
  recordLoanPayment: (
    token: string,
    id: string,
    input: { amount: number; method: "Transfer" | "Tunai"; note?: string | null },
  ) =>
    request<TransactionItem>(
      `/api/admin/loans/${id}/payments`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
      token,
    ),
  listTransactions: (token: string) => request<TransactionItem[]>("/api/transactions", {}, token),
  listNotifications: (token: string) => request<NotificationItem[]>("/api/notifications", {}, token),
  markNotificationRead: (token: string, id: string) =>
    request<NotificationItem>(
      `/api/notifications/${id}/read`,
      {
        method: "PATCH",
      },
      token,
    ),
};


