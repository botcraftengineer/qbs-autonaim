/**
 * Сервис генерации ссылок на интервью для гигов
 *
 * Генерирует уникальные ссылки на интервью для разовых заданий,
 * валидирует токены и управляет активностью ссылок.
 */

import { paths } from "@qbs-autonaim/config";
import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { gigInterviewLink } from "@qbs-autonaim/db/schema";
import { generateSlug } from "../utils/slug-generator";

/**
 * Интерфейс ссылки на интервью для гига
 */
export interface GigInterviewLink {
  id: string;
  gigId: string;
  token: string;
  url: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Сервис для управления ссылками на интервью для гигов
 */
export class GigInterviewLinkGenerator {
  private readonly baseUrl: string;

  constructor(baseUrl = "https://qbs.app") {
    this.baseUrl = baseUrl;
  }

  /**
   * Проверяет уникальность токена и генерирует новый при необходимости
   */
  private async generateUniqueToken(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const token = generateSlug();

      const existing = await db.query.gigInterviewLink.findFirst({
        where: eq(gigInterviewLink.token, token),
      });

      if (!existing) {
        return token;
      }

      attempts++;
    }

    // Если не удалось сгенерировать уникальный токен, добавляем timestamp
    return `${generateSlug()}-${Date.now()}`;
  }

  /**
   * Генерирует уникальную ссылку на интервью для гига
   *
   * @param gigId - ID гига
   * @returns Созданная ссылка на интервью
   */
  async generateLink(gigId: string): Promise<GigInterviewLink> {
    // Проверяем, существует ли уже активная ссылка для этого гига
    const existingLink = await db.query.gigInterviewLink.findFirst({
      where: and(
        eq(gigInterviewLink.gigId, gigId),
        eq(gigInterviewLink.isActive, true),
      ),
    });

    if (existingLink) {
      // Возвращаем ��уществующую ссылку вместо создания новой
      return this.mapToGigInterviewLink(existingLink);
    }

    // Генерируем уникальный токен
    const token = await this.generateUniqueToken();

    // Создаём запись в БД
    const [created] = await db
      .insert(gigInterviewLink)
      .values({
        gigId,
        token,
        isActive: true,
      })
      .returning();

    if (!created) {
      throw new Error("Failed to create gig interview link");
    }

    return this.mapToGigInterviewLink(created);
  }

  /**
   * Валидирует токен ссылки на интервью для гига
   *
   * @param token - Токен для валидации
   * @returns Ссылка на интервью если токен валиден и активен, иначе null
   */
  async validateLink(token: string): Promise<GigInterviewLink | null> {
    const link = await db.query.gigInterviewLink.findFirst({
      where: eq(gigInterviewLink.token, token),
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

    return this.mapToGigInterviewLink(link);
  }

  /**
   * Деактивирует ссылку на интервью для гига
   *
   * @param linkId - ID ссылки для деактивации
   */
  async deactivateLink(linkId: string): Promise<void> {
    await db
      .update(gigInterviewLink)
      .set({ isActive: false })
      .where(eq(gigInterviewLink.id, linkId));
  }

  /**
   * Преобразует запись из БД в интерфейс GigInterviewLink
   */
  private mapToGigInterviewLink(
    link: typeof gigInterviewLink.$inferSelect,
  ): GigInterviewLink {
    return {
      id: link.id,
      gigId: link.gigId,
      token: link.token,
      url: `${this.baseUrl}${paths.interview(link.token)}`,
      isActive: link.isActive,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    };
  }
}
