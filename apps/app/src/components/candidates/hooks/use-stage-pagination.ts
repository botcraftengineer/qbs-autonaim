import { useCallback, useState } from "react";
import type { FunnelStage } from "../types";

const STAGES: FunnelStage[] = [
  "SCREENING_DONE",
  "INTERVIEW",
  "OFFER_SENT",
  "SECURITY_PASSED",
  "CONTRACT_SENT",
  "ONBOARDING",
  "REJECTED",
];

export function useStagePagination(initialLimit = 5) {
  const [stageLimits, setStageLimits] = useState<Record<FunnelStage, number>>(
    () => {
      const initial: Record<FunnelStage, number> = {} as Record<
        FunnelStage,
        number
      >;
      STAGES.forEach((stage) => {
        initial[stage] = initialLimit;
      });
      return initial;
    },
  );

  const loadMoreForStage = useCallback((stage: FunnelStage) => {
    setStageLimits((prev) => ({
      ...prev,
      [stage]: prev[stage] + 5,
    }));
  }, []);

  return { stageLimits, loadMoreForStage };
}
