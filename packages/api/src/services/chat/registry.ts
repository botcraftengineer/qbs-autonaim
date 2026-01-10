/**
 * Реестр типов сущностей для AI чата
 * Централизованное управление конфигурациями для разных типов
 */

import type { ChatEntityType } from "@qbs-autonaim/db/schema";
import { chatRateLimiter } from "./rate-limiter";
import type {
  ChatEntityRegistration,
  ContextLoader,
  PromptConfig,
} from "./types";

class ChatRegistry {
  private registrations: Map<ChatEntityType, ChatEntityRegistration> =
    new Map();

  /**
   * Регистрация нового типа сущности
   */
  register(registration: ChatEntityRegistration): void {
    this.registrations.set(registration.entityType, registration);

    // Регистрация rate limit конфигурации
    if (registration.rateLimitConfig) {
      chatRateLimiter.registerConfig(
        registration.entityType,
        registration.rateLimitConfig.maxRequests,
        registration.rateLimitConfig.windowMs,
      );
    }
  }

  /**
   * Получить загрузчик контекста для типа
   */
  getLoader(entityType: ChatEntityType): ContextLoader | null {
    return this.registrations.get(entityType)?.loader ?? null;
  }

  /**
   * Получить конфигурацию промпта для типа
   */
  getPromptConfig(entityType: ChatEntityType): PromptConfig | null {
    return this.registrations.get(entityType)?.promptConfig ?? null;
  }

  /**
   * Проверить, зарегистрирован ли тип
   */
  isRegistered(entityType: ChatEntityType): boolean {
    return this.registrations.has(entityType);
  }

  /**
   * Получить все зарегистрированные типы
   */
  getRegisteredTypes(): ChatEntityType[] {
    return Array.from(this.registrations.keys());
  }
}

export const chatRegistry = new ChatRegistry();
