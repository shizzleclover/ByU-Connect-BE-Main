import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../../models/user.model";
import { Otp } from "./otp.model";
import { hash, verify } from "../../lib/password";
import { sendEmail } from "../../lib/mailer";
import { ApiError } from "../../lib/apiError";
import { recomputeCompleteness } from "../../lib/completeness";
import { Profile } from "../profile/profile.model";

export const startStudentVerification = async (req: Request, res: Response) => {
  const { studentEmail } = req.body;
  const userId = String(req.user!._id);

  const domain = studentEmail.split("@")[1];
  if (domain !== env.STUDENT_EMAIL_DOMAIN) {
    throw new ApiError(
      400,
      `Student email must be a @${env.STUDENT_EMAIL_DOMAIN} address`,
    );
  }

  // Check not already taken by another user
  const conflict = await User.findOne({ studentEmail, _id: { $ne: userId } });
  if (conflict) {
    throw new ApiError(409, "This student email is already associated with another account");
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = await hash(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.deleteOne({ userId, purpose: "verify_student_email" });
  await Otp.create({
    userId,
    purpose: "verify_student_email",
    emailTarget: studentEmail,
    codeHash,
    expiresAt,
  });

  // Store student email on user (unverified)
  await User.findByIdAndUpdate(userId, { studentEmail });

  await sendEmail({
    to: studentEmail,
    subject: "Verify your student email on ByU Connect",
    text: `Your verification code is: ${code}\n\nExpires in 10 minutes.`,
  });

  res.status(200).json({
    success: true,
    data: { message: "Verification code sent to your student email." },
  });
};

export const confirmStudentVerification = async (req: Request, res: Response) => {
  const { code } = req.body;
  const userId = String(req.user!._id);

  const otp = await Otp.findOne({
    userId,
    purpose: "verify_student_email",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!otp) throw new ApiError(400, "No valid code found. Please request a new one.");
  if (otp.attempts >= 5) throw new ApiError(429, "Too many attempts. Request a new code.");

  const correct = await verify(code, otp.codeHash);
  if (!correct) {
    await Otp.findByIdAndUpdate(otp._id, { $inc: { attempts: 1 } });
    throw new ApiError(400, "Invalid verification code");
  }

  await Promise.all([
    Otp.findByIdAndUpdate(otp._id, { consumedAt: new Date() }),
    User.findByIdAndUpdate(userId, {
      studentEmail: otp.emailTarget,
      studentEmailVerifiedAt: new Date(),
    }),
  ]);

  const profile = await Profile.findOne({ userId }).lean();
  if (profile) {
    await recomputeCompleteness(String(profile._id));
  }

  res.status(200).json({
    success: true,
    data: { message: "Student email verified. You now have a Verified badge!" },
  });
};
