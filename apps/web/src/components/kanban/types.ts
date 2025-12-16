export interface KanbanColumn {
  id: string;
  title: string;
  count: number;
}

export interface KanbanAssignee {
  id: string;
  name: string;
  avatar: string | null;
  initials: string;
}

export interface KanbanTask {
  id: string;
  columnId: string;
  title: string;
  description: string;
  assignees: KanbanAssignee[];
  progress: number;
  priority: "High" | "Medium" | "Low";
  attachments: number;
  comments: number;
}
