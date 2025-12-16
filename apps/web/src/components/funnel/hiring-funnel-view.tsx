"use client";

import { Button } from "@qbs-autonaim/ui";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useState } from "react";
import { FunnelAnalytics } from "./funnel-analytics";
import { FunnelBoard } from "./funnel-board";

export function HiringFunnelView() {
  const [currentView, setCurrentView] = useState<"board" | "analytics">(
    "board",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Воронка найма
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentView === "board"
              ? "Управление процессом найма"
              : "Аналитика и метрики"}
          </p>
        </div>

        <nav className="flex items-center gap-2">
          {currentView === "board" ? (
            <Button
              onClick={() => setCurrentView("analytics")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Аналитика
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentView("board")}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />К доске кандидатов
            </Button>
          )}
        </nav>
      </div>

      {currentView === "board" ? <FunnelBoard /> : <FunnelAnalytics />}
    </div>
  );
}
