"use client";

import { useDraggable } from "@dnd-kit/core";
import { Avatar, AvatarFallback } from "@qbs-autonaim/ui";
import { MessageSquare, Paperclip } from "lucide-react";
import type { KanbanTask } from "./types";

interface KanbanCardProps {
  task: KanbanTask;
  isDragging?: boolean;
}

export function KanbanCard({ task, isDragging }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const priorityColors = {
    High: "text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400",
    Medium: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400",
    Low: "text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-card border rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? "shadow-lg opacity-50" : ""
      }`}
    >
      <h4 className="text-sm font-semibold mb-2 line-clamp-2">{task.title}</h4>
      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
        {task.description}
      </p>

      <div className="flex items-center gap-2 mb-3">
        {task.assignees
          .slice(0, 2)
          .map((assignee: { id: string; initials: string }) => (
            <Avatar
              key={assignee.id}
              className="w-6 h-6 border-2 border-background"
            >
              <AvatarFallback className="text-[10px] font-medium">
                {assignee.initials}
              </AvatarFallback>
            </Avatar>
          ))}
        {task.assignees.length > 2 && (
          <span className="text-xs text-muted-foreground">
            +{task.assignees.length - 2}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded ${priorityColors[task.priority as keyof typeof priorityColors]}`}
        >
          {task.priority}
        </span>

        <div className="flex items-center gap-3 text-muted-foreground">
          {task.attachments > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              <span className="text-xs tabular-nums">{task.attachments}</span>
            </div>
          )}
          {task.comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-xs tabular-nums">{task.comments}</span>
            </div>
          )}
        </div>
      </div>

      {task.progress > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium tabular-nums">
              {task.progress}%
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                task.progress === 100
                  ? "bg-emerald-500"
                  : task.progress >= 50
                    ? "bg-blue-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
