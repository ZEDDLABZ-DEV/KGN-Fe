export const isAdminRole = (user: any): boolean => {
  const roleName =
    typeof user?.role === "string" ? user.role : user?.role?.name;
  return roleName?.toLowerCase?.() === "admin";
};

export const getProjectsEndpoint = (user: any): string =>
  isAdminRole(user) ? "/v1/api/projects/all" : "/v1/api/projects";
