import { connectDB } from "./src/config/db";
import { User } from "./src/models/user.model";
import { Profile } from "./src/features/profile/profile.model";
import { hash } from "./src/lib/password";
import mongoose from "mongoose";

async function seedAdmin() {
  try {
    await connectDB();
    console.log("Connected to DB.");

    const email = "admin@admin.com";
    const username = "admin";
    const password = "admin1234";

    const passwordHash = await hash(password);

    // Check if exists
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        passwordHash,
        role: "admin",
        isEmailVerified: true,
      });
      console.log("Created admin user.");
    } else {
      user.role = "admin";
      user.passwordHash = passwordHash;
      await user.save();
      console.log("Updated existing admin user.");
    }

    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      await Profile.create({
        userId: user._id,
        username,
        fullName: "System Admin",
      });
      console.log("Created admin profile.");
    } else {
      profile.username = username;
      await profile.save();
      console.log("Updated existing admin profile.");
    }

    console.log("Admin seed completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
