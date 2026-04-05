import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./server.app.js";
import { prisma } from "./server.db.js";

const runDatabaseTests = process.env.RUN_DB_TESTS === "true";
const describeIfDatabase = runDatabaseTests ? describe : describe.skip;
const app = createApp();

const login = async (phone: string, password: string) => {
  const response = await request(app).post("/api/auth/login").send({ phone, password });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);

  return response.body.data.token as string;
};

describeIfDatabase("server integration", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("authenticates the seeded admin account", async () => {
    const response = await request(app).post("/api/auth/login").send({
      phone: "08111111111",
      password: "admin",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe("admin");
    expect(response.body.data.user.memberId).toBe("ADM-001");
  });

  it("returns the seeded member dashboard", async () => {
    const token = await login("08222222222", "user");
    const response = await request(app)
      .get("/api/member/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user.memberId).toBe("KSP-10248");
    expect(response.body.data.savings.total).toBeGreaterThan(0);
    expect(Array.isArray(response.body.data.notifications)).toBe(true);
  });

  it("rejects new loan applications for members with an active loan", async () => {
    const token = await login("08222222222", "user");
    const response = await request(app)
      .post("/api/member/loan-applications")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 1500000,
        tenor: 6,
        purpose: "Biaya Darurat",
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("ACTIVE_LOAN_EXISTS");
  });

  it("approves a pending application and creates a new active loan", async () => {
    const adminToken = await login("08111111111", "admin");
    const listResponse = await request(app)
      .get("/api/admin/loan-applications")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(listResponse.status).toBe(200);

    const pendingApplication = listResponse.body.data.find(
      (item: { status: string; memberId: string }) =>
        item.status === "Baru" && item.memberId === "KSP-10555",
    );

    expect(pendingApplication).toBeTruthy();

    const approveResponse = await request(app)
      .patch(`/api/admin/loan-applications/${pendingApplication.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "Disetujui",
        reviewNote: "Dokumen lengkap dan layak diproses.",
      });

    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.data.status).toBe("Disetujui");

    const loansResponse = await request(app)
      .get("/api/admin/loans")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(loansResponse.status).toBe(200);
    expect(
      loansResponse.body.data.some(
        (loan: { memberId: string; status: string }) =>
          loan.memberId === "KSP-10555" && loan.status === "Aktif",
      ),
    ).toBe(true);

    const memberToken = await login("08333333333", "user");
    const notificationsResponse = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${memberToken}`);

    expect(notificationsResponse.status).toBe(200);
    expect(
      notificationsResponse.body.data.some((notification: { title: string }) =>
        notification.title.includes("Pinjaman Disetujui"),
      ),
    ).toBe(true);
  });
});
