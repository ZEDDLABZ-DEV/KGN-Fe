/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useMemo } from "react"
import { AuthContext } from "../context/AuthContext"

type PermissionScope = "global" | "project" | "either"

const normalizePermission = (permission: any): string | null => {
  if (!permission) {
    return null
  }

  const raw =
    typeof permission === "string"
      ? permission
      : permission?.name ?? permission?.code ?? null

  if (!raw) {
    return null
  }

  return raw.toString().trim().toLowerCase().replace(/\s+/g, "_")
}

const collectPermissions = (source: any): string[] => {
  if (!source) return []
  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (!item) return null
        if (typeof item === "string") return item
        if (item?.permission) return item.permission
        return item
      })
      .map(normalizePermission)
      .filter(Boolean) as string[]
  }

  return Object.values(source)
    .map(normalizePermission)
    .filter(Boolean) as string[]
}

export const usePermissions = (project?: any) => {
  const { permissions: contextPermissions = [] } = useContext(AuthContext) as any

  const globalPermissions = useMemo(
    () => new Set(collectPermissions(contextPermissions)),
    [contextPermissions]
  )

  const projectPermissions = useMemo(() => {
    const projectSpecific =
      project?.currentUserPermissions ??
      project?.permissionsForCurrentUser ??
      project?.permissions ??
      []
    return new Set(collectPermissions(projectSpecific))
  }, [
    project?.currentUserPermissions,
    project?.permissionsForCurrentUser,
    project?.permissions,
  ])

  const hasPermission = (
    required?: string | string[],
    options?: { scope?: PermissionScope; requireAll?: boolean }
  ): boolean => {
    if (!required) return true

    const { scope = "either", requireAll = false } = options ?? {}
    const requiredList = Array.isArray(required) ? required : [required]
    const normalized = requiredList
      .map(normalizePermission)
      .filter(Boolean) as string[]

    if (normalized.length === 0) return true

    const checkSet = (set: Set<string>) =>
      requireAll
        ? normalized.every((perm) => set.has(perm))
        : normalized.some((perm) => set.has(perm))

    if (scope === "global") {
      return checkSet(globalPermissions)
    }

    if (scope === "project") {
      return checkSet(projectPermissions)
    }

    return checkSet(projectPermissions) || checkSet(globalPermissions)
  }

  return {
    hasPermission,
    globalPermissions,
    projectPermissions,
  }
}

