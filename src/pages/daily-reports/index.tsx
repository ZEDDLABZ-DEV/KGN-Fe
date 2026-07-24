/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Empty, Image, Input, Select, Skeleton } from "antd"
import { toast } from "react-hot-toast"
import moment from "moment"
import { FiCalendar, FiChevronDown, FiFileText, FiFolder, FiSearch, FiUser } from "react-icons/fi"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import { getProjectsEndpoint, isAdminRole } from "../../utils/projects"

interface Project {
  id: string
  name: string
  description?: string
}

interface DailyReport {
  id?: string
  taskId?: string
  taskName?: string
  reportDate?: string
  progressUpdate?: string
  images?: string[]
  createdAt?: string
  createdBy?: { id?: string; name?: string }
  task?: { id?: string; name?: string }
}

const formatReportDate = (date?: string) =>
  date ? moment(date).format("MMM DD, YYYY") : "No date"

const apiBaseUrl =
  import.meta.env.VITE_USE_PROXY === "true"
    ? ""
    : import.meta.env.VITE_BASE_URL ?? ""

const resolveImageUrl = (image: string) =>
  /^(https?:)?\/\//i.test(image) || image.startsWith("data:")
    ? image
    : `${apiBaseUrl}${image.startsWith("/") ? "" : "/"}${image}`

const normalizeImages = (images: unknown): string[] =>
  Array.isArray(images)
    ? images.filter((img): img is string => typeof img === "string" && !!img)
    : []

const normalizeReports = (raw: unknown): DailyReport[] => {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item: any) => {
    if (Array.isArray(item?.updates)) {
      return item.updates.map((update: any) => ({
        id: update?.id ?? `${item?.taskId ?? item?.task?.id}-${update?.reportDate}`,
        taskId: item?.taskId ?? item?.task?.id,
        taskName: item?.taskName ?? item?.task?.name ?? item?.name,
        reportDate: update?.reportDate ?? update?.date,
        progressUpdate: update?.progressUpdate ?? update?.description ?? update?.update,
        images: normalizeImages(update?.images),
        createdAt: update?.createdAt,
        createdBy: update?.createdBy ?? update?.user,
      }))
    }

    return [
      {
        id: item?.id,
        taskId: item?.taskId ?? item?.task?.id,
        taskName: item?.taskName ?? item?.task?.name ?? item?.name,
        reportDate: item?.reportDate ?? item?.date,
        progressUpdate: item?.progressUpdate ?? item?.description ?? item?.update,
        images: normalizeImages(item?.images),
        createdAt: item?.createdAt,
        createdBy: item?.createdBy ?? item?.user,
      },
    ]
  })
}

const DailyReports = () => {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext) as any
  const isAdmin = isAdminRole(user)

  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Only administrators can access daily reports")
      navigate("/")
    }
  }, [user, isAdmin, navigate])

  const getProjects = async () => {
    if (!user || !isAdmin) return
    setProjectsLoading(true)
    try {
      const response = await Request.get(getProjectsEndpoint(user))
      setProjects(response.data || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load projects")
    } finally {
      setProjectsLoading(false)
    }
  }

  const getDailyReports = async (projectId: string) => {
    if (!projectId) return
    setLoading(true)
    try {
      const response: any = await Request.get(
        `/v1/api/tasks/project/${projectId}/updates`
      )
      const rawReports = response?.data ?? response ?? []
      setReports(normalizeReports(rawReports))
    } catch (error) {
      console.log(error)
      toast.error("Failed to load daily reports")
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getProjects()
  }, [user])

  const handleSelectProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    setSelectedProject(project)
    setSearchTerm("")
    await getDailyReports(projectId)
  }

  const filteredReports = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return reports

    return reports.filter((report) => {
      const haystack = [
        report.taskName,
        report.progressUpdate,
        report.createdBy?.name,
        formatReportDate(report.reportDate),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(term)
    })
  }, [reports, searchTerm])

  const groupedReports = useMemo(() => {
    const groups = new Map<string, DailyReport[]>()

    filteredReports.forEach((report) => {
      const key = report.taskName || report.taskId || "Unknown task"
      const existing = groups.get(key) ?? []
      existing.push(report)
      groups.set(key, existing)
    })

    return Array.from(groups.entries()).map(([taskName, taskReports]) => ({
      taskName,
      taskReports: [...taskReports].sort((a, b) =>
        moment(b.reportDate || b.createdAt).valueOf() -
        moment(a.reportDate || a.createdAt).valueOf()
      ),
    }))
  }, [filteredReports])

  if (!isAdmin) {
    return (
      <ParentLayout title="Daily Reports">
        <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
          <Empty description="Access restricted to administrators" />
        </div>
      </ParentLayout>
    )
  }

  return (
    <ParentLayout title="Daily Reports">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <FiFileText className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Daily Reports</h1>
                <p className="text-sm text-gray-500">
                  Review task progress records by project
                </p>
              </div>
            </div>

            <Select
              placeholder="Select a project..."
              value={selectedProject?.id}
              onChange={handleSelectProject}
              loading={projectsLoading}
              className="w-full lg:w-72"
              size="large"
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
              options={projects.map((project) => ({
                label: project.name,
                value: project.id,
              }))}
              suffixIcon={<FiChevronDown className="text-gray-400" />}
            />
          </div>
        </div>

        {!selectedProject ? (
          <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <p className="text-gray-500">Select a project to view daily reports</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Reports are grouped by task within the selected project
                  </p>
                </div>
              }
            />
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                    <FiFolder className="text-violet-600" size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedProject.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {filteredReports.length} report
                      {filteredReports.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <Input
                  placeholder="Search by task, update, or author..."
                  prefix={<FiSearch className="text-gray-400" />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-xs"
                  allowClear
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <Skeleton active paragraph={{ rows: 3 }} />
                  </div>
                ))}
              </div>
            ) : groupedReports.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchTerm
                      ? "No daily reports match your search"
                      : "No daily reports found for this project"
                  }
                />
              </div>
            ) : (
              <div className="space-y-4">
                {groupedReports.map(({ taskName, taskReports }) => (
                  <section
                    key={taskName}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                      <h3 className="text-base font-semibold text-gray-900">{taskName}</h3>
                      <p className="text-sm text-gray-500">
                        {taskReports.length} daily report
                        {taskReports.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {taskReports.map((report, index) => (
                        <article key={report.id ?? `${taskName}-${index}`} className="px-5 py-4">
                          <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                              <FiCalendar size={14} />
                              {formatReportDate(report.reportDate || report.createdAt)}
                            </span>
                            {report.createdBy?.name && (
                              <span className="inline-flex items-center gap-1.5">
                                <FiUser size={14} />
                                {report.createdBy.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-gray-700">
                            {report.progressUpdate || "No update provided"}
                          </p>
                          {report.images && report.images.length > 0 && (
                            <Image.PreviewGroup>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {report.images.map((image, imageIndex) => (
                                  <Image
                                    key={`${image}-${imageIndex}`}
                                    src={resolveImageUrl(image)}
                                    alt={`Report image ${imageIndex + 1}`}
                                    width={96}
                                    height={96}
                                    className="rounded-lg object-cover"
                                    wrapperClassName="overflow-hidden rounded-lg border border-gray-200"
                                  />
                                ))}
                              </div>
                            </Image.PreviewGroup>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ParentLayout>
  )
}

export { DailyReports }
