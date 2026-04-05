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
