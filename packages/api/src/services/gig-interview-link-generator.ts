/**
 * Сервис генерации ссылок на интервью для гигов
 *
 * Генерирует уникальные ссылки на интервью для разовых заданий,
 * валидирует токены и управляет активностью ссылок.
 */

import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { customDomain, gig, gigInterviewLink } from "@qbs-autonaim/db/schema";
import { getInterviewBaseUrl } from "../utils/get-interview-url";
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
  /**
   * Получает домен для интервью из настроек gig
   */
  private async getInterviewDomain(gigId: string): Promise<string | null> {
    const gigData = await db.query.gig.findFirst({
      where: eq(gig.id, gigId),
      columns: {
        customDomainId: true,
        workspaceId: true,
      },
    });

    if (!gigData) {
      return null;
    }

    // Если у gig указан кастомный домен, используем его
    if (gigData.customDomainId) {
      const domain = await db.query.customDomain.findFirst({
        where: and(
          eq(customDomain.id, gigData.customDomainId),
          eq(customDomain.isVerified, true),
        ),
        columns: {
          domain: true,
        },
      });

      if (domain) {
        return `https://${domain.domain}`;
      }
    }

    // Иначе ищем primary домен workspace
    const primaryDomain = await db.query.customDomain.findFirst({
      where: and(
        eq(customDomain.workspaceId, gigData.workspaceId),
        eq(customDomain.type, "interview"),
        eq(customDomain.isPrimary, true),
        eq(customDomain.isVerified, true),
      ),
      columns: {
        domain: true,
      },
    });

    if (primaryDomain) {
      return `https://${primaryDomain.domain}`;
    }

    return null;
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
      // Возвращаем существующую ссылку вместо создания новой
      return await this.mapToGigInterviewLink(existingLink);
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

    return await this.mapToGigInterviewLink(created);
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

    return await this.mapToGigInterviewLink(link);
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
  private async mapToGigInterviewLink(
    link: typeof gigInterviewLink.$inferSelect,
  ): Promise<GigInterviewLink> {
    const customDomainUrl = await this.getInterviewDomain(link.gigId);
    const baseUrl = getInterviewBaseUrl(customDomainUrl);

    return {
      id: link.id,
      gigId: link.gigId,
      token: link.token,
      url: `${baseUrl}/${link.token}`,
      isActive: link.isActive,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
    };
  }
}
