"use client";

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState } from "react";
import { KanbanCard } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";
import type { KanbanColumn as KanbanColumnType, KanbanTask } from "./types";

const INITIAL_COLUMNS: KanbanColumnType[] = [
  { id: "backlog", title: "Backlog", count: 4 },
  { id: "in-progress", title: "In Progress", count: 3 },
  { id: "done", title: "Done", count: 2 },
];

const INITIAL_TASKS: KanbanTask[] = [
  {
    id: "1",
    columnId: "backlog",
    title: "Integrate Stripe payment gateway",
    description:
      "Compile competitor landing page designs for inspiration. G...",
    assignees: [
      { id: "1", name: "User 1", avatar: null, initials: "U1" },
      { id: "2", name: "User 2", avatar: null, initials: "U2" },
    ],
    progress: 10,
    priority: "High",
    attachments: 2,
    comments: 4,
  },
  {
    id: "2",
    columnId: "backlog",
    title: "Redesign marketing homepage",
    description:
      "Compile competitor landing page designs for inspiration. G...",
    assignees: [
      { id: "3", name: "User 3", avatar: null, initials: "U3" },
      { id: "4", name: "User 4", avatar: null, initials: "U4" },
    ],
    progress: 0,
    priority: "Medium",
    attachments: 1,
    comments: 1,
  },
  {
    id: "3",
    columnId: "backlog",
    title: "Set up automated backups",
    description:
      "Compile competitor landing page designs for inspiration. G...",
    assignees: [
      { id: "5", name: "User 5", avatar: null, initials: "U5" },
      { id: "6", name: "User 6", avatar: null, initials: "U6" },
    ],
    progress: 5,
    priority: "Low",
    attachments: 0,
    comments: 3,
  },
  {
    id: "4",
    columnId: "backlog",
    title: "Implement blog search functionality",
    description:
      "Compile competitor landing page designs for inspiration. G...",
    assignees: [
      { id: "7", name: "User 7", avatar: null, initials: "U7" },
      { id: "8", name: "User 8", avatar: null, initials: "U8" },
    ],
    progress: 0,
    priority: "Medium",
    attachments: 1,
    comments: 0,
  },
  {
    id: "5",
    columnId: "in-progress",
    title: "Dark mode toggle implementation",
    description:
      "Compile competitor landing page designs for inspiration. G...",
    assignees: [
      { id: "9", name: "User 9", avatar: null, initials: "NT" },
      { id: "10", name: "User 10", avatar: null, initials: "EL" },
    ],
    progress: 40,
    priority: "High",
    attachments: 2,
    comments: 6,
  },
  {
    id: "6",
    columnId: "in-progress",
    title: "Database schema refactoring",
    description:
      "Compile competitor landing page designs for inspiration. G...",
    assignees: [
      { id: "11", name: "User 11", avatar: null, initials: "U1" },
      { id: "12", name: "User 12", avatar: null, initials: "U2" },
    ],
    progress: 55,
    priority: "Medium",
    attachments: 3,
    comments: 2,
  },
  {
    id: "7",
    columnId: "in-progress",
    title: "Accessibility improvements",
    description:
      "Compile competitor landing page designs for inspiration. G...",
    assignees: [
      { id: "13", name: "NT", avatar: null, initials: "NT" },
      { id: "14", name: "EL", avatar: null, initials: "EL" },
    ],
    progress: 35,
    priority: "Low",
    attachments: 1,
    comments: 1,
  },
  {
    id: "8",
    columnId: "done",
    title: "Set up CI/CD pipeline",
    description:
      "Compile competitor landing page designs for inspiration. G...",
    assignees: [
      { id: "15", name: "EC", avatar: null, initials: "EC" },
      { id: "16", name: "GR", avatar: null, initials: "GR" },
    ],
    progress: 100,
    priority: "High",
    attachments: 2,
    comments: 4,
  },
  {
    id: "9",
    columnId: "done",
    title: "Initial project setup",
    description:
      "Compile competitor landing page designs for inspiration. G...",
    assignees: [
      { id: "17", name: "HL", avatar: null, initials: "HL" },
      { id: "18", name: "BM", avatar: null, initials: "BM" },
    ],
    progress: 100,
    priority: "Medium",
    attachments: 1,
    comments: 2,
  },
];

export function KanbanBoard() {
  const [columns] = useState<KanbanColumnType[]>(INITIAL_COLUMNS);
  const [tasks, setTasks] = useState<KanbanTask[]>(INITIAL_TASKS);
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overColumnId = over.id as string;

    if (activeTask.columnId !== overColumnId) {
      setTasks((tasks) =>
        tasks.map((task) =>
          task.id === active.id ? { ...task, columnId: overColumnId } : task,
        ),
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6 border-b pb-4">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-foreground border-b-2 border-foreground"
        >
          Board
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          List
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Table
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasks.filter((task) => task.columnId === column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
