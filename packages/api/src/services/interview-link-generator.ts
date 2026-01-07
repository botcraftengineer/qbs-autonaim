/**
 * Сервис генерации ссылок на интервью для фриланс-платформ
 *
 * Генерирует уникальные ссылки на интервью для вакансий,
 * валидирует токены и управляет активностью ссылок.
 */

import { randomUUID } from "node:crypto";
import { paths } from "@qbs-autonaim/config";
import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { interviewLink } from "@qbs-autonaim/db/schema";
import { generateSlug } from "../utils/slug-generator";

/**
 * Интерфейс ссылки на интервью
 */
export interface InterviewLink {
  id: string;
  vacancyId: string;
  token: string;
  slug: string;
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
   * Проверяет уникальность slug и генерирует новый при необходимости
   */
  private async generateUniqueSlug(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const slug = generateSlug();

      const existing = await db.query.interviewLink.findFirst({
        where: eq(interviewLink.slug, slug),
      });

      if (!existing) {
        return slug;
      }

      attempts++;
    }

    // Если не удалось сгенерировать уникальный slug, добавляем timestamp
    return `${generateSlug()}-${Date.now()}`;
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

    // Генерируем уникальный токен и slug
    const token = randomUUID();
    const slug = await this.generateUniqueSlug();

    // Создаём запись в БД
    const [created] = await db
      .insert(interviewLink)
      .values({
        vacancyId,
        token,
        slug,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create interview link");
    }

    return this.mapToInterviewLink(created);
  }

  /**
   * Валидирует токен или slug ссылки на интервью
   *
   * @param identifier - Токен (UUID) или slug для валидации
   * @returns Ссылка на интервью если идентификатор валиден и активен, иначе null
   */
  async validateLink(identifier: string): Promise<InterviewLink | null> {
    // Пробуем найти по slug (приоритет) или по token
    const link = await db.query.interviewLink.findFirst({
      where: (table, { or, eq }) =>
        or(eq(table.slug, identifier), eq(table.token, identifier)),
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
      slug: link.slug,
      url: `${this.baseUrl}${paths.interview(link.slug)}`,
      isActive: link.isActive,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    };
  }
}
