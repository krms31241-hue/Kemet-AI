import { projectRepository } from "../../repositories/index.js";

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "./project.validator.js";

export class ProjectService {
  async create(
    ownerId: string,
    data: CreateProjectInput,
  ) {
    const project = await projectRepository.create({
      ownerId,
      name: data.name,
      description: data.description,
    });

    return {
      success: true,
      message: "Project created successfully",
      project,
    };
  }

  async findAll(ownerId: string) {
    const projects =
      await projectRepository.findByOwner(ownerId);

    return {
      success: true,
      projects,
    };
  }

  async update(
    ownerId: string,
    projectId: string,
    data: UpdateProjectInput,
  ) {
    const project =
      await projectRepository.findById(projectId);

    if (!project || project.ownerId !== ownerId) {
      throw new Error("Project not found");
    }

    const updated =
      await projectRepository.update(
        projectId,
        data,
      );

    return {
      success: true,
      message: "Project updated successfully",
      project: updated,
    };
  }

  async delete(
    ownerId: string,
    projectId: string,
  ) {
    const project =
      await projectRepository.findById(projectId);

    if (!project || project.ownerId !== ownerId) {
      throw new Error("Project not found");
    }

    await projectRepository.delete(projectId);

    return {
      success: true,
      message: "Project deleted successfully",
    };
  }
}

export const projectService = new ProjectService();
