import { prisma } from "../database/prisma.js";

export interface ProjectEntity {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectRepository {
  async create(
    data: Omit<ProjectEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<ProjectEntity> {
    return prisma.project.create({
      data,
    });
  }

  async findById(id: string): Promise<ProjectEntity | null> {
    return prisma.project.findUnique({
      where: { id },
    });
  }

  async findByOwner(
    ownerId: string,
  ): Promise<ProjectEntity[]> {
    return prisma.project.findMany({
      where: { ownerId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findByIdAndOwner(
    id: string,
    ownerId: string,
  ): Promise<ProjectEntity | null> {
    return prisma.project.findFirst({
      where: {
        id,
        ownerId,
      },
    });
  }

  async update(
    id: string,
    data: Partial<Omit<ProjectEntity, "id" | "ownerId">>,
  ): Promise<ProjectEntity | null> {
    const exists = await prisma.project.findUnique({
      where: { id },
    });

    if (!exists) {
      return null;
    }

    return prisma.project.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    const exists = await prisma.project.findUnique({
      where: { id },
    });

    if (!exists) {
      return false;
    }

    await prisma.project.delete({
      where: { id },
    });

    return true;
  }
}

export const projectRepository = new ProjectRepository();
