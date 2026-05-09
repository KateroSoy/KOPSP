import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { env } from "./server.config.env.js";
export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
export const asyncHandler = (fn) => (req, res, next) => {
    void fn(req, res, next).catch(next);
};
export const ok = (res, data, statusCode = 200, meta) => {
    const payload = meta
        ? { success: true, data, meta }
        : { success: true, data };
    return res.status(statusCode).json(payload);
};
export const formatDateOnly = (value) => new Date(value).toISOString().slice(0, 10);
export const asNumber = (value) => value == null ? 0 : Number(value);
export const createJwt = (user) => jwt.sign(user, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
});
export const verifyJwt = (token) => jwt.verify(token, env.JWT_SECRET);
export const hashPassword = (value) => bcrypt.hash(value, 10);
export const comparePassword = (value, hash) => bcrypt.compare(value, hash);
export const requireAuth = (req, _res, next) => {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
        next(new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan."));
        return;
    }
    try {
        req.auth = verifyJwt(header.slice(7));
        next();
    }
    catch {
        next(new AppError(401, "INVALID_TOKEN", "Token sesi Anda tidak valid."));
    }
};
export const requireRole = (...roles) => (req, _res, next) => {
    if (!req.auth) {
        next(new AppError(401, "UNAUTHORIZED", "Autentikasi diperlukan."));
        return;
    }
    if (!roles.includes(req.auth.role)) {
        next(new AppError(403, "FORBIDDEN", "Anda tidak memiliki akses ke data ini."));
        return;
    }
    next();
};
export const parseWithSchema = (schema, value) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
        throw new AppError(400, "VALIDATION_ERROR", "Validasi permintaan gagal.", parsed.error.flatten());
    }
    return parsed.data;
};
export const maybeNull = (value) => value && value.trim().length > 0 ? value.trim() : null;
export const normalizePhone = (value) => value.replace(/\s+/g, "");
export const addMonths = (date, months) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
};
export const computeInstallment = (amount, tenor, interestRate) => Math.ceil((amount + amount * (interestRate / 100) * tenor) / tenor);
const PAYMENT_PROOF_UPLOAD_PREFIX = "/uploads/payment-proofs/";
const PAYMENT_PROOF_UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "payment-proofs");
const PAYMENT_PROOF_MAX_BYTES = 3 * 1024 * 1024;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const PAYMENT_PROOF_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
};
const hasSignature = (buffer, signature) => signature.every((byte, index) => buffer[index] === byte);
const detectPaymentProofMime = (buffer) => {
    if (buffer.length >= 8 && hasSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
        return "image/png";
    }
    if (buffer.length >= 3 && hasSignature(buffer, [0xff, 0xd8, 0xff])) {
        return "image/jpeg";
    }
    if (buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP") {
        return "image/webp";
    }
    return null;
};
export const getUploadsRoot = () => path.resolve(process.cwd(), "uploads");
export const savePaymentProof = async (input) => {
    if (!input.dataUrl?.trim()) {
        return null;
    }
    const match = input.dataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) {
        throw new AppError(400, "INVALID_PAYMENT_PROOF", "Bukti pembayaran harus berupa gambar PNG, JPG, atau WEBP.");
    }
    const claimedMime = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
    const base64Payload = match[2];
    if (base64Payload.length % 4 !== 0 || !BASE64_PATTERN.test(base64Payload)) {
        throw new AppError(400, "INVALID_PAYMENT_PROOF", "Format bukti pembayaran tidak valid.");
    }
    const buffer = Buffer.from(base64Payload, "base64");
    if (buffer.length === 0 || buffer.length > PAYMENT_PROOF_MAX_BYTES) {
        throw new AppError(400, "INVALID_PAYMENT_PROOF_SIZE", "Ukuran bukti pembayaran harus lebih kecil dari 3 MB.");
    }
    const detectedMime = detectPaymentProofMime(buffer);
    if (!detectedMime || detectedMime !== claimedMime) {
        throw new AppError(400, "INVALID_PAYMENT_PROOF", "Isi file bukti pembayaran tidak sesuai dengan format gambar yang didukung.");
    }
    await fs.mkdir(PAYMENT_PROOF_UPLOAD_DIR, { recursive: true });
    const extension = PAYMENT_PROOF_TYPES[detectedMime];
    const fileName = `proof-${Date.now()}-${randomUUID()}.${extension}`;
    await fs.writeFile(path.join(PAYMENT_PROOF_UPLOAD_DIR, fileName), buffer, { flag: "wx" });
    return `${PAYMENT_PROOF_UPLOAD_PREFIX}${fileName}`;
};
export const deletePaymentProof = async (proofUrl) => {
    if (!proofUrl?.startsWith(PAYMENT_PROOF_UPLOAD_PREFIX)) {
        return;
    }
    const filePath = path.join(PAYMENT_PROOF_UPLOAD_DIR, path.basename(proofUrl));
    try {
        await fs.unlink(filePath);
    }
    catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
};
export const prismaErrorToAppError = (error) => {
    if (error instanceof AppError) {
        return error;
    }
    const errorName = typeof error === "object" && error !== null && "constructor" in error
        ? error.constructor.name
        : undefined;
    const errorMessage = typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "";
    const errorCode = typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : undefined;
    if (error instanceof ZodError) {
        return new AppError(400, "VALIDATION_ERROR", "Validasi permintaan gagal.", error.flatten());
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            return new AppError(409, "CONFLICT", "Data dengan nilai unik yang sama sudah ada.", error.meta);
        }
        if (error.code === "P2003") {
            return new AppError(409, "CONSTRAINT_ERROR", "Aksi ini melanggar relasi atau batasan data.", error.meta);
        }
    }
    if (errorCode === "P2021" || errorCode === "P2022") {
        return new AppError(503, "DATABASE_UNAVAILABLE", "Skema database belum tersedia. Jalankan setup schema atau migrasi terlebih dahulu.");
    }
    if (error instanceof Prisma.PrismaClientInitializationError ||
        errorName === "PrismaClientInitializationError" ||
        errorMessage.includes("Can't reach database server")) {
        return new AppError(503, "DATABASE_UNAVAILABLE", "Koneksi database tidak tersedia. Periksa konfigurasi Supabase dan akses jaringannya.");
    }
    if (typeof error === "object" &&
        error !== null &&
        "type" in error &&
        error.type === "entity.too.large") {
        return new AppError(413, "PAYLOAD_TOO_LARGE", "Ukuran data yang dikirim terlalu besar.");
    }
    return new AppError(500, "INTERNAL_ERROR", "Terjadi kesalahan server yang tidak terduga.");
};
