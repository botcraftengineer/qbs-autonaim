"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useTRPC } from "~/trpc/react";

interface ActivityTimelineProps {
  candidateId: string;
  workspaceId: string;
}

const ACTIVITY_ICONS = {
  STATUS_CHANGE: CheckCircle,
  COMMENT: MessageSquare,
  DOCUMENT: FileText,
  INTERVIEW: Calendar,
  APPLIED: ArrowRight,
} as const;

const ACTIVITY_COLORS = {
  STATUS_CHANGE: "text-emerald-600 bg-emerald-100 border-emerald-200",
  COMMENT: "text-blue-600 bg-blue-100 border-blue-200",
  DOCUMENT: "text-purple-600 bg-purple-100 border-purple-200",
  INTERVIEW: "text-orange-600 bg-orange-100 border-orange-200",
  APPLIED: "text-primary bg-primary/10 border-primary/20",
} as const;

export function ActivityTimeline({
  candidateId,
  workspaceId,
}: ActivityTimelineProps) {
  const trpc = useTRPC();
  const { data: activities = [], isLoading } = useQuery({
    ...trpc.candidates.listActivities.queryOptions({
      candidateId,
      workspaceId,
    }),
  });

  const getIcon = (type: string) =>
    ACTIVITY_ICONS[type as keyof typeof ACTIVITY_ICONS] ?? CheckCircle;
  const getColor = (type: string) =>
    ACTIVITY_COLORS[type as keyof typeof ACTIVITY_COLORS] ??
    "text-primary bg-primary/10 border-primary/20";

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p className="text-sm">Нет активности</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      {activities?.map((activity) => {
        const Icon = getIcon(activity.type);
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border"
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border ${getColor(activity.type)}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{activity.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(activity.createdAt).toLocaleString("ru")}
                </p>
                {activity.author && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">
                      {activity.author}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
