import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  api,
  ApiError,
  clearSession,
  loadSession,
  saveSession,
  type AdminBundle,
  type AnnouncementItem,
  type AuthSession,
  type LoanApplicationItem,
  type LoanProductItem,
  type MemberDashboard,
  type MemberListItem,
  type SavingsProductItem,
  type UserSummary,
} from "@/api";

type AdminCurrentData = AdminBundle["dashboard"] & {
  members: MemberListItem[];
  activeLoans: AdminBundle["loans"];
  announcements: AnnouncementItem[];
  transactions: AdminBundle["dashboard"]["transactions"];
  loanApplications: LoanApplicationItem[];
  masterData: {
    jenisSimpanan: SavingsProductItem[];
    jenisPinjaman: LoanProductItem[];
  };
};

type DataContextType = {
  authReady: boolean;
  isAuthenticated: boolean;
  role: "admin" | "member" | null;
  currentUser: string | null;
  currentData: AdminCurrentData | MemberDashboard | null;
  login: (phone: string, password: string) => Promise<"admin" | "member">;
  logout: () => void;
  refreshCurrentData: () => Promise<void>;
  addLoanApplication: (input: { amount: number; tenor: number; purpose: string; loanProductId?: string }) => Promise<void>;
  updateLoanApplicationStatus: (appId: string, status: "Ditinjau" | "Disetujui" | "Ditolak") => Promise<void>;
  addAnnouncement: (announcement: { title: string; content: string; isActive: boolean }) => Promise<void>;
  editAnnouncement: (announcement: { id: string; title: string; content: string; isActive: boolean }) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  addPayment: (loanId: string, amount: number, method: "Transfer" | "Tunai", note?: string | null) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  addMember: (member: { name: string; phone: string; password: string; status: "Aktif" | "Nonaktif" }) => Promise<void>;
  updateMember: (member: { id: string; name: string; phone: string; status: "Aktif" | "Nonaktif" }) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addSavingsProduct: (product: { name: string; amount: number; isMandatory: boolean }) => Promise<void>;
  updateSavingsProduct: (product: { id: string; name: string; amount: number; isMandatory: boolean }) => Promise<void>;
  deleteSavingsProduct: (id: string) => Promise<void>;
  addLoanProduct: (product: { name: string; maxAmount: number; interestRate: number; adminFeeRate: number; maxTenor: number }) => Promise<void>;
  updateLoanProduct: (product: { id: string; name: string; maxAmount: number; interestRate: number; adminFeeRate: number; maxTenor: number }) => Promise<void>;
  deleteLoanProduct: (id: string) => Promise<void>;
  updateProfile: (input: { name: string; phone: string; email?: string | null; address?: string | null }) => Promise<UserSummary>;
  changePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const toAdminCurrentData = (
  bundle: AdminBundle,
  loanApplications: LoanApplicationItem[],
  transactions: AdminBundle["dashboard"]["transactions"],
): AdminCurrentData => ({
  ...bundle.dashboard,
  members: bundle.members,
  activeLoans: bundle.loans,
  announcements: bundle.announcements,
  transactions,
  loanApplications,
  masterData: {
    jenisSimpanan: bundle.savingsProducts,
    jenisPinjaman: bundle.loanProducts,
  },
});

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.code === "DATABASE_UNAVAILABLE") {
      return "Backend aktif, tetapi database belum bisa dihubungi. Periksa koneksi Supabase atau jalankan backend dengan database yang tersedia.";
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Terjadi kesalahan yang tidak terduga.";
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(loadSession());
  const [currentData, setCurrentData] = useState<AdminCurrentData | MemberDashboard | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const role = session?.user.role ?? null;

  const requireSession = () => {
    if (!session) {
      throw new Error("Sesi tidak tersedia.");
    }
    return session;
  };

  const loadCurrentData = async (activeSession: AuthSession) => {
    if (activeSession.user.role === "admin") {
      const [bundle, loanApplications, transactions] = await Promise.all([
        api.getAdminBundle(activeSession.token),
        api.listLoanApplications(activeSession.token),
        api.listTransactions(activeSession.token),
      ]);
      setCurrentData(toAdminCurrentData(bundle, loanApplications, transactions));
      return;
    }

    const dashboard = await api.getMemberDashboard(activeSession.token);
    setCurrentData(dashboard);
  };

  const logout = () => {
    clearSession();
    setSession(null);
    setCurrentData(null);
  };

  const refreshCurrentData = async () => {
    const activeSession = requireSession();
    await loadCurrentData(activeSession);
  };

  useEffect(() => {
    const initialize = async () => {
      const cached = loadSession();
      if (!cached) {
        setAuthReady(true);
        return;
      }

      try {
        const user = await api.getMe(cached.token);
        const nextSession = { ...cached, user };
        saveSession(nextSession);
        setSession(nextSession);
        await loadCurrentData(nextSession);
      } catch {
        clearSession();
        setSession(null);
        setCurrentData(null);
      } finally {
        setAuthReady(true);
      }
    };

    void initialize();
  }, []);

  const withRefresh = async (callback: (activeSession: AuthSession) => Promise<unknown>) => {
    const activeSession = requireSession();
    await callback(activeSession);
    await loadCurrentData(activeSession);
  };

  const value: DataContextType = {
    authReady,
    isAuthenticated: Boolean(session),
    role,
    currentUser: session?.user.id ?? null,
    currentData,
    async login(phone, password) {
      const result = await api.login({ phone, password });
      const nextSession: AuthSession = {
        token: result.token,
        user: result.user,
      };
      saveSession(nextSession);
      setSession(nextSession);
      await loadCurrentData(nextSession);
      setAuthReady(true);
      return result.user.role;
    },
    logout,
    refreshCurrentData,
    async addLoanApplication(input) {
      await withRefresh((activeSession) => api.createLoanApplication(activeSession.token, input));
    },
    async updateLoanApplicationStatus(appId, status) {
      await withRefresh((activeSession) =>
        api.reviewLoanApplication(activeSession.token, appId, { status }),
      );
    },
    async addAnnouncement(announcement) {
      await withRefresh((activeSession) => api.createAnnouncement(activeSession.token, announcement));
    },
    async editAnnouncement(announcement) {
      await withRefresh((activeSession) =>
        api.updateAnnouncement(activeSession.token, announcement.id, announcement),
      );
    },
    async deleteAnnouncement(id) {
      await withRefresh((activeSession) => api.deleteAnnouncement(activeSession.token, id));
    },
    async addPayment(loanId, amount, method, note) {
      await withRefresh((activeSession) =>
        api.recordLoanPayment(activeSession.token, loanId, { amount, method, note }),
      );
    },
    async markNotificationRead(notifId) {
      const activeSession = requireSession();
      await api.markNotificationRead(activeSession.token, notifId);

      if (currentData && "notifications" in currentData) {
        setCurrentData({
          ...currentData,
          notifications: currentData.notifications.map((notif) =>
            notif.id === notifId ? { ...notif, read: true } : notif,
          ),
        });
      }
    },
    async addMember(member) {
      await withRefresh((activeSession) => api.createMember(activeSession.token, member));
    },
    async updateMember(member) {
      const { id, ...payload } = member;
      await withRefresh((activeSession) => api.updateMember(activeSession.token, id, payload));
    },
    async deleteMember(id) {
      await withRefresh((activeSession) => api.deleteMember(activeSession.token, id));
    },
    async addSavingsProduct(product) {
      await withRefresh((activeSession) => api.createSavingsProduct(activeSession.token, product));
    },
    async updateSavingsProduct(product) {
      const { id, ...payload } = product;
      await withRefresh((activeSession) =>
        api.updateSavingsProduct(activeSession.token, id, payload),
      );
    },
    async deleteSavingsProduct(id) {
      await withRefresh((activeSession) => api.deleteSavingsProduct(activeSession.token, id));
    },
    async addLoanProduct(product) {
      await withRefresh((activeSession) => api.createLoanProduct(activeSession.token, product));
    },
    async updateLoanProduct(product) {
      const { id, ...payload } = product;
      await withRefresh((activeSession) => api.updateLoanProduct(activeSession.token, id, payload));
    },
    async deleteLoanProduct(id) {
      await withRefresh((activeSession) => api.deleteLoanProduct(activeSession.token, id));
    },
    async updateProfile(input) {
      const activeSession = requireSession();
      const user = await api.updateProfile(activeSession.token, input);
      const nextSession = { ...activeSession, user };
      saveSession(nextSession);
      setSession(nextSession);
      await loadCurrentData(nextSession);
      return user;
    },
    async changePassword(input) {
      const activeSession = requireSession();
      await api.changePassword(activeSession.token, input);
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export const getUserFacingError = getErrorMessage;


