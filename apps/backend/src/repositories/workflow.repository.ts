import { prisma } from "../database/prisma.js";
import type { Prisma, Workflow } from "@prisma/client";

export class WorkflowRepository {
  async create(
    data: Prisma.WorkflowUncheckedCreateInput,
  ): Promise<Workflow> {
    return prisma.workflow.create({
      data,
    });
  }

  async findById(
    id: string,
  ): Promise<Workflow | null> {
    return prisma.workflow.findUnique({
      where: { id },
    });
  }

  async findByProject(
    projectId: string,
  ): Promise<Workflow[]> {
    return prisma.workflow.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(
    id: string,
    data: Prisma.WorkflowUncheckedUpdateInput,
  ): Promise<Workflow | null> {
    const exists =
      await prisma.workflow.findUnique({
        where: { id },
      });

    if (!exists) {
      return null;
    }

    return prisma.workflow.update({
      where: {
        id,
      },
      data,
    });
  }

  async delete(
    id: string,
  ): Promise<boolean> {
    const exists =
      await prisma.workflow.findUnique({
        where: { id },
      });

    if (!exists) {
      return false;
    }

    await prisma.workflow.delete({
      where: {
        id,
      },
    });

    return true;
  }
}

export const workflowRepository =
  new WorkflowRepository();
