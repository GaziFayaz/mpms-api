import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/errors.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { JwtPayload } from "../../types/index.js";

export class AuthService {
  async register(data: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw AppError.conflict("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });

    const token = this.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = this.generateRefreshToken({ userId: user.id, role: user.role });

    return { user, token, refreshToken };
  }

  async login(data: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    const token = this.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = this.generateRefreshToken({ userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      token,
      refreshToken,
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, department: true, skills: true },
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    return user;
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
      const newAccessToken = this.generateAccessToken({ userId: decoded.userId, role: decoded.role });
      const newRefreshToken = this.generateRefreshToken({ userId: decoded.userId, role: decoded.role });
      return { token: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw AppError.unauthorized("Invalid or expired refresh token");
    }
  }

  private generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN } as jwt.SignOptions);
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
  }
}

export const authService = new AuthService();
