import { prisma } from "../database/prisma.js";

export interface UserEntity {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  async create(
    user: Omit<UserEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserEntity> {
    return prisma.user.create({
      data: user,
    });
  }

  async update(
    id: string,
    data: Partial<Omit<UserEntity, "id">>,
  ): Promise<UserEntity | null> {
    const exists = await prisma.user.findUnique({
      where: { id },
    });

    if (!exists) {
      return null;
    }

    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    const exists = await prisma.user.findUnique({
      where: { id },
    });

    if (!exists) {
      return false;
    }

    await prisma.user.delete({
      where: { id },
    });

    return true;
  }

  async findAll(): Promise<UserEntity[]> {
    return prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export const userRepository = new UserRepository();
