import { hash, verify } from "../../lib/password";
import { signAccess, signRefresh } from "../../lib/jwt";
import { User } from "../../models/user.model";

export class AuthService {
  static hashPassword(plain: string) {
    return hash(plain);
  }

  static verifyPassword(plain: string, hashed: string) {
    return verify(plain, hashed);
  }

  static generateTokens(userId: string) {
    return {
      accessToken: signAccess(userId),
      refreshToken: signRefresh(userId),
    };
  }

  static async storeRefreshToken(userId: string, token: string) {
    const tokenHash = await hash(token);
    await User.findByIdAndUpdate(userId, { refreshTokenHash: tokenHash });
  }

  static async clearRefreshToken(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }

  static async verifyRefreshToken(
    userId: string,
    incomingToken: string,
  ): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user?.refreshTokenHash) return false;

    const valid = await verify(incomingToken, user.refreshTokenHash);
    if (!valid) {
      // Possible token reuse — revoke all sessions
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
      return false;
    }
    return true;
  }
}
