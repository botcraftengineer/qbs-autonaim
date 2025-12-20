import { useEffect, useState } from "react";
import type { FunnelStage } from "../types";

export function useCandidateFilters() {
  const [selectedVacancy, setSelectedVacancy] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStages, setFilterStages] = useState<FunnelStage[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const toggleStageFilter = (stageId: FunnelStage) => {
    setFilterStages((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId],
    );
  };

  const clearStageFilters = () => setFilterStages([]);

  return {
    selectedVacancy,
    setSelectedVacancy,
    searchText,
    setSearchText,
    debouncedSearch,
    filterStages,
    toggleStageFilter,
    clearStageFilters,
  };
}
