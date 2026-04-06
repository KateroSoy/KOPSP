import { Role } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { createServices } from "./server.services.js";

describe("createServices.admin.deleteMember", () => {
  it("deletes a member and all dependent history for any admin account", async () => {
    const tx = {
      loan: {
        findMany: vi.fn().mockResolvedValue([{ id: "loan-1" }]),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      loanApplication: {
        findMany: vi.fn().mockResolvedValue([{ id: "app-1" }]),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      loanPayment: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      notification: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      transaction: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        delete: vi.fn().mockResolvedValue({ id: "member-user-1" }),
      },
    };

    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "admin-2",
          role: Role.ADMIN,
          memberProfile: null,
        }),
      },
      memberProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: "member-profile-1",
          userId: "member-user-1",
          memberCode: "KSP-54321",
        }),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => callback(tx)),
    } as never;

    const services = createServices(prisma);

    await services.admin.deleteMember("admin-2", "KSP-54321");

    expect(tx.loanPayment.deleteMany).toHaveBeenCalledWith({
      where: { loanId: { in: ["loan-1"] } },
    });
    expect(tx.notification.deleteMany).toHaveBeenNthCalledWith(1, {
      where: { loanId: { in: ["loan-1"] } },
    });
    expect(tx.notification.deleteMany).toHaveBeenNthCalledWith(2, {
      where: { loanApplicationId: { in: ["app-1"] } },
    });
    expect(tx.transaction.deleteMany).toHaveBeenCalledWith({
      where: { memberId: "member-profile-1" },
    });
    expect(tx.loan.deleteMany).toHaveBeenCalledWith({
      where: { memberId: "member-profile-1" },
    });
    expect(tx.loanApplication.deleteMany).toHaveBeenCalledWith({
      where: { memberId: "member-profile-1" },
    });
    expect(tx.user.delete).toHaveBeenCalledWith({
      where: { id: "member-user-1" },
    });
  });
});
