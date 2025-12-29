import type { FreelancePlatformConfig, FreelanceSource } from "./types";

/**
 * Конфигурации для различных фриланс-платформ
 */
export const FREELANCE_CONFIGS: Record<
  FreelanceSource,
  FreelancePlatformConfig
> = {
  kwork: {
    name: "Kwork",
    baseUrl: "https://kwork.ru",
    vacanciesUrl: "https://kwork.ru/projects",
  },
  fl: {
    name: "FL.ru",
    baseUrl: "https://www.fl.ru",
    vacanciesUrl: "https://www.fl.ru/projects/",
  },
  weblancer: {
    name: "Weblancer",
    baseUrl: "https://www.weblancer.net",
    vacanciesUrl: "https://www.weblancer.net/jobs/",
  },
  upwork: {
    name: "Upwork",
    baseUrl: "https://www.upwork.com",
    vacanciesUrl: "https://www.upwork.com/nx/find-work/",
  },
};
