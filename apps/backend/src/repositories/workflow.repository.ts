import { prisma } from "../database/prisma.js";
import type { Prisma } from "@prisma/client";

export interface WorkflowEntity {
  id: string;

  projectId: string;

  name: string;
  description?: string | null;

  nodes: Prisma.JsonValue;
  edges: Prisma.JsonValue;

  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowRepository {
  async create(
    data: Omit<WorkflowEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<WorkflowEntity> {
    return prisma.workflow.create({ data });
  }

  async findById(id: string): Promise<WorkflowEntity | null> {
    return prisma.workflow.findUnique({ where: { id } });
  }

  async findByProject(projectId: string): Promise<WorkflowEntity[]> {
    return prisma.workflow.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(
    id: string,
    data: Partial<Omit<WorkflowEntity, "id" | "projectId">>,
  ): Promise<WorkflowEntity | null> {
    const exists = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!exists) return null;

    return prisma.workflow.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<boolean> {
    const exists = await prisma.workflow.findUnique({
      where: { id },
    });

    if (!exists) return false;

    await prisma.workflow.delete({
      where: { id },
    });

    return true;
  }
}

export const workflowRepository = new WorkflowRepository();
