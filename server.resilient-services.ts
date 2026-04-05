import { env } from "./server.config.env.js";
import { createDemoServices } from "./server.demo-services.js";
import { createServices } from "./server.services.js";
import type { AppServices } from "./server.types.js";
import { prismaErrorToAppError } from "./server.utils.js";

type AsyncGroup = Record<string, (...args: never[]) => Promise<unknown>>;

const wrapGroup = <T extends AsyncGroup>(
  primary: T,
  fallback: T,
  invoke: (
    primaryFn: (...args: never[]) => Promise<unknown>,
    fallbackFn: (...args: never[]) => Promise<unknown>,
    args: unknown[],
  ) => Promise<unknown>,
): T => {
  const wrapped: Record<string, unknown> = {};

  for (const key of Object.keys(primary)) {
    wrapped[key] = async (...args: unknown[]) => invoke(primary[key], fallback[key], args);
  }

  return wrapped as T;
};

export const createResilientServices = (): AppServices => {
  const primary = createServices();

  if (!env.ALLOW_DEMO_FALLBACK) {
    return primary;
  }

  const demo = createDemoServices();
  let preferFallback = env.FORCE_DEMO_FALLBACK;
  let hasLoggedFallback = false;

  const invoke = async (
    primaryFn: (...args: never[]) => Promise<unknown>,
    fallbackFn: (...args: never[]) => Promise<unknown>,
    args: unknown[],
  ) => {
    if (preferFallback) {
      return fallbackFn(...(args as never[]));
    }

    try {
      return await primaryFn(...(args as never[]));
    } catch (error) {
      const appError = prismaErrorToAppError(error);
      if (appError.code !== "DATABASE_UNAVAILABLE") {
        throw error;
      }

      preferFallback = true;
      if (!hasLoggedFallback) {
        hasLoggedFallback = true;
        // eslint-disable-next-line no-console
        console.warn("Database unavailable. Falling back to in-memory demo services.");
      }
      return fallbackFn(...(args as never[]));
    }
  };

  return {
    auth: wrapGroup(primary.auth, demo.auth, invoke),
    me: wrapGroup(primary.me, demo.me, invoke),
    member: wrapGroup(primary.member, demo.member, invoke),
    admin: wrapGroup(primary.admin, demo.admin, invoke),
    notifications: wrapGroup(primary.notifications, demo.notifications, invoke),
    transactions: wrapGroup(primary.transactions, demo.transactions, invoke),
  };
};
