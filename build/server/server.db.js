import { PrismaClient } from "@prisma/client";
import { isTest } from "./server.config.env.js";
export const prisma = global.__prisma__ ??
    new PrismaClient({
        log: isTest ? ["error"] : ["error", "warn"],
    });
if (!isTest) {
    global.__prisma__ = prisma;
}
