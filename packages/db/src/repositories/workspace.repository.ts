import { and, eq, gt, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import type { DbClient } from "../index";
import {
  organization,
  user,
  userWorkspace,
  workspace,
  workspaceInvite,
} from "../schema";

export class WorkspaceRepository {
  constructor(private db: DbClient) {}
  // Создать workspace
  async create(data: {
    organizationId: string;
    name: string;
    slug: string;
    description?: string;
    website?: string;
    logo?: string;
  }) {
    // Проверяем, что организация существует
    const org = await this.db.query.organization.findFirst({
      where: eq(organization.id, data.organizationId),
    });

    if (!org) {
      throw new Error("Организация не найдена");
    }

    // ID генерируется автоматически через workspace_id_generate()
    const [newWorkspace] = await this.db
      .insert(workspace)
      .values(data)
      .returning();

    // Возвращаем workspace с организацией
    return {
      ...newWorkspace,
      organization: org,
    };
  }

  // Получить workspace по ID
  async findById(id: string) {
    return this.db.query.workspace.findFirst({
      where: eq(workspace.id, id),
      with: {
        userWorkspaces: {
          with: {
            user: true,
          },
        },
        integrations: true,
      },
    });
  }

  // Получить workspace по slug и organizationId
  async findBySlug(slug: string, organizationId: string) {
    return this.db.query.workspace.findFirst({
      where: and(
        eq(workspace.slug, slug),
        eq(workspace.organizationId, organizationId),
      ),
    });
  }

  // Получить все workspaces пользователя
  async findByUserId(userId: string) {
    return this.db.query.userWorkspace.findMany({
      where: eq(userWorkspace.userId, userId),
      with: {
        workspace: {
          with: {
            organization: true,
          },
        },
      },
    });
  }

  // Обновить workspace
  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      website?: string;
      logo?: string;
      organizationId?: string;
    },
  ) {
    // Если обновляется organizationId, проверяем что организация существует
    if (data.organizationId) {
      const org = await this.db.query.organization.findFirst({
        where: eq(organization.id, data.organizationId),
      });

      if (!org) {
        throw new Error("Организация не найдена");
      }
    }

    const [updated] = await this.db
      .update(workspace)
      .set(data)
      .where(eq(workspace.id, id))
      .returning();
    return updated;
  }

  // Удалить workspace
  async delete(id: string) {
    await this.db.delete(workspace).where(eq(workspace.id, id));
  }

  // Добавить пользователя в workspace
  async addUser(
    workspaceId: string,
    userId: string,
    role: "owner" | "admin" | "member" = "member",
  ) {
    const [member] = await this.db
      .insert(userWorkspace)
      .values({
        workspaceId,
        userId,
        role,
      })
      .returning();
    return member;
  }

  // Удалить пользователя из workspace
  async removeUser(workspaceId: string, userId: string) {
    await this.db
      .delete(userWorkspace)
      .where(
        and(
          eq(userWorkspace.workspaceId, workspaceId),
          eq(userWorkspace.userId, userId),
        ),
      );
  }

  // Обновить роль пользователя в workspace
  async updateUserRole(
    workspaceId: string,
    userId: string,
    role: "owner" | "admin" | "member",
  ) {
    const [updated] = await this.db
      .update(userWorkspace)
      .set({ role })
      .where(
        and(
          eq(userWorkspace.workspaceId, workspaceId),
          eq(userWorkspace.userId, userId),
        ),
      )
      .returning();
    return updated;
  }

  // Проверить доступ пользователя к workspace
  async checkAccess(workspaceId: string, userId: string) {
    const member = await this.db.query.userWorkspace.findFirst({
      where: and(
        eq(userWorkspace.workspaceId, workspaceId),
        eq(userWorkspace.userId, userId),
      ),
    });
    return member;
  }

  // Получить всех участников workspace
  async getMembers(workspaceId: string) {
    return this.db.query.userWorkspace.findMany({
      where: eq(userWorkspace.workspaceId, workspaceId),
      with: {
        user: true,
      },
    });
  }

  // Получить все активные приглашения workspace
  async getInvites(workspaceId: string) {
    return this.db.query.workspaceInvite.findMany({
      where: (invite, { and, eq }) =>
        and(
          eq(invite.workspaceId, workspaceId),
          gt(invite.expiresAt, new Date()),
        ),
      with: {
        workspace: {
          with: {
            organization: true,
          },
        },
      },
    });
  }

  // Найти приглашение по email
  async findInviteByEmail(workspaceId: string, email: string) {
    return this.db.query.workspaceInvite.findFirst({
      where: and(
        eq(workspaceInvite.workspaceId, workspaceId),
        eq(workspaceInvite.invitedEmail, email),
        gt(workspaceInvite.expiresAt, new Date()),
      ),
    });
  }

  // Отменить приглашение по email
  async cancelInviteByEmail(workspaceId: string, email: string) {
    const result = await this.db
      .delete(workspaceInvite)
      .where(
        and(
          eq(workspaceInvite.workspaceId, workspaceId),
          eq(workspaceInvite.invitedEmail, email),
        ),
      )
      .returning();

    return result.length > 0 ? result[0] : null;
  }

  // Удалить приглашение после принятия
  async deleteInviteByToken(token: string) {
    await this.db
      .delete(workspaceInvite)
      .where(eq(workspaceInvite.token, token));
  }

  // Найти пользователя по email
  async findUserByEmail(email: string) {
    // Валидация email перед запросом в БД
    const emailSchema = z
      .string()
      .email({ message: "Некорректный формат email" });
    const validatedEmail = emailSchema.parse(email);

    return this.db.query.user.findFirst({
      where: eq(user.email, validatedEmail),
    });
  }

  // Создать публичный invite link (для любого пользователя)
  async createInviteLink(
    workspaceId: string,
    createdBy: string,
    role: "owner" | "admin" | "member" = "member",
    expiresInDays: number = 7,
  ) {
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const [invite] = await this.db
      .insert(workspaceInvite)
      .values({
        workspaceId,
        token,
        role,
        expiresAt,
        createdBy,
        invitedUserId: null,
        invitedEmail: null,
      })
      .returning();

    if (!invite) {
      throw new Error("Не удалось создать ссылку-приглашение");
    }

    return invite;
  }

  // Создать персональное приглашение для конкретного пользователя
  async createPersonalInvite(
    workspaceId: string,
    createdBy: string,
    invitedEmail: string,
    invitedUserId: string | null,
    role: "owner" | "admin" | "member" = "member",
    expiresInDays: number = 7,
  ) {
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const [invite] = await this.db
      .insert(workspaceInvite)
      .values({
        workspaceId,
        token,
        role,
        expiresAt,
        createdBy,
        invitedUserId,
        invitedEmail,
      })
      .returning();

    if (!invite) {
      throw new Error("Не удалось создать персональное приглашение");
    }

    return invite;
  }

  // Получить активный invite link для workspace
  async getActiveInviteLink(workspaceId: string) {
    return this.db.query.workspaceInvite.findFirst({
      where: (invite, { and, eq }) =>
        and(
          eq(invite.workspaceId, workspaceId),
          gt(invite.expiresAt, new Date()),
        ),
      orderBy: (invite, { desc }) => [desc(invite.createdAt)],
    });
  }

  // Получить invite по токену
  async getInviteByToken(token: string) {
    return this.db.query.workspaceInvite.findFirst({
      where: eq(workspaceInvite.token, token),
      with: {
        workspace: {
          with: {
            organization: true,
          },
        },
      },
    });
  }

  // Получить все активные приглашения для пользователя
  async getPendingInvitesByUser(userId: string, email: string) {
    return this.db.query.workspaceInvite.findMany({
      where: and(
        or(
          eq(workspaceInvite.invitedUserId, userId),
          eq(workspaceInvite.invitedEmail, email),
        ),
        gt(workspaceInvite.expiresAt, new Date()),
      ),
      with: {
        workspace: {
          with: {
            organization: true,
          },
        },
      },
      orderBy: (invite, { desc }) => [desc(invite.createdAt)],
    });
  }

  // Удалить invite
  async deleteInvite(inviteId: string) {
    await this.db
      .delete(workspaceInvite)
      .where(eq(workspaceInvite.id, inviteId));
  }
}
