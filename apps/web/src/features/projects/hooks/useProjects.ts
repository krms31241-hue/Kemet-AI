import { useEffect, useState } from "react";

import { getProjects } from "../services/project.service";

import type { Project } from "../types";

export function useProjects(
  token: string,
) {
  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    getProjects(token)
      .then(setProjects)
      .finally(() => setLoading(false));
  }, [token]);

  return {
    projects,
    loading,
  };
}
