import { apiClient } from "./client";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export const projectsApi = {
  getAll(token: string) {
    return apiClient<Project[]>("/projects", {
      method: "GET",
      token,
    });
  },

  getById(id: string, token: string) {
    return apiClient<Project>(`/projects/${id}`, {
      method: "GET",
      token,
    });
  },

  create(data: CreateProjectRequest, token: string) {
    return apiClient<Project>("/projects", {
      method: "POST",
      token,
      body: JSON.stringify(data),
    });
  },

  delete(id: string, token: string) {
    return apiClient<void>(`/projects/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
