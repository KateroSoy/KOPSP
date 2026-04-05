import { describe, expect, it } from "vitest";
import { createDemoServices } from "./server.demo-services.js";

describe("createDemoServices", () => {
  it("logs in with the seeded admin demo account", async () => {
    const services = createDemoServices();
    const session = await services.auth.login({
      phone: "08111111111",
      password: "admin",
    });

    expect(session.user.role).toBe("admin");
    expect(session.user.memberId).toBe("ADM-001");
    expect(session.token).toBeTruthy();
  });

  it("returns the seeded member dashboard", async () => {
    const services = createDemoServices();
    const dashboard = await services.member.getDashboard("member-1");

    expect(dashboard.user.memberId).toBe("KSP-10248");
    expect(dashboard.savings.total).toBeGreaterThan(0);
    expect(Array.isArray(dashboard.notifications)).toBe(true);
  });
});
