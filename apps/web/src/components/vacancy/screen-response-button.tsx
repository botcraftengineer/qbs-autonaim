"use client";

import { Button } from "@selectio/ui";
import { useRealtimeTaskTrigger } from "@trigger.dev/react-hooks";
import { useQueryClient } from "@tanstack/react-query";

import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ScreeningResultModal } from "./screening-result-modal";
import { useTRPC } from "~/trpc/react";

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
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { submit, run } = useRealtimeTaskTrigger("screen-response", {
    accessToken,
  });

  const isRunning = run?.status === "DEQUEUED" || run?.status === "EXECUTING";

  useEffect(() => {
    if (run?.status === "COMPLETED" && run.output) {
      console.log("Opening modal with result:", run.output);
      setShowModal(true);
      void queryClient.invalidateQueries(
        trpc.vacancy.responses.list.pathFilter()
      );
    }
  }, [run?.status, run?.output, queryClient, trpc.vacancy.responses.list]);

  const handleClick = () => {
    submit({ responseId });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={!accessToken || isRunning}
      >
        {isRunning ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-1" />
        )}
        {isRunning ? "Оценка..." : "Оценить"}
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
