"use client";

import { Button } from "@selectio/ui";
import { useRealtimeTaskTrigger } from "@trigger.dev/react-hooks";

import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ScreeningResultModal } from "./screening-result-modal";

interface ScreenResponseButtonProps {
  responseId: string;
  accessToken: string | undefined;
  candidateName?: string;
}

export function ScreenResponseButton({
  responseId,
  accessToken,
  candidateName,
}: ScreenResponseButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const { submit, run, isLoading } = useRealtimeTaskTrigger("screen-response", {
    accessToken,
  });

  useEffect(() => {
    console.log("Run status changed:", run?.status);
    if (run?.status === "COMPLETED" && run.output) {
      console.log("Opening modal with result:", run.output);
      setShowModal(true);
    }
  }, [run?.status, run?.output]);

  const handleClick = () => {
    submit({ responseId });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={!accessToken || isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-1" />
        )}
        {isLoading ? "Оценка..." : "Оценить"}
      </Button>

      <ScreeningResultModal
        open={showModal}
        onOpenChange={setShowModal}
        result={run?.output?.result || null}
        candidateName={candidateName}
      />
    </>
  );
}
