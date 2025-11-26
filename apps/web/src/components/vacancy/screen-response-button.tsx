"use client";

import { Button } from "@selectio/ui";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { triggerScreenResponse } from "~/actions/trigger";

interface ScreenResponseButtonProps {
  responseId: string;
  accessToken: string | undefined;
}

export function ScreenResponseButton({
  responseId,
  accessToken,
}: ScreenResponseButtonProps) {
  const [runId, setRunId] = useState<string | undefined>();
  const [isTriggering, setIsTriggering] = useState(false);

  const { run } = useRealtimeRun(runId, {
    accessToken,
    enabled: !!accessToken && !!runId,
  });

  const handleClick = async () => {
    setIsTriggering(true);
    const result = await triggerScreenResponse(responseId);
    setIsTriggering(false);

    if (result.success) {
      setRunId(result.runId);
    }
  };

  const isRunning = isTriggering || run?.status === "EXECUTING";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={!accessToken || isRunning}
    >
      <Sparkles className="h-4 w-4 mr-1" />
      {isRunning ? "Оценка..." : "Оценить"}
    </Button>
  );
}
