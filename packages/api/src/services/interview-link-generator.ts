/**
 * Сервис генерации ссылок на интервью для фриланс-платформ
 *
 * Генерирует уникальные ссылки на интервью для вакансий,
 * валидирует токены и управляет активностью ссылок.
 */

import { randomUUID } from "node:crypto";
import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { interviewLink } from "@qbs-autonaim/db/schema";

/**
 * Интерфейс ссылки на интервью
 */
export interface InterviewLink {
  id: string;
  vacancyId: string;
  token: string;
  url: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Сервис для управления ссылками на интервью
 */
export class InterviewLinkGenerator {
  private readonly baseUrl: string;

  constructor(baseUrl = "https://qbs.app") {
    this.baseUrl = baseUrl;
  }

  /**
   * Генерирует уникальную ссылку на интервью для вакансии
   *
   * @param vacancyId - ID вакансии
   * @returns Созданная ссылка на интервью
   * @throws Error если ссылка для вакансии уже существует
   */
  async generateLink(vacancyId: string): Promise<InterviewLink> {
    // Проверяем, существует ли уже активная ссылка для этой вакансии
    const existingLink = await db.query.interviewLink.findFirst({
      where: and(
        eq(interviewLink.vacancyId, vacancyId),
        eq(interviewLink.isActive, true),
      ),
    });

    if (existingLink) {
      // Возвращаем существующую ссылку вместо создания новой
      return this.mapToInterviewLink(existingLink);
    }

    // Генерируем уникальный токен
    const token = randomUUID();

    // Создаём запись в БД
    const [created] = await db
      .insert(interviewLink)
      .values({
        vacancyId,
        token,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create interview link");
    }

    return this.mapToInterviewLink(created);
  }

  /**
   * Валидирует токен ссылки на интервью
   *
   * @param token - Токен для валидации
   * @returns Ссылка на интервью если токен валиден и активен, иначе null
   */
  async validateLink(token: string): Promise<InterviewLink | null> {
    const link = await db.query.interviewLink.findFirst({
      where: eq(interviewLink.token, token),
    });

    if (!link) {
      return null;
    }

    // Проверяем активность
    if (!link.isActive) {
      return null;
    }

    // Проверяем срок действия
    if (link.expiresAt && link.expiresAt < new Date()) {
      return null;
    }

    return this.mapToInterviewLink(link);
  }

  /**
   * Деактивирует ссылку на интервью
   *
   * @param linkId - ID ссылки для деактивации
   */
  async deactivateLink(linkId: string): Promise<void> {
    await db
      .update(interviewLink)
      .set({ isActive: false })
      .where(eq(interviewLink.id, linkId));
  }

  /**
   * Преобразует запись из БД в интерфейс InterviewLink
   */
  private mapToInterviewLink(
    link: typeof interviewLink.$inferSelect,
  ): InterviewLink {
    return {
      id: link.id,
      vacancyId: link.vacancyId,
      token: link.token,
      url: `${this.baseUrl}/interview/${link.token}`,
      isActive: link.isActive,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    };
  }
}
