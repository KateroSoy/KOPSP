import { PrismaClient } from "@prisma/client";
import { isTest } from "./server.config.env.js";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: isTest ? ["error"] : ["error", "warn"],
  });

if (!isTest) {
  global.__prisma__ = prisma;
}
