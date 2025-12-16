import { KanbanBoard } from "@/components/kanban";

export default function KanbanPage() {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Project Board</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your tasks and track progress
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
}
