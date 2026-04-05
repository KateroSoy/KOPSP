import { describe, expect, it } from "vitest";
import { prismaErrorToAppError } from "./server.utils.js";

describe("prismaErrorToAppError", () => {
  it("maps Prisma initialization failures to a database unavailable response", () => {
    const error = {
      constructor: { name: "PrismaClientInitializationError" },
      message:
        "Can't reach database server at `db.sldhyuimolzgcgojywfz.supabase.co:5432`",
    } as unknown;

    const mapped = prismaErrorToAppError(error);

    expect(mapped.statusCode).toBe(503);
    expect(mapped.code).toBe("DATABASE_UNAVAILABLE");
  });

  it("maps missing database tables to a database unavailable response", () => {
    const error = {
      constructor: { name: "PrismaClientKnownRequestError" },
      code: "P2021",
      message: "The table `public.User` does not exist in the current database.",
    } as unknown;

    const mapped = prismaErrorToAppError(error);

    expect(mapped.statusCode).toBe(503);
    expect(mapped.code).toBe("DATABASE_UNAVAILABLE");
  });
});