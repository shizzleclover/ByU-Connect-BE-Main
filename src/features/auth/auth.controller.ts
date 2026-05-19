import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../../models/user.model";
import { Profile } from "../profile/profile.model";
import { Otp } from "../verification/otp.model";
import { Service } from "../services/services.model";
import { Project } from "../projects/projects.model";
import { Story } from "../stories/stories.model";
import { Link } from "../links/links.model";
import { Contact } from "../contacts/contacts.model";
import { Resume } from "../resume/resume.model";
import { SavedProfile } from "../saved/saved.model";
import { ProfileView } from "../analytics/profileView.model";
import { OutreachClick } from "../analytics/outreachClick.model";
import { AuthService } from "./auth.service";
import { hash, verify } from "../../lib/password";
import { verifyRefresh } from "../../lib/jwt";
import { ApiError } from "../../lib/apiError";
import { env } from "../../config/env";
import { sendEmail } from "../../lib/mailer";
import { recomputeCompleteness } from "../../lib/completeness";
import cloudinary from "../../config/cloudinary";

const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

function setRefreshCookie(res: Response, token: string) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

async function sendOtp(
  userId: string,
  purpose: "verify_email" | "verify_student_email" | "reset_password",
  emailTarget: string,
  subject: string,
  bodyText: string,
) {
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = await hash(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Remove any existing OTP for this purpose
  await Otp.deleteOne({ userId, purpose });

  await Otp.create({ userId, purpose, emailTarget, codeHash, expiresAt });

  await sendEmail({
    to: emailTarget,
    subject,
    text: `${bodyText}\n\nYour code: ${code}\n\nExpires in 10 minutes. If you didn't request this, ignore this email.`,
  });
}

export const signup = async (req: Request, res: Response) => {
  const { email, password, username, fullName } = req.body;

  const [existingUser, existingUsername] = await Promise.all([
    User.findOne({ email }),
    Profile.findOne({ username }),
  ]);

  if (existingUser) throw new ApiError(409, "Email already in use", "CONFLICT");
  if (existingUsername) throw new ApiError(409, "Username already taken", "CONFLICT");

  const passwordHash = await AuthService.hashPassword(password);

  const user = await User.create({ email, passwordHash });

  await Profile.create({ userId: user._id, username, fullName });

  await sendOtp(
    String(user._id),
    "verify_email",
    email,
    "Verify your ByU Connect email",
    "Welcome to ByU Connect! Please verify your email address.",
  );

  const { accessToken, refreshToken } = AuthService.generateTokens(String(user._id));
  await AuthService.storeRefreshToken(String(user._id), refreshToken);

  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    data: {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
      message: "Account created. Check your email for a verification code.",
    },
  });
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await AuthService.verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.isSuspended) {
    throw new ApiError(403, "Your account has been suspended", "SUSPENDED");
  }

  const { accessToken, refreshToken } = AuthService.generateTokens(String(user._id));
  await AuthService.storeRefreshToken(String(user._id), refreshToken);
  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  setRefreshCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role },
    },
  });
};

export const signout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefresh(token);
      await AuthService.clearRefreshToken(decoded.userId);
    } catch {
      // Expired/invalid token — still clear cookie
    }
  }

  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, data: null });
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "Refresh token missing");

  let decoded: { userId: string };
  try {
    decoded = verifyRefresh(token);
  } catch {
    res.clearCookie("refreshToken");
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const valid = await AuthService.verifyRefreshToken(decoded.userId, token);
  if (!valid) {
    res.clearCookie("refreshToken");
    throw new ApiError(401, "Invalid refresh token. Please sign in again.");
  }

  const tokens = AuthService.generateTokens(decoded.userId);
  await AuthService.storeRefreshToken(decoded.userId, tokens.refreshToken);

  setRefreshCookie(res, tokens.refreshToken);

  res.status(200).json({ success: true, data: { accessToken: tokens.accessToken } });
};

export const me = async (req: Request, res: Response) => {
  const user = req.user!;
  const profile = await Profile.findOne({ userId: user._id }).lean();

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isVerified: !!user.studentEmailVerifiedAt,
      },
      profile,
    },
  });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (user.isEmailVerified) {
    return res.status(200).json({ success: true, data: { message: "Already verified" } });
  }

  const otp = await Otp.findOne({
    userId: user._id,
    purpose: "verify_email",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!otp) throw new ApiError(400, "No valid verification code found. Request a new one.");

  if (otp.attempts >= 5) throw new ApiError(429, "Too many attempts. Request a new code.");

  const correct = await verify(code, otp.codeHash);
  if (!correct) {
    await Otp.findByIdAndUpdate(otp._id, { $inc: { attempts: 1 } });
    throw new ApiError(400, "Invalid verification code");
  }

  await Promise.all([
    Otp.findByIdAndUpdate(otp._id, { consumedAt: new Date() }),
    User.findByIdAndUpdate(user._id, { isEmailVerified: true }),
  ]);

  const profile = await Profile.findOne({ userId: user._id });
  await sendEmail({
    to: email,
    subject: "Welcome to ByU Connect!",
    text: `Your email is verified. Your canvas is live at byu-connect.com/${profile?.username ?? ""}`,
  });

  res.status(200).json({ success: true, data: { message: "Email verified successfully" } });
};

export const resendVerification = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  // Don't reveal whether email exists
  if (!user || user.isEmailVerified) {
    return res.status(200).json({
      success: true,
      data: { message: "If your email exists and is unverified, a code has been sent." },
    });
  }

  await sendOtp(
    String(user._id),
    "verify_email",
    email,
    "Verify your ByU Connect email",
    "Here is your new verification code.",
  );

  res.status(200).json({
    success: true,
    data: { message: "Verification code sent." },
  });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    await sendOtp(
      String(user._id),
      "reset_password",
      email,
      "Reset your ByU Connect password",
      "You requested a password reset.",
    );
  }

  // Always respond the same way to avoid user enumeration
  res.status(200).json({
    success: true,
    data: { message: "If an account with that email exists, a reset code has been sent." },
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(400, "Invalid reset request");

  const otp = await Otp.findOne({
    userId: user._id,
    purpose: "reset_password",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!otp) throw new ApiError(400, "No valid reset code found. Request a new one.");

  if (otp.attempts >= 5) throw new ApiError(429, "Too many attempts. Request a new code.");

  const correct = await verify(code, otp.codeHash);
  if (!correct) {
    await Otp.findByIdAndUpdate(otp._id, { $inc: { attempts: 1 } });
    throw new ApiError(400, "Invalid reset code");
  }

  const passwordHash = await hash(newPassword);

  await Promise.all([
    Otp.findByIdAndUpdate(otp._id, { consumedAt: new Date() }),
    User.findByIdAndUpdate(user._id, { passwordHash, refreshTokenHash: null }),
  ]);

  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, data: { message: "Password reset successfully. Please sign in." } });
};

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = String(req.user!._id);

  const profile = await Profile.findOne({ userId }).lean();
  if (!profile) throw new ApiError(404, "Profile not found");
  const profileId = String(profile._id);

  // Collect Cloudinary publicIds for cleanup
  const publicIds: string[] = [];
  if (profile.avatarPublicId) publicIds.push(profile.avatarPublicId);

  const projects = await Project.find({ profileId }).select("coverPublicId gallery").lean();
  for (const proj of projects) {
    if (proj.coverPublicId) publicIds.push(proj.coverPublicId);
    for (const item of proj.gallery ?? []) {
      if (item.publicId) publicIds.push(item.publicId);
    }
  }

  const stories = await Story.find({ profileId }).select("coverPublicId").lean();
  for (const s of stories) {
    if (s.coverPublicId) publicIds.push(s.coverPublicId);
  }

  const resume = await Resume.findOne({ profileId }).lean();
  if (resume?.publicId) publicIds.push(resume.publicId);

  // Delete Cloudinary assets (best-effort, don't block on failure)
  await Promise.allSettled(
    publicIds.map((id) => cloudinary.uploader.destroy(id).catch(() => {})),
  );

  // Cascade delete all user data
  await Promise.all([
    Service.deleteMany({ profileId }),
    Project.deleteMany({ profileId }),
    Story.deleteMany({ profileId }),
    Link.deleteMany({ profileId }),
    Contact.deleteMany({ profileId }),
    Resume.deleteOne({ profileId }),
    SavedProfile.deleteMany({ $or: [{ userId }, { profileId }] }),
    ProfileView.deleteMany({ profileId }),
    OutreachClick.deleteMany({ profileId }),
    Otp.deleteMany({ userId }),
    Profile.deleteOne({ _id: profileId }),
    User.deleteOne({ _id: userId }),
  ]);

  res.clearCookie("refreshToken");
  res.status(200).json({ success: true, data: { message: "Account deleted." } });
};
