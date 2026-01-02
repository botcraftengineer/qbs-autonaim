"use client";

import { useState } from "react";
import { GettingStartedBadge } from "./getting-started-badge";
import { GettingStartedWidget } from "./getting-started-widget";

export function GettingStartedContainer() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  return (
    <>
      {!isWidgetOpen && (
        <div className="fixed bottom-0 right-0 z-40 m-5">
          <GettingStartedBadge onClick={() => setIsWidgetOpen(true)} />
        </div>
      )}
      {isWidgetOpen && <GettingStartedWidget />}
    </>
  );
}
