import crypto from "node:crypto";

export interface ProjectEntity {
  id: string;

  ownerId: string;

  name: string;

  description?: string;

  createdAt: Date;

  updatedAt: Date;
}

export class ProjectRepository {
  private projects = new Map<string, ProjectEntity>();

  async create(
    data: Omit<ProjectEntity, "id" | "createdAt" | "updatedAt">,
  ) {
    const project: ProjectEntity = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.set(project.id, project);

    return project;
  }

  async findById(id: string) {
    return this.projects.get(id) ?? null;
  }

  async findByOwner(ownerId: string) {
    return [...this.projects.values()].filter(
      (project) => project.ownerId === ownerId,
    );
  }

  async findByIdAndOwner(
    id: string,
    ownerId: string,
  ) {
    const project = await this.findById(id);

    if (!project || project.ownerId !== ownerId) {
      return null;
    }

    return project;
  }

  async update(
    id: string,
    data: Partial<Omit<ProjectEntity, "id" | "ownerId">>,
  ) {
    const project = await this.findById(id);

    if (!project) {
      return null;
    }

    const updated: ProjectEntity = {
      ...project,
      ...data,
      updatedAt: new Date(),
    };

    this.projects.set(id, updated);

    return updated;
  }

  async delete(id: string) {
    return this.projects.delete(id);
  }
}

export const projectRepository = new ProjectRepository();
