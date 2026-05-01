/**
 * Wipes all user-generated data from the database.
 * Run once before production launch: npx tsx scripts/wipe-db.ts
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const COLLECTIONS = [
  "users",
  "profiles",
  "services",
  "projects",
  "links",
  "stories",
  "contacts",
  "resumes",
  "profileviews",
  "savedprofiles",
  "otpverifications",
  "passwordresettokens",
];

async function wipe() {
  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_URL;
  if (!uri) {
    console.error("MONGODB_URI not set in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB\n");

  for (const col of COLLECTIONS) {
    try {
      const result = await mongoose.connection.collection(col).deleteMany({});
      console.log(`  ${col}: deleted ${result.deletedCount} documents`);
    } catch {
      console.log(`  ${col}: skipped (collection may not exist)`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone. Database is clean.");
}

wipe().catch((err) => {
  console.error(err);
  process.exit(1);
});
