import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { dbEdge as db } from "../index";
import {
  type NewOrganization,
  type NewOrganizationInvite,
  type Organization,
  type OrganizationInvite,
  type OrganizationMember,
  type OrganizationRole,
  organization,
  organizationInvite,
  organizationMember,
  workspace,
} from "../schema";

export class OrganizationRepository {
  // ==================== CRUD операции ====================

  /**
   * Создать организацию
   */
  async create(data: NewOrganization): Promise<Organization> {
    const [newOrganization] = await db
      .insert(organization)
      .values(data)
      .returning();

    if (!newOrganization) {
      throw new Error("Не удалось создать организацию");
    }

    return newOrganization;
  }

  /**
   * Получить организацию по ID с участниками и воркспейсами
   */
  async findById(id: string) {
    return db.query.organization.findFirst({
      where: eq(organization.id, id),
      with: {
        members: {
          with: {
            user: true,
          },
        },
        workspaces: true,
        invites: true,
      },
    });
  }

  /**
   * Получить организацию по slug
   */
  async findBySlug(slug: string) {
    return db.query.organization.findFirst({
      where: eq(organization.slug, slug),
    });
  }

  /**
   * Обновить организацию
   */
  async update(
    id: string,
    data: Partial<Omit<Organization, "id" | "createdAt" | "updatedAt">>,
  ): Promise<Organization> {
    const [updated] = await db
      .update(organization)
      .set(data)
      .where(eq(organization.id, id))
      .returning();

    if (!updated) {
      throw new Error("Не удалось обновить организацию");
    }

    return updated;
  }

  /**
   * Удалить организацию (каскадно удалит workspaces и members)
   */
  async delete(id: string): Promise<void> {
    await db.delete(organization).where(eq(organization.id, id));
  }

  // ==================== Управление участниками ====================

  /**
   * Добавить участника в организацию
   */
  async addMember(
    orgId: string,
    userId: string,
    role: OrganizationRole = "member",
  ): Promise<OrganizationMember> {
    const [member] = await db
      .insert(organizationMember)
      .values({
        organizationId: orgId,
        userId,
        role,
      })
      .returning();

    if (!member) {
      throw new Error("Не удалось добавить участника в организацию");
    }

    return member;
  }

  /**
   * Удалить участника из организации
   */
  async removeMember(orgId: string, userId: string): Promise<void> {
    // Проверяем, что это не последний owner
    const owners = await db.query.organizationMember.findMany({
      where: and(
        eq(organizationMember.organizationId, orgId),
        eq(organizationMember.role, "owner"),
      ),
    });

    if (owners.length === 1 && owners[0]?.userId === userId) {
      throw new Error("Невозможно удалить последнего владельца организации");
    }

    await db
      .delete(organizationMember)
      .where(
        and(
          eq(organizationMember.organizationId, orgId),
          eq(organizationMember.userId, userId),
        ),
      );
  }

  /**
   * Обновить роль участника
   */
  async updateMemberRole(
    orgId: string,
    userId: string,
    role: OrganizationRole,
  ): Promise<OrganizationMember> {
    // Если понижаем owner, проверяем что это не последний owner
    if (role !== "owner") {
      const currentMember = await db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, orgId),
          eq(organizationMember.userId, userId),
        ),
      });

      if (currentMember?.role === "owner") {
        const owners = await db.query.organizationMember.findMany({
          where: and(
            eq(organizationMember.organizationId, orgId),
            eq(organizationMember.role, "owner"),
          ),
        });

        if (owners.length === 1) {
          throw new Error("Невозможно изменить роль последнего владельца");
        }
      }
    }

    const [updated] = await db
      .update(organizationMember)
      .set({ role })
      .where(
        and(
          eq(organizationMember.organizationId, orgId),
          eq(organizationMember.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      throw new Error("Не удалось обновить роль участника");
    }

    return updated;
  }

  /**
   * Получить всех участников организации
   */
  async getMembers(orgId: string) {
    return db.query.organizationMember.findMany({
      where: eq(organizationMember.organizationId, orgId),
      with: {
        user: true,
      },
    });
  }

  /**
   * Проверить доступ пользователя к организации
   */
  async checkAccess(
    orgId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    const member = await db.query.organizationMember.findFirst({
      where: and(
        eq(organizationMember.organizationId, orgId),
        eq(organizationMember.userId, userId),
      ),
    });

    return member ?? null;
  }

  /**
   * Получить все организации пользователя
   */
  async getUserOrganizations(userId: string) {
    const memberships = await db.query.organizationMember.findMany({
      where: eq(organizationMember.userId, userId),
      with: {
        organization: true,
      },
    });

    return memberships.map((m) => m.organization);
  }

  // ==================== Управление приглашениями ====================

  /**
   * Создать приглашение в организацию
   */
  async createInvite(
    data: Omit<NewOrganizationInvite, "token">,
  ): Promise<OrganizationInvite> {
    // Генерируем уникальный токен
    const token = nanoid(32);

    // Проверяем дубликаты приглашений по email
    if (data.invitedEmail) {
      const existingInvite = await db.query.organizationInvite.findFirst({
        where: and(
          eq(organizationInvite.organizationId, data.organizationId),
          eq(organizationInvite.invitedEmail, data.invitedEmail),
          gt(organizationInvite.expiresAt, new Date()),
        ),
      });

      if (existingInvite) {
        throw new Error("Активное приглашение для этого email уже существует");
      }
    }

    const [invite] = await db
      .insert(organizationInvite)
      .values({
        ...data,
        token,
      })
      .returning();

    if (!invite) {
      throw new Error("Не удалось создать приглашение");
    }

    return invite;
  }

  /**
   * Получить приглашение по токену
   */
  async getInviteByToken(token: string): Promise<OrganizationInvite | null> {
    const invite = await db.query.organizationInvite.findFirst({
      where: eq(organizationInvite.token, token),
      with: {
        organization: true,
      },
    });

    return invite ?? null;
  }

  /**
   * Получить все активные приглашения организации
   */
  async getPendingInvites(orgId: string): Promise<OrganizationInvite[]> {
    return db.query.organizationInvite.findMany({
      where: and(
        eq(organizationInvite.organizationId, orgId),
        gt(organizationInvite.expiresAt, new Date()),
      ),
      orderBy: (invite, { desc }) => [desc(invite.createdAt)],
    });
  }

  /**
   * Удалить приглашение
   */
  async deleteInvite(inviteId: string): Promise<void> {
    await db
      .delete(organizationInvite)
      .where(eq(organizationInvite.id, inviteId));
  }

  // ==================== Управление воркспейсами ====================

  /**
   * Получить все воркспейсы организации
   */
  async getWorkspaces(orgId: string) {
    return db.query.workspace.findMany({
      where: eq(workspace.organizationId, orgId),
      orderBy: (ws, { asc }) => [asc(ws.createdAt)],
    });
  }

  /**
   * Получить воркспейс по slug в рамках организации
   */
  async getWorkspaceBySlug(orgId: string, slug: string) {
    return db.query.workspace.findFirst({
      where: and(eq(workspace.organizationId, orgId), eq(workspace.slug, slug)),
    });
  }
}

export const organizationRepository = new OrganizationRepository();
