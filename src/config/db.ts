import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../lib/logger";

async function fixStudentEmailIndex() {
  try {
    const usersCol = mongoose.connection.collection("users");
    const indexes = await usersCol.indexes();
    const bad = indexes.find(
      (ix) => ix.key?.studentEmail === 1 && !ix.sparse,
    );
    if (bad) {
      await usersCol.dropIndex("studentEmail_1");
      logger.info("Dropped non-sparse studentEmail index — will be recreated as sparse");
    }
  } catch {
    // Index may not exist yet — safe to ignore
  }
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    await fixStudentEmailIndex();
  } catch (error) {
    logger.error(error, "Error connecting to MongoDB");
    process.exit(1);
  }
};
