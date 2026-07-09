export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  success: boolean;
  projects: Project[];
}
