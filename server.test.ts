import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./server.app.js";
import type { AppServices, MemberDashboard, UserSummary } from "./server.types.js";
import { AppError, createJwt } from "./server.utils.js";

const adminUser: UserSummary = {
  id: "admin-1",
  role: "admin",
  name: "Admin KSP",
  phone: "08111111111",
  email: "admin@koperasi.com",
  address: "Kantor Pusat",
  memberId: "ADM-001",
};

const memberUser: UserSummary = {
  id: "member-1",
  role: "member",
  name: "Budi Santoso",
  phone: "08222222222",
  email: null,
  address: "Jl. Merdeka",
  memberId: "KSP-10248",
};

const memberDashboard: MemberDashboard = {
  user: memberUser,
  savings: {
    pokok: 500000,
    wajib: 1250000,
    sukarela: 3800000,
    total: 5550000,
  },
  activeLoan: null,
  recentTransactions: [],
  notifications: [],
};

const makeServices = (): AppServices => ({
  auth: {
    login: vi.fn().mockResolvedValue({
      token: "token-123",
      user: adminUser,
    }),
  },
  me: {
    getCurrentUser: vi.fn().mockResolvedValue(adminUser),
    updateProfile: vi.fn().mockResolvedValue(adminUser),
    changePassword: vi.fn().mockResolvedValue(undefined),
  },
  member: {
    getDashboard: vi.fn().mockResolvedValue(memberDashboard),
    createLoanApplication: vi.fn().mockResolvedValue({
      id: "app-1",
      memberId: memberUser.memberId,
      name: memberUser.name,
      amount: 2000000,
      tenor: 6,
      purpose: "Pendidikan",
      date: "2026-04-04",
      status: "Baru",
      estimatedInstallment: 353334,
    }),
  },
  admin: {
    getDashboard: vi.fn().mockResolvedValue({
      user: adminUser,
      stats: {
        totalMembers: 5,
        totalSavings: 1000000,
        totalLoans: 2000000,
        pendingApplications: 1,
        activeLoansCount: 2,
        dueToday: 0,
      },
      loanApplications: [],
      transactions: [],
    }),
    listMembers: vi.fn().mockResolvedValue([]),
    getSummaryReport: vi.fn().mockResolvedValue({
      period: {
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        label: "Bulan ini",
      },
      metrics: {
        totalActiveMembers: 5,
        totalSavings: 1000000,
        totalActiveLoans: 2000000,
        totalInstallmentsToday: 750000,
        totalArrears: 250000,
        cashBalance: 5000000,
        loansDisbursedThisMonth: 2000000,
        savingsInThisMonth: 300000,
      },
      quickStats: {
        pendingApplications: 1,
        dueToday: 0,
        delinquentLoans: 1,
        inactiveMembers: 1,
      },
      recentTransactions: [],
      latestApplications: [],
    }),
    getMembersReport: vi.fn().mockResolvedValue({
      summary: {
        totalMembers: 5,
        activeMembers: 4,
        inactiveMembers: 1,
        membersWithActiveLoans: 2,
        membersInArrears: 1,
      },
      items: [],
    }),
    getSavingsReport: vi.fn().mockResolvedValue({
      summary: {
        periodTotal: 500000,
        totalPokok: 1000000,
        totalWajib: 1500000,
        totalSukarela: 2000000,
        transactionCount: 4,
      },
      transactions: [],
      memberTotals: [],
    }),
    getLoansReport: vi.fn().mockResolvedValue({
      summary: {
        activeCount: 2,
        completedCount: 1,
        disbursedTotal: 10000000,
        remainingTotal: 6000000,
        delinquentCount: 1,
      },
      items: [],
    }),
    getInstallmentsReport: vi.fn().mockResolvedValue({
      summary: {
        paymentsToday: 500000,
        paymentsThisMonth: 1250000,
        paymentCount: 2,
        dueSoonCount: 1,
      },
      payments: [],
      dueItems: [],
    }),
    getArrearsReport: vi.fn().mockResolvedValue({
      summary: {
        totalLoans: 1,
        totalMembers: 1,
        totalAmountDue: 500000,
        bucket1To7: 0,
        bucket8To30: 1,
        bucketAbove30: 0,
      },
      items: [],
    }),
    getCashflowReport: vi.fn().mockResolvedValue({
      summary: {
        openingBalance: 1000000,
        cashIn: 500000,
        cashOut: 250000,
        closingBalance: 1250000,
      },
      items: [],
    }),
    getDailyTransactionsReport: vi.fn().mockResolvedValue({
      date: "2026-04-06",
      summary: {
        savingsIn: 200000,
        loansDisbursed: 0,
        installmentsPaid: 300000,
        cashIn: 500000,
        cashOut: 0,
        transactionCount: 2,
      },
      items: [],
    }),
    getMonthlyRecapReport: vi.fn().mockResolvedValue({
      month: "2026-04",
      summary: {
        totalSavings: 400000,
        totalLoansDisbursed: 1000000,
        totalInstallments: 500000,
        totalArrears: 250000,
        cashIn: 900000,
        cashOut: 1000000,
        newMembers: 1,
      },
    }),
    getMemberDetailReport: vi.fn().mockResolvedValue({
      member: {
        memberCode: memberUser.memberId,
        name: memberUser.name,
        phone: memberUser.phone,
        status: "Aktif",
        joinedDate: "2026-01-10",
        email: memberUser.email,
        address: memberUser.address,
      },
      summary: {
        totalSavings: 5550000,
        totalLoans: 7500000,
        activeLoanCount: 1,
        activeLoanAmount: 7500000,
        remainingLoan: 5000000,
        delinquencyStatus: "Lancar",
      },
      savingsBreakdown: {
        pokok: 500000,
        wajib: 1250000,
        sukarela: 3800000,
        total: 5550000,
      },
      activeLoans: [],
      paymentHistory: [],
      recentTransactions: [],
    }),
    createMember: vi.fn().mockResolvedValue({
      id: "KSP-20001",
      name: "New Member",
      phone: "081234567890",
      status: "Aktif",
      totalSavings: 0,
      hasActiveLoan: false,
    }),
    updateMember: vi.fn().mockResolvedValue({
      id: "KSP-20001",
      name: "Updated Member",
      phone: "081234567890",
      status: "Aktif",
      totalSavings: 0,
      hasActiveLoan: false,
    }),
    deleteMember: vi.fn().mockResolvedValue(undefined),
    listSavingsProducts: vi.fn().mockResolvedValue([]),
    createSavingsProduct: vi.fn().mockResolvedValue({
      id: "JS-999",
      name: "Simpanan Baru",
      amount: 10000,
      isMandatory: false,
    }),
    updateSavingsProduct: vi.fn().mockResolvedValue({
      id: "JS-999",
      name: "Simpanan Baru",
      amount: 10000,
      isMandatory: false,
    }),
    deleteSavingsProduct: vi.fn().mockResolvedValue(undefined),
    listLoanProducts: vi.fn().mockResolvedValue([]),
    createLoanProduct: vi.fn().mockResolvedValue({
      id: "JP-999",
      name: "Pinjaman Baru",
      maxAmount: 1000000,
      interestRate: 2,
      adminFeeRate: 1,
      maxTenor: 12,
    }),
    updateLoanProduct: vi.fn().mockResolvedValue({
      id: "JP-999",
      name: "Pinjaman Baru",
      maxAmount: 1000000,
      interestRate: 2,
      adminFeeRate: 1,
      maxTenor: 12,
    }),
    deleteLoanProduct: vi.fn().mockResolvedValue(undefined),
    listAnnouncements: vi.fn().mockResolvedValue([]),
    createAnnouncement: vi.fn().mockResolvedValue({
      id: "ANN-1",
      title: "Info",
      content: "Info penting",
      date: "2026-04-04",
      isActive: true,
    }),
    updateAnnouncement: vi.fn().mockResolvedValue({
      id: "ANN-1",
      title: "Info",
      content: "Info penting",
      date: "2026-04-04",
      isActive: true,
    }),
    deleteAnnouncement: vi.fn().mockResolvedValue(undefined),
    listLoanApplications: vi.fn().mockResolvedValue([]),
    reviewLoanApplication: vi.fn().mockResolvedValue({
      id: "app-1",
      memberId: memberUser.memberId,
      name: memberUser.name,
      amount: 2000000,
      tenor: 6,
      purpose: "Pendidikan",
      date: "2026-04-04",
      status: "Disetujui",
      estimatedInstallment: 353334,
    }),
    listLoans: vi.fn().mockResolvedValue([]),
    recordLoanPayment: vi.fn().mockResolvedValue({
      id: "TRX-100",
      type: "Angsuran Pinjaman",
      amount: 750000,
      date: "2026-04-04",
      status: "Berhasil",
      category: "pinjaman",
      memberName: memberUser.name,
    }),
  },
  notifications: {
    list: vi.fn().mockResolvedValue([]),
    markRead: vi.fn().mockResolvedValue({
      id: "notif-1",
      title: "Info",
      message: "Info penting",
      date: "2026-04-04",
      read: true,
    }),
  },
  transactions: {
    list: vi.fn().mockResolvedValue([]),
  },
});

describe("server app", () => {
  let services: AppServices;
  let adminToken: string;
  let memberToken: string;

  beforeEach(() => {
    services = makeServices();
    adminToken = createJwt({
      userId: adminUser.id,
      role: "admin",
      name: adminUser.name,
      phone: adminUser.phone,
    });
    memberToken = createJwt({
      userId: memberUser.id,
      role: "member",
      name: memberUser.name,
      phone: memberUser.phone,
    });
  });

  it("returns health status", async () => {
    const response = await request(createApp(services)).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("ok");
  });

  it("logs in successfully", async () => {
    const response = await request(createApp(services)).post("/api/auth/login").send({
      phone: adminUser.phone,
      password: "admin",
    });
    expect(response.status).toBe(200);
    expect(services.auth.login).toHaveBeenCalled();
    expect(response.body.data.user.role).toBe("admin");
  });

  it("rejects invalid login payload", async () => {
    const response = await request(createApp(services)).post("/api/auth/login").send({
      phone: "123",
      password: "",
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.message).toBe("Validasi permintaan gagal.");
    expect(response.body.error.details.fieldErrors.phone[0]).toBe("Nomor telepon minimal 10 digit.");
  });

  it("requires authentication for /api/me", async () => {
    const response = await request(createApp(services)).get("/api/me");
    expect(response.status).toBe(401);
  });

  it("returns member dashboard for an authenticated member", async () => {
    const response = await request(createApp(services))
      .get("/api/member/dashboard")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.user.memberId).toBe(memberUser.memberId);
  });

  it("blocks admin bundle access for member tokens", async () => {
    const response = await request(createApp(services))
      .get("/api/admin/bundle")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(403);
  });

  it("returns the admin summary report", async () => {
    const response = await request(createApp(services))
      .get("/api/admin/reports/summary?startDate=2026-04-01&endDate=2026-04-30")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(services.admin.getSummaryReport).toHaveBeenCalledWith(adminUser.id, {
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    });
  });

  it("returns detail laporan anggota", async () => {
    const response = await request(createApp(services))
      .get(`/api/admin/reports/member-detail/${memberUser.memberId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(services.admin.getMemberDetailReport).toHaveBeenCalledWith(
      adminUser.id,
      memberUser.memberId,
    );
  });

  it("creates a member through the admin API", async () => {
    const response = await request(createApp(services))
      .post("/api/admin/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Member",
        phone: "081234567890",
        password: "secret123",
        status: "Aktif",
      });
    expect(response.status).toBe(201);
    expect(services.admin.createMember).toHaveBeenCalled();
  });

  it("rejects incomplete member creation payloads", async () => {
    const response = await request(createApp(services))
      .post("/api/admin/members")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Member",
        phone: "081234567890",
      });
    expect(response.status).toBe(400);
  });

  it("marks notifications as read", async () => {
    const response = await request(createApp(services))
      .patch("/api/notifications/notif-1/read")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(response.status).toBe(200);
    expect(services.notifications.markRead).toHaveBeenCalledWith(memberUser.id, "notif-1");
  });

  it("reviews a loan application successfully", async () => {
    const response = await request(createApp(services))
      .patch("/api/admin/loan-applications/app-1/status")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Disetujui" });
    expect(response.status).toBe(200);
    expect(services.admin.reviewLoanApplication).toHaveBeenCalled();
  });

  it("allows transfer payments without an image proof", async () => {
    const response = await request(createApp(services))
      .post("/api/admin/loans/loan-1/payments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ amount: 750000, method: "Transfer" });

    expect(response.status).toBe(201);
    expect(services.admin.recordLoanPayment).toHaveBeenCalledWith(adminUser.id, "loan-1", {
      amount: 750000,
      method: "Transfer",
    });
  });

  it("surfaces payment failures from the loan payment flow", async () => {
    services.admin.recordLoanPayment = vi
      .fn()
      .mockRejectedValue(new AppError(400, "OVERPAYMENT", "Payment amount cannot exceed the remaining loan balance."));

    const response = await request(createApp(services))
      .post("/api/admin/loans/loan-1/payments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        amount: 9999999,
        method: "Transfer",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("OVERPAYMENT");
  });

  it("returns not found for unknown routes", async () => {
    const response = await request(createApp(services)).get("/api/unknown");
    expect(response.status).toBe(404);
  });
});
