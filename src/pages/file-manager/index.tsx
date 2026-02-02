/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect, useState, useRef } from "react"
import { Select, Skeleton, Empty, Modal, Progress } from "antd"
import { toast } from "react-hot-toast"
import { ParentLayout } from "../../layout/ParentLayout"
import { Request } from "../../utils/Request"
import { AuthContext } from "../../context/AuthContext"
import moment from "moment"
import {
  FiUploadCloud,
  FiSearch,
  FiMoreVertical,
  FiTrash2,
  FiChevronDown,
  FiFile,
  FiImage,
  FiFileText,
  FiFilm,
  FiMusic,
  FiDownload,
  FiX,
  FiFolder,
  FiCheckCircle,
  FiAlertCircle,
  FiGrid,
  FiList,
  FiEye,
} from "react-icons/fi"
import { HiOutlineFolderOpen } from "react-icons/hi"
import { BsFiletypePdf, BsFiletypeXls, BsFiletypeDoc, BsFileZip } from "react-icons/bs"

interface ProjectFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  createdAt: string
  uploadedBy?: { id: string; name: string }
}

interface Project {
  id: string
  name: string
  description?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  message?: string
}

const FileManager = () => {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(false)
  const { permissions = [] } = useContext(AuthContext) as any
  const [projects, setProjects] = useState<Project[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Upload
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // View
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  // Actions
  const [actionMenuFile, setActionMenuFile] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null)
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<ProjectFile | null>(null)

  const getProjects = async () => {
    setProjectsLoading(true)
    try {
      const response = await Request.get("/v1/api/projects/all")
      setProjects(response.data || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load projects")
    } finally {
      setProjectsLoading(false)
    }
  }

  const getFilesByProject = async (projectId: string) => {
    if (!projectId) return
    setLoading(true)
    try {
      const response = await Request.get(`/v1/api/files/project/${projectId}`)
      setFiles(response.data || [])
    } catch (error) {
      console.log(error)
      toast.error("Failed to load files")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setSelectedProject(project)
      await getFilesByProject(projectId)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFilesSelected(droppedFiles)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFilesSelected(selectedFiles)
  }

  const handleFilesSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length > 10) {
      toast.error("Maximum 10 files allowed at a time")
      selectedFiles = selectedFiles.slice(0, 10)
    }

    const newUploadingFiles: UploadingFile[] = selectedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending",
    }))

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles])
    setUploadModalOpen(true)
  }

  const uploadFiles = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first")
      return
    }

    const pendingFiles = uploadingFiles.filter((f) => f.status === "pending" || f.status === "error")
    if (pendingFiles.length === 0) return

    const formData = new FormData()
    formData.append("projectId", selectedProject.id)
    pendingFiles.forEach((uf) => {
      formData.append("files", uf.file)
    })

    // Mark all as uploading
    setUploadingFiles((prev) =>
      prev.map((f) => (f.status === "pending" || f.status === "error" ? { ...f, status: "uploading", progress: 0 } : f))
    )

    try {
      await Request.post("/v1/api/files/upload", formData, {
        onUploadProgress: (progressEvent: any) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setUploadingFiles((prev) =>
            prev.map((f) => (f.status === "uploading" ? { ...f, progress } : f))
          )
        },
      })

      // Mark all as success
      setUploadingFiles((prev) =>
        prev.map((f) => (f.status === "uploading" ? { ...f, status: "success", progress: 100 } : f))
      )

      toast.success("Files uploaded successfully!")
      await getFilesByProject(selectedProject.id)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Upload failed"
      setUploadingFiles((prev) =>
        prev.map((f) => (f.status === "uploading" ? { ...f, status: "error", message: errorMessage } : f))
      )
      toast.error("Failed to upload files")
    }
  }

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearUploadedFiles = () => {
    setUploadingFiles([])
    setUploadModalOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDeleteFile = async (file: ProjectFile) => {
    try {
      await Request.delete(`/v1/api/files/${file.id}`)
      setFiles((prev) => prev.filter((f) => f.id !== file.id))
      toast.success("File deleted successfully")
      setDeleteConfirmFile(null)
      setActionMenuFile(null)
    } catch (error) {
      console.log(error)
      toast.error("Failed to delete file")
    }
  }

  const handleDownloadFile = async (file: ProjectFile) => {
    try {
      const response:any = await Request.get(`/v1/api/files/download/${file.id}`)
      if (response.data.downloadUrl) {
        window.open(response.data.downloadUrl, "_blank")
      } else {
        toast.error("Failed to get download URL")
      }
    } catch (error) {
      console.log(error)
      toast.error("Failed to download file")
    }
    setActionMenuFile(null)
  }

  useEffect(() => {
    getProjects()
  }, [])

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      !searchTerm || file.name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = !typeFilter || getFileCategory(file.type) === typeFilter

    return matchesSearch && matchesType
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (date?: string) => (date ? moment(date).format("MMM DD, YYYY") : "—")

  const getFileCategory = (mimeType: string): string => {
    if (!mimeType) return "other"
    if (mimeType.startsWith("image/")) return "image"
    if (mimeType.startsWith("video/")) return "video"
    if (mimeType.startsWith("audio/")) return "audio"
    if (mimeType.includes("pdf")) return "pdf"
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return "spreadsheet"
    if (mimeType.includes("document") || mimeType.includes("word") || mimeType.includes("text")) return "document"
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("archive")) return "archive"
    return "other"
  }

  const getFileIcon = (mimeType: string, size: number = 24) => {
    const category = getFileCategory(mimeType)
    const iconClass = "text-gray-500"
    
    switch (category) {
      case "image":
        return <FiImage size={size} className="text-emerald-500" />
      case "video":
        return <FiFilm size={size} className="text-purple-500" />
      case "audio":
        return <FiMusic size={size} className="text-pink-500" />
      case "pdf":
        return <BsFiletypePdf size={size} className="text-red-500" />
      case "spreadsheet":
        return <BsFiletypeXls size={size} className="text-green-600" />
      case "document":
        return <BsFiletypeDoc size={size} className="text-blue-500" />
      case "archive":
        return <BsFileZip size={size} className="text-amber-500" />
      default:
        return <FiFile size={size} className={iconClass} />
    }
  }

  const getFileIconBg = (mimeType: string): string => {
    const category = getFileCategory(mimeType)
    switch (category) {
      case "image": return "bg-emerald-50"
      case "video": return "bg-purple-50"
      case "audio": return "bg-pink-50"
      case "pdf": return "bg-red-50"
      case "spreadsheet": return "bg-green-50"
      case "document": return "bg-blue-50"
      case "archive": return "bg-amber-50"
      default: return "bg-gray-100"
    }
  }

  const isImageFile = (mimeType: string) => mimeType?.startsWith("image/")

  const TYPE_FILTER_OPTIONS = [
    { label: "All Files", value: "" },
    { label: "Images", value: "image" },
    { label: "Videos", value: "video" },
    { label: "PDFs", value: "pdf" },
    { label: "Documents", value: "document" },
    { label: "Spreadsheets", value: "spreadsheet" },
    { label: "Archives", value: "archive" },
  ]

  // Stats
  const totalFiles = files.length
  const totalSize = files.reduce((sum:any, f:any) => sum + (f.fileSize || 0), 0)
  const imageCount = files.filter((f:any) => getFileCategory(f.mimeType) === "image").length
  const docCount = files.filter((f:any) => ["pdf", "document", "spreadsheet"].includes(getFileCategory(f.mimeType))).length

  const canUploadFiles = permissions.find((p: any) => p.name === "create_files") || permissions.find((p: any) => p.name === "view_projects")
  const canDeleteFiles = permissions.find((p: any) => p.name === "delete_files") || permissions.find((p: any) => p.name === "delete_tasks")

  const pendingUploads = uploadingFiles.filter((f:any) => f.status === "pending" || f.status === "error").length

  return (
    <ParentLayout title="File Manager">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                <HiOutlineFolderOpen className="text-sky-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">File Manager</h1>
                <p className="text-sm text-gray-500">Select a project to view and manage files</p>
              </div>
            </div>

            {/* Project Selector */}
            <div className="flex items-center gap-3">
              <Select
                placeholder="Select a project..."
                value={selectedProject?.id}
                onChange={handleSelectProject}
                loading={projectsLoading}
                className="w-64"
                size="large"
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
                suffixIcon={<FiChevronDown className="text-gray-400" />}
              />
              {selectedProject && canUploadFiles && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  <FiUploadCloud size={18} />
                  Upload Files
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                accept="*/*"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        {!selectedProject ? (
          <div className="rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div className="text-center">
                  <p className="text-gray-500">Select a project to view files</p>
                  <p className="text-sm text-gray-400 mt-1">Choose a project from the dropdown above</p>
                </div>
              }
            />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <FiFile className="text-gray-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{totalFiles}</p>
                    <p className="text-xs text-gray-500">Total Files</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
                    <FiFolder className="text-sky-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-sky-600">{formatFileSize(totalSize)}</p>
                    <p className="text-xs text-gray-500">Total Size</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                    <FiImage className="text-emerald-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{imageCount}</p>
                    <p className="text-xs text-gray-500">Images</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <FiFileText className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{docCount}</p>
                    <p className="text-xs text-gray-500">Documents</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            {canUploadFiles && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-white p-8 transition-all duration-200 ${
                  isDragging
                    ? "border-sky-400 bg-sky-50"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                    isDragging ? "bg-sky-100" : "bg-gray-100"
                  }`}
                >
                  <FiUploadCloud
                    className={`transition-colors ${isDragging ? "text-sky-500" : "text-gray-400"}`}
                    size={28}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {isDragging ? "Drop your files here" : "Drag and drop files here, or click to browse"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Maximum 10 files at a time</p>
                </div>
              </div>
            )}

            {/* Filters & View Toggle */}
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-200 pl-10 pr-4 text-sm outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  placeholder="File Type"
                  className="w-40"
                  options={TYPE_FILTER_OPTIONS}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === "grid" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <FiGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === "list" ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <FiList size={18} />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* File List */}
            {loading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton active paragraph={{ rows: 5 }} />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white py-16 shadow-sm">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={searchTerm || typeFilter ? "No files match your filters" : "No files uploaded yet"}
                >
                  {canUploadFiles && !searchTerm && !typeFilter && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      <FiUploadCloud size={16} />
                      Upload first file
                    </button>
                  )}
                </Empty>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredFiles.map((file:any) => (
                  <div
                    key={file.id}
                    className="group relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-gray-300"
                  >
                    {/* File Preview */}
                    <div
                      className={`relative mb-3 flex h-24 items-center justify-center rounded-lg ${getFileIconBg(file.mimeType)}`}
                    >
                      {isImageFile(file.mimeType) ? (
                        <img
                          src={file.url}
                          alt={file.fileName}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        getFileIcon(file.mimeType, 32)
                      )}
                    </div>

                    {/* File Info */}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                    </div>

                    {/* Actions Menu */}
                    <div className="absolute right-2 top-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActionMenuFile(actionMenuFile === file.id ? null : file.id)
                        }}
                        className="rounded-lg bg-white/80 p-1.5 text-gray-400 opacity-0 shadow-sm transition-all hover:bg-white hover:text-gray-600 group-hover:opacity-100"
                      >
                        <FiMoreVertical size={16} />
                      </button>
                      {actionMenuFile === file.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActionMenuFile(null)} />
                          <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <FiDownload size={14} />
                              Download
                            </button>
                            {isImageFile(file.type) && (
                              <button
                                onClick={() => {
                                  setPreviewFile(file)
                                  setActionMenuFile(null)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <FiEye size={14} />
                                Preview
                              </button>
                            )}
                            {canDeleteFiles && (
                              <>
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                  onClick={() => {
                                    setDeleteConfirmFile(file)
                                    setActionMenuFile(null)
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <FiTrash2 size={14} />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Uploaded</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredFiles.map((file:any) => (
                      <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getFileIconBg(file.type)}`}>
                              {getFileIcon(file.mimeType, 20)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900 max-w-xs" title={file.fileName}>
                                {file.fileName}
                              </p>
                              {file.uploadedBy && (
                                <p className="text-xs text-gray-500">by {file.uploadedBy.name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                          {formatFileSize(file.fileSize)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 capitalize">
                            {getFileCategory(file.mimeType)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {formatDate(file.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              title="Download"
                            >
                              <FiDownload size={16} />
                            </button>
                            {isImageFile(file.type) && (
                              <button
                                onClick={() => setPreviewFile(file)}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                                title="Preview"
                              >
                                <FiEye size={16} />
                              </button>
                            )}
                            {canDeleteFiles && (
                              <button
                                onClick={() => setDeleteConfirmFile(file)}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Delete"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Progress Modal */}
      <Modal
        title="Upload Files"
        open={uploadModalOpen}
        onCancel={clearUploadedFiles}
        footer={null}
        width={500}
      >
        <div className="mt-4 space-y-4">
          {uploadingFiles.length === 0 ? (
            <Empty description="No files selected" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <>
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {uploadingFiles.map((uf, index) => (
                  <div
                    key={`${uf.file.name}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getFileIconBg(uf.file.type)}`}>
                      {uf.status === "success" ? (
                        <FiCheckCircle className="text-emerald-500" size={20} />
                      ) : uf.status === "error" ? (
                        <FiAlertCircle className="text-red-500" size={20} />
                      ) : uf.status === "uploading" ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                      ) : (
                        getFileIcon(uf.file.type, 20)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{uf.file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(uf.file.size)}</p>
                      {uf.status === "uploading" && (
                        <Progress percent={uf.progress} size="small" showInfo={false} className="mt-1" />
                      )}
                      {uf.status === "error" && uf.message && (
                        <p className="text-xs text-red-500 mt-1">{uf.message}</p>
                      )}
                    </div>
                    {(uf.status === "pending" || uf.status === "error") && (
                      <button
                        onClick={() => removeUploadingFile(index)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                      >
                        <FiX size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">
                  {uploadingFiles.filter((f) => f.status === "success").length} of {uploadingFiles.length} uploaded
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={clearUploadedFiles}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    {pendingUploads === 0 ? "Close" : "Cancel"}
                  </button>
                  {pendingUploads > 0 && (
                    <button
                      onClick={uploadFiles}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                    >
                      <FiUploadCloud size={16} />
                      Upload {pendingUploads} file{pendingUploads !== 1 ? "s" : ""}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={!!previewFile}
        onCancel={() => setPreviewFile(null)}
        footer={null}
        width={800}
        centered
        title={previewFile?.name}
      >
        {previewFile && (
          <div className="flex flex-col items-center">
            <img
              src={previewFile.url}
              alt={previewFile.name}
              className="max-h-[70vh] rounded-lg object-contain"
            />
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm text-gray-500">{formatFileSize(previewFile.size)}</span>
              <span className="text-sm text-gray-500">{formatDate(previewFile.createdAt)}</span>
              <button
                onClick={() => handleDownloadFile(previewFile)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                <FiDownload size={16} />
                Download
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete File"
        open={!!deleteConfirmFile}
        onCancel={() => setDeleteConfirmFile(null)}
        footer={null}
        width={400}
      >
        <div className="mt-4">
          <p className="text-gray-600">
            Are you sure you want to delete <span className="font-medium text-gray-900">{deleteConfirmFile?.name}</span>?
          </p>
          <p className="mt-2 text-sm text-gray-500">This action cannot be undone.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirmFile(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirmFile && handleDeleteFile(deleteConfirmFile)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              <FiTrash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </ParentLayout>
  )
}

export { FileManager }

