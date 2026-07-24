/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from "react"
import { Input, Select, Skeleton } from "antd"
import { ParentLayout } from "../../layout/ParentLayout"
import { ProjectCard } from "../../components/project-components/ProjectCard"
import { CreateProjectModal } from "../../components/project-components/CreateProjectModal"
import { Request } from "../../utils/Request"
import { getProjectsEndpoint } from "../../utils/projects"
import { toast } from "react-hot-toast"
import { NoContent } from "../../components/no-content"
import { AuthContext } from "../../context/AuthContext"
import { FiPlus, FiSearch, FiFolder, FiGrid, FiList } from "react-icons/fi"
import { GoProjectRoadmap } from "react-icons/go"

const STATUS_FILTERS = [
  { label: "All Status", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "In Progress", value: "INPROGRESS" },
  { label: "Not Started", value: "NOTSTARTED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "On Hold", value: "ONHOLD" },
  { label: "Paused", value: "PAUSED" },
]

const Projects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const { user, permissions = [] } = useContext(AuthContext) as any

  const handleCreateProject = async (e: any) => {
    try {
      await Request.post("/v1/api/projects", e)
      toast.success("Project created successfully")
      setIsModalOpen(false)
      await getProjects()
    } catch (error) {
      console.log(error)
      toast.error("Failed to create project")
    }
  }

  const getProjects = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await Request.get(getProjectsEndpoint(user))
      setProjects(res.data || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to get projects", { duration: 2000 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getProjects()
  }, [user])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      !searchTerm ||
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      !statusFilter || project.status?.toUpperCase() === statusFilter

    return matchesSearch && matchesStatus
  })

  const activeCount = projects.filter(
    (p) => p.status?.toUpperCase() === "ACTIVE" || p.status?.toUpperCase() === "INPROGRESS"
  ).length
  const completedCount = projects.filter(
    (p) => p.status?.toUpperCase() === "COMPLETED"
  ).length
  const onHoldCount = projects.filter(
    (p) => p.status?.toUpperCase() === "ONHOLD" || p.status?.toUpperCase() === "PAUSED"
  ).length

  return (
    <ParentLayout title="Projects">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                <GoProjectRoadmap className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
                <p className="text-sm text-gray-500">
                  Manage and monitor all your construction projects
                </p>
              </div>
            </div>
            {permissions.find((p: any) => p.name === "create_projects") && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <FiPlus size={18} />
                New Project
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <FiFolder className="text-slate-600" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Total Projects
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Active
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Completed
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{onHoldCount}</p>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  On Hold
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10 rounded-lg border-gray-200"
                allowClear
              />
            </div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_FILTERS}
              className="w-full sm:w-40"
              placeholder="Filter by status"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-slate-900 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <FiList size={18} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-slate-900 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
            >
              <FiGrid size={18} />
            </button>
          </div>
        </div>

        {/* Results Info */}
        {!loading && filteredProjects.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing <strong className="text-gray-700">{filteredProjects.length}</strong> of{" "}
              <strong className="text-gray-700">{projects.length}</strong> projects
            </span>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("")
                }}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Project List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <Skeleton.Avatar active size={48} />
                  <div className="flex-1 space-y-3">
                    <Skeleton.Input active className="w-48!" />
                    <Skeleton.Input active className="w-full!" size="small" />
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <Skeleton.Input active className="w-full!" />
                  <Skeleton.Input active className="w-full!" />
                  <Skeleton.Input active className="w-full!" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          searchTerm || statusFilter ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center">
              <FiSearch className="mb-4 text-gray-300" size={48} />
              <h3 className="text-lg font-semibold text-gray-900">No projects found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("")
                }}
                className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <NoContent
              title="No projects created yet"
              description="Get started by creating your first construction project."
              buttonText="Create Project"
              onClick={() => setIsModalOpen(true)}
            />
          )
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-4"
            }
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                getProjects={getProjects}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={(e) => handleCreateProject(e)}
      />
    </ParentLayout>
  )
}

export { Projects }
