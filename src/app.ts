import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";

// Routers
import { authRouter } from "./features/auth/auth.routes";
import { profileRouter } from "./features/profile/profile.routes";
import { canvasRouter } from "./features/canvas/canvas.routes";
import { servicesRouter } from "./features/services/services.routes";
import { projectsRouter } from "./features/projects/projects.routes";
import { linksRouter } from "./features/links/links.routes";
import { storiesRouter } from "./features/stories/stories.routes";
import { contactsRouter } from "./features/contacts/contacts.routes";
import { resumeRouter } from "./features/resume/resume.routes";
import { verificationRouter } from "./features/verification/verification.routes";
import { discoveryRouter } from "./features/discovery/discovery.routes";
import { savedRouter } from "./features/saved/saved.routes";
import { moderationRouter } from "./features/moderation/moderation.routes";
import { analyticsRouter } from "./features/analytics/analytics.routes";
import { adminRouter } from "./features/admin/admin.routes";
import { uploadRouter } from "./features/upload/upload.routes";
import { ogRouter } from "./features/og/og.routes";

// Middlewares
import { errorHandler } from "./middleware/error.middleware";
import { notFoundHandler } from "./middleware/notFound.middleware";

const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global rate limit (before feature-level limits)
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { status: "ok" } });
});

// Routes
const v1 = "/api/v1";
app.use(`${v1}/auth`, authRouter);
app.use(`${v1}/profile`, profileRouter);
app.use(`${v1}/canvas`, canvasRouter);
app.use(`${v1}/services`, servicesRouter);
app.use(`${v1}/projects`, projectsRouter);
app.use(`${v1}/links`, linksRouter);
app.use(`${v1}/stories`, storiesRouter);
app.use(`${v1}/contacts`, contactsRouter);
app.use(`${v1}/resume`, resumeRouter);
app.use(`${v1}/verification`, verificationRouter);
app.use(`${v1}/discover`, discoveryRouter);
app.use(`${v1}/saved`, savedRouter);
app.use(`${v1}/reports`, moderationRouter);
app.use(`${v1}/analytics`, analyticsRouter);
app.use(`${v1}/admin`, adminRouter);
app.use(`${v1}/upload`, uploadRouter);
app.use(`${v1}/og`, ogRouter);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
