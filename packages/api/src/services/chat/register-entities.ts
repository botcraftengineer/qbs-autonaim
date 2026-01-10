/**
 * Регистрация всех типов сущностей для AI чата
 * Вызывается при инициализации API
 */

import { gigPromptConfig } from "./configs/gig-config";
import { vacancyPromptConfig } from "./configs/vacancy-config";
import { GigContextLoader } from "./loaders/gig-loader";
import { VacancyContextLoader } from "./loaders/vacancy-loader";
import { chatRegistry } from "./registry";

/**
 * Регистрация всех поддерживаемых типов сущностей
 */
export function registerChatEntities(): void {
  // Регистрация gig
  chatRegistry.register({
    entityType: "gig",
    loader: new GigContextLoader(),
    promptConfig: gigPromptConfig,
    rateLimitConfig: {
      maxRequests: 20,
      windowMs: 60000, // 1 минута
    },
  });

  // Регистрация vacancy
  chatRegistry.register({
    entityType: "vacancy",
    loader: new VacancyContextLoader(),
    promptConfig: vacancyPromptConfig,
    rateLimitConfig: {
      maxRequests: 20,
      windowMs: 60000, // 1 минута
    },
  });
}
