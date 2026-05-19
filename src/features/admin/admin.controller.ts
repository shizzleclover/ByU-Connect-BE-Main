import { Request, Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import * as XLSX from "xlsx";
import { Report, ReportStatus } from "../moderation/report.model";
import { Profile } from "../profile/profile.model";
import { User } from "../../models/user.model";
import { Otp } from "../verification/otp.model";
import { ApiError } from "../../lib/apiError";
import { hash } from "../../lib/password";
import { sendEmail } from "../../lib/mailer";
import { welcomeEmail } from "../../lib/emailTemplates";
import { env } from "../../config/env";

// ── Stats ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get admin overview statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin statistics
 */
export const getStats = async (_req: Request, res: Response) => {
  const [totalUsers, verifiedUsers, suspendedUsers, pendingReports, totalProfiles] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ studentEmailVerifiedAt: { $ne: null } }),
    User.countDocuments({ isSuspended: true }),
    Report.countDocuments({ status: "pending" }),
    Profile.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: { totalUsers, verifiedUsers, suspendedUsers, pendingReports, totalProfiles },
  });
};

// ── Reports ───────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: List reports by status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, actioned, dismissed]
 *         description: Filter by status (default pending)
 *     responses:
 *       200:
 *         description: List of reports
 */
export const getReports = async (req: Request, res: Response) => {
  const status = ((req.query.status as string) ?? "pending") as ReportStatus;
  const reports = await Report.find({ status })
    .sort({ createdAt: -1 })
    .populate("reporterId", "email") // User model only has email
    .populate("targetProfileId", "username fullName")
    .lean();

  // Map the populated Mongoose documents to the shape the frontend expects
  const formattedReports = await Promise.all(reports.map(async (report) => {
    // Look up reporter's username from their Profile
    const reporterUser = report.reporterId as any;
    let reporterUsername: string | undefined;
    if (reporterUser?._id) {
       const reporterProfile = await Profile.findOne({ userId: reporterUser._id }).select("username").lean();
       reporterUsername = reporterProfile?.username;
    }

    return {
      ...report,
      reporterId: reporterUser?._id ?? report.reporterId,
      reporterUsername,
      targetProfileId: (report.targetProfileId as any)?._id ?? report.targetProfileId,
      targetProfile: typeof report.targetProfileId === 'object' ? report.targetProfileId : undefined,
    };
  }));

  res.status(200).json({ success: true, data: formattedReports });
};

/**
 * @swagger
 * /admin/reports/{id}:
 *   patch:
 *     summary: Review / action / dismiss a report
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed, actioned, dismissed]
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated report
 *       404:
 *         description: Report not found
 */
export const reviewReport = async (req: Request, res: Response) => {
  const { status, adminNote } = req.body;

  const report = await Report.findByIdAndUpdate(
    String(req.params["id"]),
    {
      status,
      adminNote: adminNote ?? null,
      reviewedBy: req.user!._id,
      reviewedAt: new Date(),
    },
    { new: true },
  );

  if (!report) throw new ApiError(404, "Report not found");
  res.status(200).json({ success: true, data: report });
};

// ── Featured ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/featured:
 *   get:
 *     summary: List featured profiles
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ordered list of featured profiles
 */
export const getFeaturedList = async (_req: Request, res: Response) => {
  const profiles = await Profile.find({ isFeatured: true })
    .sort({ featuredOrder: 1 })
    .select("username fullName avatarUrl featuredOrder userId")
    .lean();
  const formattedProfiles = profiles.map((p) => ({
    _id: p._id,
    userId: p.userId,
    username: p.username,
    fullName: p.fullName,
    avatarUrl: p.avatarUrl,
    order: p.featuredOrder ?? 0,
  }));
  res.status(200).json({ success: true, data: formattedProfiles });
};

/**
 * @swagger
 * /admin/featured:
 *   post:
 *     summary: Add a profile to featured
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *               order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated profile
 *       404:
 *         description: Profile not found
 */
export const addFeatured = async (req: Request, res: Response) => {
  const { userId, order } = req.body;

  let profile = await Profile.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { isFeatured: true, featuredAt: new Date(), featuredOrder: order ?? 0 },
    { returnDocument: "after" },
  );

  if (!profile) {
    // Look up user to see if they exist
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    // Auto-initialize profile for featuring if not exists
    const baseUsername = user.email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
    profile = await Profile.create({
      userId: user._id,
      username: baseUsername + Math.floor(1000 + Math.random() * 9000),
      fullName: user.email.split("@")[0],
      isFeatured: true,
      featuredAt: new Date(),
      featuredOrder: order ?? 0,
    });
  }

  res.status(200).json({ success: true, data: profile });
};

/**
 * @swagger
 * /admin/featured/{userId}:
 *   delete:
 *     summary: Remove a profile from featured
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removed
 */
export const removeFeatured = async (req: Request, res: Response) => {
  await Profile.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(String(req.params["userId"])) },
    { isFeatured: false, featuredAt: null, featuredOrder: null },
  );
  res.status(200).json({ success: true, data: null });
};

/**
 * @swagger
 * /admin/featured/reorder:
 *   patch:
 *     summary: Reorder featured profiles
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ids]
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Ordered array of userId values
 *     responses:
 *       200:
 *         description: Reordered
 */
export const reorderFeatured = async (req: Request, res: Response) => {
  const { ids } = req.body as { ids: string[] };
  await Promise.all(
    ids.map((userId, index) =>
      Profile.findOneAndUpdate({ userId }, { featuredOrder: index }),
    ),
  );
  res.status(200).json({ success: true, data: null });
};

// ── Users ─────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Search and list users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search by email, username, or full name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Max results (default 50)
 *     responses:
 *       200:
 *         description: List of users with profile data
 */
export const getUsers = async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  let userIds: string[] | null = null;

  if (q) {
    const profiles = await Profile.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { fullName: { $regex: q, $options: "i" } },
      ],
    })
      .select("userId")
      .lean();
    userIds = profiles.map((p) => String(p.userId));
  }

  const userFilter = q
    ? {
        $or: [
          { email: { $regex: q, $options: "i" } },
          ...(userIds ? [{ _id: { $in: userIds } }] : []),
        ],
      }
    : {};

  const users = await User.find(userFilter)
    .select("-passwordHash -refreshTokenHash")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const ids = users.map((u) => String(u._id));
  const profiles = await Profile.find({ userId: { $in: ids } })
    .select("userId username fullName avatarUrl department year isFeatured")
    .lean();

  const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));

  const data = users.map((u) => {
    const profile = profileMap.get(String(u._id)) ?? {};
    return {
      ...u,
      ...profile,
      _id: String(u._id),
      isVerified: !!u.studentEmailVerifiedAt,
    };
  });

  res.status(200).json({ success: true, data });
};

/**
 * @swagger
 * /admin/users/{id}:
 *   patch:
 *     summary: Update a user (suspend, unsuspend, promote role)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isSuspended:
 *                 type: boolean
 *               suspendedReason:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: Updated user
 *       404:
 *         description: User not found
 */
export const updateUser = async (req: Request, res: Response) => {
  const allowed = ["isSuspended", "suspendedReason", "role"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) update[key] = req.body[key];
  }

  if (update["isSuspended"] === false) {
    update["suspendedReason"] = null;
  }

  const user = await User.findByIdAndUpdate(String(req.params["id"]), update, { new: true }).select(
    "-passwordHash -refreshTokenHash",
  );

  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({ success: true, data: user });
};

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user and their profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: User not found
 */
export const deleteUser = async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(String(req.params["id"]));
  if (!user) throw new ApiError(404, "User not found");
  await Profile.findOneAndDelete({ userId: user._id });
  res.status(200).json({ success: true, data: null });
};

// ── Bulk Import ───────────────────────────────────────────────────────────────

interface ImportRow {
  fullName?: string;
  full_name?: string;
  email?: string;
  username?: string;
  department?: string;
  year?: string;
  level?: string;
}

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

function toUsername(fullName: string, email: string): string {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return base || email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 12) + rand;
}

/**
 * @swagger
 * /admin/users/import:
 *   post:
 *     summary: Bulk import users from an Excel (.xlsx) file
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *             required: [file]
 *     responses:
 *       200:
 *         description: Import result summary
 */
export const bulkImport = async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new ApiError(400, "Empty workbook");

  const rows = XLSX.utils.sheet_to_json<ImportRow>(workbook.Sheets[sheetName]);
  if (rows.length === 0) throw new ApiError(400, "No rows found in sheet");

  const results = {
    created: 0,
    skipped: 0,
    errors: [] as Array<{ row: number; email: string; reason: string }>,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const fullName = (row.fullName ?? row.full_name ?? "").toString().trim();
    const email = (row.email ?? "").toString().trim().toLowerCase();
    const department = (row.department ?? "").toString().trim() || null;
    const year = (row.year ?? row.level ?? "").toString().trim() || null;

    if (!email || !fullName) {
      results.errors.push({ row: i + 2, email: email || "(missing)", reason: "Missing email or fullName" });
      continue;
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      results.skipped++;
      continue;
    }

    const dummyPassword = crypto.randomUUID();
    const passwordHash = await hash(dummyPassword);

    let username = (row.username ?? "").toString().trim().toLowerCase();
    if (!username) username = toUsername(fullName, email);

    // Ensure username uniqueness
    const taken = await Profile.findOne({ username }).lean();
    if (taken) username = username + Math.floor(100 + Math.random() * 900);

    try {
      const user = await User.create({
        email,
        passwordHash,
        isEmailVerified: true,
        needsPasswordReset: true,
      });

      await Profile.create({
        userId: user._id,
        username,
        fullName,
        department,
        year,
      });

      // Generate a 6-digit activation code (OTP) valid for 7 days
      const code = crypto.randomInt(100000, 999999).toString();
      const codeHash = await hash(code);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await Otp.create({
        userId: user._id,
        purpose: "reset_password",
        emailTarget: email,
        codeHash,
        expiresAt,
      });

      const setupUrl = `${env.WEB_URL}/reset-password?email=${encodeURIComponent(email)}&code=${code}`;
      const template = welcomeEmail({ fullName, username, email, setupUrl });
      await sendEmail({ to: email, ...template }).catch(() => {
        // Non-fatal — log but don't fail the import
      });

      results.created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.errors.push({ row: i + 2, email, reason: msg });
    }
  }

  res.status(200).json({ success: true, data: results });
};
