/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Button, DatePicker, Empty, Input, Segmented, Select, Skeleton, Tabs, Tag } from "antd"
import { toast } from "react-hot-toast"
import dayjs, { Dayjs } from "dayjs"
import {
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiSearch,
  FiUserCheck,
  FiUsers,
  FiXCircle,
} from "react-icons/fi"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import { getProjectsEndpoint } from "../../utils/projects"
import { usePermissions } from "../../hooks/usePermissions"

const { RangePicker } = DatePicker

interface Project {
  id: string
  name: string
}

type AttendanceStatus = "PRESENT" | "ABSENT"

interface Worker {
  labourId: string
  name: string
  role?: string
  source?: string
  status?: AttendanceStatus | null
  description?: string
}

interface AttendanceRecord {
  labourId?: string
  name?: string
  status?: string
  description?: string
}

interface AttendanceDay {
  date: string
  presentCount: number
  absentCount: number
  records: AttendanceRecord[]
}

const DATE_FORMAT = "YYYY-MM-DD"

const normalizeWorkers = (raw: unknown): Worker[] => {
  if (!Array.isArray(raw)) return []

  return raw
    .map((item: any) => {
      const labourId = item?.labourId ?? item?.id ?? item?.labour?.id
      if (!labourId) return null

      return {
        labourId,
        name:
          item?.name ??
          item?.labour?.name ??
          item?.user?.name ??
          "Unknown worker",
        role:
          item?.role ??
          item?.designation ??
          item?.category ??
          item?.labour?.role,
        source: item?.source ?? item?.type,
        status: item?.attendance?.status ?? item?.status ?? null,
        description: item?.attendance?.description ?? "",
      } as Worker
    })
    .filter(Boolean) as Worker[]
}

const normalizeAttendanceDays = (raw: any): AttendanceDay[] => {
  // Handles both a single-day object and a grouped-by-date array/map
  const entries: any[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Array.isArray(raw?.days)
        ? raw.days
        : Object.entries(raw).map(([date, value]: [string, any]) =>
            Array.isArray(value) ? { date, records: value } : { date, ...value }
          )
      : []

  return entries
    .map((entry: any) => {
      const records: AttendanceRecord[] = (
        entry?.records ??
        entry?.attendance ??
        []
      ).map((record: any) => ({
        labourId: record?.labourId ?? record?.labour?.id ?? record?.id,
        name: record?.name ?? record?.labour?.name ?? "Unknown worker",
        status: record?.status,
        description: record?.description,
      }))

      const presentCount =
        entry?.presentCount ??
        entry?.present ??
        records.filter((r) => r.status === "PRESENT").length
      const absentCount =
        entry?.absentCount ??
        entry?.absent ??
        records.filter((r) => r.status === "ABSENT").length

      return {
        date: entry?.date ?? entry?._id ?? "",
        presentCount,
        absentCount,
        records,
      }
    })
    .filter((day) => day.date)
    .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
}

const Attendance = () => {
  const { user } = useContext(AuthContext) as any
  const { hasPermission } = usePermissions()

  const canMark = hasPermission("mark_attendance", { scope: "global" })
  const canView = hasPermission("view_attendance", { scope: "global" })

  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState<string>(canMark ? "mark" : "history")

  // Mark attendance state
  const [markDate, setMarkDate] = useState<Dayjs>(dayjs())
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workersLoading, setWorkersLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // History state
  const [historyRange, setHistoryRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(6, "day"),
    dayjs(),
  ])
  const [historyDays, setHistoryDays] = useState<AttendanceDay[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    const getProjects = async () => {
      if (!user) return
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
    getProjects()
  }, [user])

  const getWorkers = useCallback(
    async (projectId: string, date: Dayjs) => {
      if (!projectId || !canMark) return
      setWorkersLoading(true)
      try {
        const response: any = await Request.get(
          `/v1/api/attendance/project/${projectId}/workers`,
          { params: { date: date.format(DATE_FORMAT) } }
        )
        setWorkers(normalizeWorkers(response?.data ?? response ?? []))
      } catch (error) {
        console.log(error)
        toast.error("Failed to load workers")
        setWorkers([])
      } finally {
        setWorkersLoading(false)
      }
    },
    [canMark]
  )

  const getHistory = useCallback(
    async (projectId: string, range: [Dayjs, Dayjs]) => {
      if (!projectId || !canView) return
      setHistoryLoading(true)
      try {
        const response: any = await Request.get(
          `/v1/api/attendance/project/${projectId}`,
          {
            params: {
              startDate: range[0].format(DATE_FORMAT),
              endDate: range[1].format(DATE_FORMAT),
            },
          }
        )
        setHistoryDays(normalizeAttendanceDays(response?.data ?? response ?? []))
      } catch (error) {
        console.log(error)
        toast.error("Failed to load attendance")
        setHistoryDays([])
      } finally {
        setHistoryLoading(false)
      }
    },
    [canView]
  )

  const handleSelectProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (!project) return
    setSelectedProject(project)
    setSearchTerm("")
    getWorkers(project.id, markDate)
    getHistory(project.id, historyRange)
  }

  const handleMarkDateChange = (date: Dayjs | null) => {
    if (!date) return
    setMarkDate(date)
    if (selectedProject) getWorkers(selectedProject.id, date)
  }

  const handleHistoryRangeChange = (range: any) => {
    if (!range?.[0] || !range?.[1]) return
    setHistoryRange([range[0], range[1]])
    if (selectedProject) getHistory(selectedProject.id, [range[0], range[1]])
  }

  const updateWorker = (labourId: string, patch: Partial<Worker>) => {
    setWorkers((prev) =>
      prev.map((worker) =>
        worker.labourId === labourId ? { ...worker, ...patch } : worker
      )
    )
  }

  const markAll = (status: AttendanceStatus) => {
    setWorkers((prev) => prev.map((worker) => ({ ...worker, status })))
  }

  const filteredWorkers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return workers
    return workers.filter((worker) =>
      [worker.name, worker.role, worker.source]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
  }, [workers, searchTerm])

  const markedCount = useMemo(
    () => workers.filter((worker) => worker.status).length,
    [workers]
  )
  const presentCount = useMemo(
    () => workers.filter((worker) => worker.status === "PRESENT").length,
    [workers]
  )
  const absentCount = useMemo(
    () => workers.filter((worker) => worker.status === "ABSENT").length,
    [workers]
  )

  const handleSave = async () => {
    if (!selectedProject) return

    const records = workers
      .filter((worker) => worker.status)
      .map((worker) => ({
        labourId: worker.labourId,
        status: worker.status,
        ...(worker.description?.trim()
          ? { description: worker.description.trim() }
          : {}),
      }))

    if (records.length === 0) {
      toast.error("Mark attendance for at least one worker")
      return
    }

    setSaving(true)
    try {
      await Request.post(`/v1/api/attendance/project/${selectedProject.id}`, {
        date: markDate.format(DATE_FORMAT),
        records,
      })
      toast.success("Attendance saved")
      getWorkers(selectedProject.id, markDate)
      getHistory(selectedProject.id, historyRange)
    } catch (error: any) {
      console.log(error)
      toast.error(
        error?.response?.data?.message ?? "Failed to save attendance"
      )
    } finally {
      setSaving(false)
    }
  }

  if (!canMark && !canView) {
    return (
      <ParentLayout title="Attendance">
        <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
          <Empty description="You don't have permission to access attendance" />
        </div>
      </ParentLayout>
    )
  }

  const markTab = (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <DatePicker
              value={markDate}
              onChange={handleMarkDateChange}
              allowClear={false}
              format="DD MMM YYYY"
              disabledDate={(current) => current && current.isAfter(dayjs(), "day")}
              size="large"
            />
            <Input
              placeholder="Search workers..."
              prefix={<FiSearch className="text-gray-400" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
              allowClear
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => markAll("PRESENT")} disabled={workers.length === 0}>
              Mark all present
            </Button>
            <Button onClick={() => markAll("ABSENT")} disabled={workers.length === 0}>
              Mark all absent
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={handleSave}
              disabled={markedCount === 0}
            >
              Save attendance ({markedCount})
            </Button>
          </div>
        </div>

        {workers.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 font-medium text-gray-700">
              <FiUsers size={14} />
              {workers.length} workers
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
              <FiCheckCircle size={14} />
              {presentCount} present
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
              <FiXCircle size={14} />
              {absentCount} absent
            </span>
          </div>
        )}
      </div>

      {workersLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <Skeleton active paragraph={{ rows: 1 }} />
            </div>
          ))}
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchTerm
                ? "No workers match your search"
                : "No workers found for this project"
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-100">
            {filteredWorkers.map((worker) => (
              <div
                key={worker.labourId}
                className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-600">
                    {worker.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{worker.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      {worker.role && <span>{worker.role}</span>}
                      {worker.source && (
                        <Tag className="m-0" color="geekblue">
                          {worker.source}
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    placeholder="Note (optional)"
                    value={worker.description}
                    onChange={(e) =>
                      updateWorker(worker.labourId, { description: e.target.value })
                    }
                    className="w-full sm:w-56"
                    allowClear
                  />
                  <Segmented
                    value={worker.status ?? ""}
                    onChange={(value) =>
                      updateWorker(worker.labourId, {
                        status: value as AttendanceStatus,
                      })
                    }
                    options={[
                      {
                        label: (
                          <span className={worker.status === "PRESENT" ? "font-semibold text-green-600" : ""}>
                            Present
                          </span>
                        ),
                        value: "PRESENT",
                      },
                      {
                        label: (
                          <span className={worker.status === "ABSENT" ? "font-semibold text-red-600" : ""}>
                            Absent
                          </span>
                        ),
                        value: "ABSENT",
                      },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const historyTab = (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Attendance records grouped by date
          </p>
          <RangePicker
            value={historyRange}
            onChange={handleHistoryRangeChange}
            allowClear={false}
            format="DD MMM YYYY"
            disabledDate={(current) => current && current.isAfter(dayjs(), "day")}
            size="large"
          />
        </div>
      </div>

      {historyLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      ) : historyDays.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No attendance records found for the selected dates"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {historyDays.map((day) => (
            <section
              key={day.date}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-gray-500" size={16} />
                  <h3 className="text-base font-semibold text-gray-900">
                    {dayjs(day.date).format("dddd, DD MMM YYYY")}
                  </h3>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 font-medium text-green-700">
                    <FiCheckCircle size={14} />
                    {day.presentCount} present
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                    <FiXCircle size={14} />
                    {day.absentCount} absent
                  </span>
                </div>
              </div>

              {day.records.length > 0 && (
                <div className="divide-y divide-gray-100">
                  {day.records.map((record, index) => (
                    <div
                      key={record.labourId ?? index}
                      className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{record.name}</p>
                        {record.description && (
                          <p className="text-sm text-gray-500">{record.description}</p>
                        )}
                      </div>
                      <Tag
                        color={record.status === "PRESENT" ? "green" : "red"}
                        className="m-0"
                      >
                        {record.status}
                      </Tag>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )

  const tabItems = [
    ...(canMark ? [{ key: "mark", label: "Mark Attendance", children: markTab }] : []),
    ...(canView ? [{ key: "history", label: "History", children: historyTab }] : []),
  ]

  return (
    <ParentLayout title="Attendance">
      <div className="flex flex-col gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <FiUserCheck className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Attendance</h1>
                <p className="text-sm text-gray-500">
                  Mark and review worker attendance by project
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
                  <p className="text-gray-500">Select a project to manage attendance</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Workers include team members and task-assigned labours
                  </p>
                </div>
              }
            />
          </div>
        ) : (
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        )}
      </div>
    </ParentLayout>
  )
}

export { Attendance }
