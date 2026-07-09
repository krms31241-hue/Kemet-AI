import { apiClient } from "../../../services/api/client";

import type {
  Project,
  ProjectsResponse,
} from "../types";

export async function getProjects(
  token: string,
): Promise<Project[]> {
  const response =
    await apiClient<ProjectsResponse>(
      "/api/v1/projects",
      {
        token,
      },
    );

  return response.projects;
}

