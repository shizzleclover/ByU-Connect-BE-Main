import rateLimit from "express-rate-limit";

const make = (windowMs: number, max: number) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false });

export const rateLimits = {
  // Auth
  signin: make(15 * 60 * 1000, 10),           // 10 / 15 min per IP
  signup: make(60 * 60 * 1000, 5),             // 5 / hr per IP
  otpSend: make(60 * 60 * 1000, 3),            // 3 / hr per email (applied per request)

  // Content creation
  createStory: make(24 * 60 * 60 * 1000, 10), // 10 / day per user
  createProject: make(24 * 60 * 60 * 1000, 10),

  // Reports
  report: make(24 * 60 * 60 * 1000, 5),       // 5 / day per user

  // Username change — 30d overflows 32-bit int; cap window at 7d (max for MemoryStore)
  usernameChange: make(7 * 24 * 60 * 60 * 1000, 1), // 1 / 7d per user
};
