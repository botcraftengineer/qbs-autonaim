"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, MoreHorizontal, Plus } from "lucide-react";
import { KanbanCard } from "./kanban-card";
import type { KanbanColumn as KanbanColumnType, KanbanTask } from "./types";

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: KanbanTask[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col w-[320px] shrink-0">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Drag column"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold">{column.title}</h3>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md tabular-nums">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Column options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="flex flex-col gap-3 min-h-[200px] p-3 bg-muted/30 rounded-lg"
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}

          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
        </div>
      </SortableContext>
    </div>
  );
}
