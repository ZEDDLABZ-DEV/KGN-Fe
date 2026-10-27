/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from "./Request";
import { isAdmin } from "./roles";

export const isAdminRole = (user: any): boolean => isAdmin(user);

export const getProjectsEndpoint = (user: any): string =>
  isAdminRole(user) ? "/v1/api/projects/all" : "/v1/api/projects";

export const unwrapProjectList = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.projects)) return res.projects;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.projects)) return res.data.projects;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

export const getProjectId = (project: any): string =>
  String(project?.id ?? project?._id ?? project?.projectId ?? "");

export const normalizeProjects = (res: any): any[] =>
  unwrapProjectList(res)
    .map((project) => ({
      ...project,
      id: getProjectId(project),
    }))
    .filter((project) => project.id);

export const loadProjects = async (user: any): Promise<any[]> => {
  const endpoints = Array.from(
    new Set([getProjectsEndpoint(user), "/v1/api/projects/all", "/v1/api/projects"])
  );

  let lastError: unknown;
  for (const endpoint of endpoints) {
    try {
      const response = await Request.get(endpoint);
      const projects = normalizeProjects(response);
      if (projects.length > 0) return projects;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return [];
};
