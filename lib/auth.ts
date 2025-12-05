import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface UserProfile {
  email: string;
  name: string;
  password?: string;
  picture?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
  token: string;
}

export async function createUser(profile: UserProfile) {
  // For OAuth users, password is optional
  const hashedPassword = profile.password
    ? await bcrypt.hash(profile.password, 10)
    : null;

  const user = await prisma.user.create({
    data: {
      email: profile.email,
      name: profile.name,
      password: hashedPassword,
      picture: profile.picture,
    },
  });

  return user;
}

export async function createOrUpdateGoogleUser(
  email: string,
  name: string,
  picture?: string
) {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Update user info if needed (especially picture)
    if (picture && existingUser.picture !== picture) {
      return prisma.user.update({
        where: { id: existingUser.id },
        data: { picture, name }, // Update name too in case it changed
      });
    }
    return existingUser;
  }

  // Create new user without password
  return prisma.user.create({
    data: {
      email,
      name,
      picture,
      password: null, // OAuth users don't have passwords
    },
  });
}

export async function verifyUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return null;
  }

  return user;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      picture: true,
      createdAt: true,
    },
  });
}
