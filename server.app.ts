import cors from "cors";
import path from "node:path";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import {
  arrearsReportQuerySchema,
  announcementSchema,
  cashflowReportQuerySchema,
  dailyTransactionsReportQuerySchema,
  idParamSchema,
  installmentsReportQuerySchema,
  loanApplicationCreateSchema,
  loanApplicationReviewSchema,
  loanPaymentSchema,
  loansReportQuerySchema,
  loanProductSchema,
  loginSchema,
  memberCreateSchema,
  membersReportQuerySchema,
  monthlyRecapReportQuerySchema,
  memberUpdateSchema,
  passwordChangeSchema,
  profileUpdateSchema,
  reportRangeQuerySchema,
  savingsReportQuerySchema,
  savingsProductSchema,
} from "./server.schemas.js";
import { env } from "./server.config.env.js";
import type { AppServices, AuthenticatedRequest } from "./server.types.js";
import {
  AppError,
  asyncHandler,
  ok,
  parseWithSchema,
  prismaErrorToAppError,
  requireAuth,
  requireRole,
} from "./server.utils.js";
import { createServices } from "./server.services.js";

export const createApp = (services: AppServices = createServices()) => {
  const app = express();
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
  });

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(morgan("dev"));

  const uploadsPath = path.resolve(process.cwd(), "uploads");
  app.use(
    "/uploads",
    express.static(uploadsPath, {
      dotfiles: "deny",
      index: false,
      fallthrough: true,
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );

  app.get("/api/health", (_req, res) => {
    ok(res, { status: "ok" });
  });

  app.post(
    "/api/auth/login",
    loginLimiter,
    asyncHandler(async (req, res) => {
      const body = parseWithSchema(loginSchema, req.body);
      ok(res, await services.auth.login(body));
    }),
  );

  app.get(
    "/api/me",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.me.getCurrentUser(req.auth!.userId));
    }),
  );

  app.put(
    "/api/me/profile",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = parseWithSchema(profileUpdateSchema, req.body);
      ok(res, await services.me.updateProfile(req.auth!.userId, body));
    }),
  );

  app.put(
    "/api/me/password",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = parseWithSchema(passwordChangeSchema, req.body);
      await services.me.changePassword(req.auth!.userId, body);
      ok(res, { changed: true });
    }),
  );

  app.get(
    "/api/member/dashboard",
    requireAuth,
    requireRole("member"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.member.getDashboard(req.auth!.userId));
    }),
  );

  app.post(
    "/api/member/loan-applications",
    requireAuth,
    requireRole("member"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = parseWithSchema(loanApplicationCreateSchema, req.body);
      ok(res, await services.member.createLoanApplication(req.auth!.userId, body), 201);
    }),
  );

  app.get(
    "/api/admin/dashboard",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.admin.getDashboard(req.auth!.userId));
    }),
  );

  app.get(
    "/api/admin/bundle",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const userId = req.auth!.userId;
      const [dashboard, members, savingsProducts, loanProducts, announcements, loans] =
        await Promise.all([
          services.admin.getDashboard(userId),
          services.admin.listMembers(userId),
          services.admin.listSavingsProducts(userId),
          services.admin.listLoanProducts(userId),
          services.admin.listAnnouncements(userId),
          services.admin.listLoans(userId),
        ]);
      ok(res, {
        dashboard,
        members,
        savingsProducts,
        loanProducts,
        announcements,
        loans,
      });
    }),
  );

  app.get(
    "/api/admin/reports/summary",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = parseWithSchema(reportRangeQuerySchema, req.query);
      ok(res, await services.admin.getSummaryReport(req.auth!.userId, query));
    }),
  );

  app.get(
    "/api/admin/reports/members",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = parseWithSchema(membersReportQuerySchema, req.query);
      ok(res, await services.admin.getMembersReport(req.auth!.userId, query));
    }),
  );

  app.get(
    "/api/admin/reports/savings",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = parseWithSchema(savingsReportQuerySchema, req.query);
      ok(res, await services.admin.getSavingsReport(req.auth!.userId, query));
    }),
  );

  app.get(
    "/api/admin/reports/loans",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = parseWithSchema(loansReportQuerySchema, req.query);
      ok(res, await services.admin.getLoansReport(req.auth!.userId, query));
    }),
  );

  app.get(
    "/api/admin/reports/installments",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = parseWithSchema(installmentsReportQuerySchema, req.query);
      ok(res, await services.admin.getInstallmentsReport(req.auth!.userId, query));
    }),
  );

  app.get(
    "/api/admin/reports/arrears",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = parseWithSchema(arrearsReportQuerySchema, req.query);
      ok(res, await services.admin.getArrearsReport(req.auth!.userId, query));
    }),
  );

  app.get(
    "/api/admin/reports/cashflow",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = parseWithSchema(cashflowReportQuerySchema, req.query);
      ok(res, await services.admin.getCashflowReport(req.auth!.userId, query));
    }),
  );

  app.get(
    "/api/admin/reports/daily-transactions",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = parseWithSchema(dailyTransactionsReportQuerySchema, req.query);
      ok(res, await services.admin.getDailyTransactionsReport(req.auth!.userId, query));
    }),
  );

  app.get(
    "/api/admin/reports/monthly-recap",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const query = parseWithSchema(monthlyRecapReportQuerySchema, req.query);
      ok(res, await services.admin.getMonthlyRecapReport(req.auth!.userId, query));
    }),
  );

  app.get(
    "/api/admin/reports/member-detail/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      ok(res, await services.admin.getMemberDetailReport(req.auth!.userId, params.id));
    }),
  );

  app.get(
    "/api/admin/members",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.admin.listMembers(req.auth!.userId));
    }),
  );

  app.post(
    "/api/admin/members",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = parseWithSchema(memberCreateSchema, req.body);
      ok(
        res,
        await services.admin.createMember(req.auth!.userId, {
          ...body,
          status: body.status ?? "Aktif",
        }),
        201,
      );
    }),
  );

  app.put(
    "/api/admin/members/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      const body = parseWithSchema(memberUpdateSchema, req.body);
      ok(
        res,
        await services.admin.updateMember(req.auth!.userId, params.id, {
          ...body,
          status: body.status ?? "Aktif",
        }),
      );
    }),
  );

  app.delete(
    "/api/admin/members/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      await services.admin.deleteMember(req.auth!.userId, params.id);
      ok(res, { deleted: true });
    }),
  );

  app.get(
    "/api/admin/savings-products",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.admin.listSavingsProducts(req.auth!.userId));
    }),
  );

  app.post(
    "/api/admin/savings-products",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = parseWithSchema(savingsProductSchema, req.body);
      ok(res, await services.admin.createSavingsProduct(req.auth!.userId, body), 201);
    }),
  );

  app.put(
    "/api/admin/savings-products/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      const body = parseWithSchema(savingsProductSchema, req.body);
      ok(res, await services.admin.updateSavingsProduct(req.auth!.userId, params.id, body));
    }),
  );

  app.delete(
    "/api/admin/savings-products/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      await services.admin.deleteSavingsProduct(req.auth!.userId, params.id);
      ok(res, { deleted: true });
    }),
  );

  app.get(
    "/api/admin/loan-products",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.admin.listLoanProducts(req.auth!.userId));
    }),
  );

  app.post(
    "/api/admin/loan-products",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = parseWithSchema(loanProductSchema, req.body);
      ok(
        res,
        await services.admin.createLoanProduct(req.auth!.userId, {
          ...body,
          adminFeeRate: body.adminFeeRate ?? 1,
        }),
        201,
      );
    }),
  );

  app.put(
    "/api/admin/loan-products/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      const body = parseWithSchema(loanProductSchema, req.body);
      ok(
        res,
        await services.admin.updateLoanProduct(req.auth!.userId, params.id, {
          ...body,
          adminFeeRate: body.adminFeeRate ?? 1,
        }),
      );
    }),
  );

  app.delete(
    "/api/admin/loan-products/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      await services.admin.deleteLoanProduct(req.auth!.userId, params.id);
      ok(res, { deleted: true });
    }),
  );

  app.get(
    "/api/admin/announcements",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.admin.listAnnouncements(req.auth!.userId));
    }),
  );

  app.post(
    "/api/admin/announcements",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const body = parseWithSchema(announcementSchema, req.body);
      ok(res, await services.admin.createAnnouncement(req.auth!.userId, body), 201);
    }),
  );

  app.put(
    "/api/admin/announcements/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      const body = parseWithSchema(announcementSchema, req.body);
      ok(res, await services.admin.updateAnnouncement(req.auth!.userId, params.id, body));
    }),
  );

  app.delete(
    "/api/admin/announcements/:id",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      await services.admin.deleteAnnouncement(req.auth!.userId, params.id);
      ok(res, { deleted: true });
    }),
  );

  app.get(
    "/api/admin/loan-applications",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.admin.listLoanApplications(req.auth!.userId));
    }),
  );

  app.patch(
    "/api/admin/loan-applications/:id/status",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      const body = parseWithSchema(loanApplicationReviewSchema, req.body);
      ok(res, await services.admin.reviewLoanApplication(req.auth!.userId, params.id, body));
    }),
  );

  app.get(
    "/api/admin/loans",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.admin.listLoans(req.auth!.userId));
    }),
  );

  app.post(
    "/api/admin/loans/:id/payments",
    requireAuth,
    requireRole("admin"),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      const body = parseWithSchema(loanPaymentSchema, req.body);
      ok(res, await services.admin.recordLoanPayment(req.auth!.userId, params.id, body), 201);
    }),
  );

  app.get(
    "/api/notifications",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.notifications.list(req.auth!.userId));
    }),
  );

  app.patch(
    "/api/notifications/:id/read",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const params = parseWithSchema(idParamSchema, req.params);
      ok(res, await services.notifications.markRead(req.auth!.userId, params.id));
    }),
  );

  app.get(
    "/api/transactions",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      ok(res, await services.transactions.list(req.auth!.userId, req.auth!.role));
    }),
  );

  if (env.NODE_ENV === "production") {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "The requested route was not found.",
      },
    });
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (!(error instanceof AppError)) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
    const appError = prismaErrorToAppError(error);
    res.status(appError.statusCode).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
    });
  });

  return app;
};
