export interface ProjectTask {
  key: string
  task: string
  assignedTo: string
  status: string
  dueDate: string
  priority: string
  updates?: string[]
}

export interface Project {
  id: string
  name: string
  description: string
  manager: string
  managerId?: string
  managerAvatar: string
  teamId?: string
  teamName?: string
  status: "active" | "pending" | "completed"
  isSynced: boolean
  hasUnapproved: boolean
  unapprovedCount?: number
  borderColor: "blue" | "orange" | "purple"
  tasks: ProjectTask[]
  startDate: string
  endDate: string
  budget: string
  location: string
  totalTasks: number
  completedTasks: number
  teamMembers: number
  progress: number
}

