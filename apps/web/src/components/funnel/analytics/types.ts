export interface FunnelStageData {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface AnalyticsData {
  totalCandidates: number;
  hired: number;
  newThisWeek: number;
  byStage: Record<string, number>;
}

export interface VacancyStat {
  vacancyId: string;
  vacancyName: string;
  total: number;
  inProcess: number;
  hired: number;
}
