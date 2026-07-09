import crypto from "node:crypto";

export interface UserEntity {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository {
  private users = new Map<string, UserEntity>();

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }

    return null;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }

    return null;
  }

  async create(
    user: Omit<UserEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserEntity> {
    const entity: UserEntity = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(entity.id, entity);

    return entity;
  }

  async update(
    id: string,
    data: Partial<Omit<UserEntity, "id">>,
  ): Promise<UserEntity | null> {
    const user = await this.findById(id);

    if (!user) {
      return null;
    }

    const updated: UserEntity = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };

    this.users.set(id, updated);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async findAll(): Promise<UserEntity[]> {
    return [...this.users.values()];
  }
}

export const userRepository = new UserRepository();
