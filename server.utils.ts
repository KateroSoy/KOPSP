import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextFunction, Response } from "express";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import jwt, { type SignOptions } from "jsonwebtoken";
import { ZodError, type ZodSchema } from "zod";
import { env } from "./server.config.env.js";
import type {
  ApiSuccessPayload,
  AuthenticatedRequest,
  SessionUser,
} from "./server.types.js";

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler =
  <T extends AuthenticatedRequest>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<void>,
  ) =>
  (req: T, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };

export const ok = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
) => {
  const payload: ApiSuccessPayload<T> = meta
    ? { success: true, data, meta }
    : { success: true, data };
  return res.status(statusCode).json(payload);
};

export const formatDateOnly = (value: Date | string) =>
  new Date(value).toISOString().slice(0, 10);

export const asNumber = (value: Prisma.Decimal | number | string | null | undefined) =>
  value == null ? 0 : Number(value);

export const createJwt = (user: SessionUser) =>
  jwt.sign(user, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  });

export const verifyJwt = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as SessionUser;

export const hashPassword = (value: string) => bcrypt.hash(value, 10);

export const comparePassword = (value: string, hash: string) =>
  bcrypt.compare(value, hash);

export const requireAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication is required."));
    return;
  }

  try {
    req.auth = verifyJwt(header.slice(7));
    next();
  } catch {
    next(new AppError(401, "INVALID_TOKEN", "Your session token is invalid."));
  }
};

export const requireRole =
  (...roles: SessionUser["role"][]) =>
  (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError(401, "UNAUTHORIZED", "Authentication is required."));
      return;
    }
    if (!roles.includes(req.auth.role)) {
      next(new AppError(403, "FORBIDDEN", "You do not have access to this resource."));
      return;
    }
    next();
  };

export const parseWithSchema = <T>(schema: ZodSchema<T>, value: unknown) => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Request validation failed.", parsed.error.flatten());
  }
  return parsed.data;
};

export const maybeNull = (value?: string | null) =>
  value && value.trim().length > 0 ? value.trim() : null;

export const normalizePhone = (value: string) => value.replace(/\s+/g, "");

export const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const computeInstallment = (amount: number, tenor: number, interestRate: number) =>
  Math.ceil((amount + amount * (interestRate / 100) * tenor) / tenor);

const PAYMENT_PROOF_UPLOAD_PREFIX = "/uploads/payment-proofs/";
const PAYMENT_PROOF_UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "payment-proofs");
const PAYMENT_PROOF_MAX_BYTES = 3 * 1024 * 1024;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const PAYMENT_PROOF_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type PaymentProofMime = keyof typeof PAYMENT_PROOF_TYPES;

const hasSignature = (buffer: Buffer, signature: number[]) =>
  signature.every((byte, index) => buffer[index] === byte);

const detectPaymentProofMime = (buffer: Buffer): PaymentProofMime | null => {
  if (buffer.length >= 8 && hasSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  if (buffer.length >= 3 && hasSignature(buffer, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
};

export const getUploadsRoot = () => path.resolve(process.cwd(), "uploads");

export const savePaymentProof = async (input: {
  dataUrl?: string | null;
  fileName?: string | null;
}) => {
  if (!input.dataUrl?.trim()) {
    return null;
  }

  const match = input.dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    throw new AppError(400, "INVALID_PAYMENT_PROOF", "Payment proof must be a PNG, JPG, or WEBP image.");
  }

  const claimedMime = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const base64Payload = match[2];

  if (base64Payload.length % 4 !== 0 || !BASE64_PATTERN.test(base64Payload)) {
    throw new AppError(400, "INVALID_PAYMENT_PROOF", "Payment proof encoding is invalid.");
  }

  const buffer = Buffer.from(base64Payload, "base64");
  if (buffer.length === 0 || buffer.length > PAYMENT_PROOF_MAX_BYTES) {
    throw new AppError(
      400,
      "INVALID_PAYMENT_PROOF_SIZE",
      "Payment proof image must be smaller than 3 MB.",
    );
  }

  const detectedMime = detectPaymentProofMime(buffer);
  if (!detectedMime || detectedMime !== claimedMime) {
    throw new AppError(
      400,
      "INVALID_PAYMENT_PROOF",
      "Payment proof content does not match a supported image format.",
    );
  }

  await fs.mkdir(PAYMENT_PROOF_UPLOAD_DIR, { recursive: true });
  const extension = PAYMENT_PROOF_TYPES[detectedMime];
  const fileName = `proof-${Date.now()}-${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(PAYMENT_PROOF_UPLOAD_DIR, fileName), buffer, { flag: "wx" });
  return `${PAYMENT_PROOF_UPLOAD_PREFIX}${fileName}`;
};

export const deletePaymentProof = async (proofUrl?: string | null) => {
  if (!proofUrl?.startsWith(PAYMENT_PROOF_UPLOAD_PREFIX)) {
    return;
  }

  const filePath = path.join(PAYMENT_PROOF_UPLOAD_DIR, path.basename(proofUrl));
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
};

export const prismaErrorToAppError = (error: unknown) => {
  if (error instanceof AppError) {
    return error;
  }

  const errorName =
    typeof error === "object" && error !== null && "constructor" in error
      ? (error.constructor as { name?: string }).name
      : undefined;
  const errorMessage =
    typeof error === "object" && error !== null && "message" in error
      ? String(error.message)
      : "";
  const errorCode =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : undefined;

  if (error instanceof ZodError) {
    return new AppError(400, "VALIDATION_ERROR", "Request validation failed.", error.flatten());
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new AppError(409, "CONFLICT", "A record with the same unique value already exists.", error.meta);
    }
    if (error.code === "P2003") {
      return new AppError(409, "CONSTRAINT_ERROR", "This action violates a database constraint.", error.meta);
    }
  }

  if (errorCode === "P2021" || errorCode === "P2022") {
    return new AppError(
      503,
      "DATABASE_UNAVAILABLE",
      "The database schema is unavailable. Run the project schema setup or fallback to a seeded environment.",
    );
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    errorName === "PrismaClientInitializationError" ||
    errorMessage.includes("Can't reach database server")
  ) {
    return new AppError(
      503,
      "DATABASE_UNAVAILABLE",
      "The database connection is unavailable. Check the active backend database configuration and network access.",
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    return new AppError(413, "PAYLOAD_TOO_LARGE", "Uploaded request body is too large.");
  }

  return new AppError(500, "INTERNAL_ERROR", "An unexpected server error occurred.");
};
