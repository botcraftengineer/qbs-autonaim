import { and, eq, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { DbClient } from "../index";
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
  workspaceMember,
} from "../schema";

export class OrganizationRepository {
  constructor(private db: DbClient) {}

  // ==================== CRUD операции ====================

  /**
   * Создать организацию
   */
  async create(data: NewOrganization): Promise<Organization> {
    const [newOrganization] = await this.db
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
    return this.db.query.organization.findFirst({
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
    return this.db.query.organization.findFirst({
      where: eq(organization.slug, slug),
    });
  }

  /**
   * Обновить организацию
   */
  async update(
    id: string,
    data: Partial<Omit<Organization, "id" | "createdAt" | "updatedAt">>
  ): Promise<Organization> {
    const [updated] = await this.db
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
    await this.db.delete(organization).where(eq(organization.id, id));
  }

  // ==================== Управление участниками ====================

  /**
   * Добавить участника в организацию
   */
  async addMember(
    orgId: string,
    userId: string,
    role: OrganizationRole = "member"
  ): Promise<OrganizationMember> {
    const [member] = await this.db
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
    await this.db.transaction(async (tx) => {
      // Проверяем, что это не последний owner
      const owners = await tx.query.organizationMember.findMany({
        where: and(
          eq(organizationMember.organizationId, orgId),
          eq(organizationMember.role, "owner")
        ),
      });

      if (owners.length === 1 && owners[0]?.userId === userId) {
        throw new Error("Невозможно удалить последнего владельца организации");
      }

      await tx
        .delete(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, orgId),
            eq(organizationMember.userId, userId)
          )
        );
    });
  }

  /**
   * Обновить роль участника
   */
  async updateMemberRole(
    orgId: string,
    userId: string,
    role: OrganizationRole
  ): Promise<OrganizationMember> {
    return this.db.transaction(async (tx) => {
      // Если понижаем owner, проверяем что это не последний owner
      if (role !== "owner") {
        const currentMember = await tx.query.organizationMember.findFirst({
          where: and(
            eq(organizationMember.organizationId, orgId),
            eq(organizationMember.userId, userId)
          ),
        });

        if (currentMember?.role === "owner") {
          const owners = await tx.query.organizationMember.findMany({
            where: and(
              eq(organizationMember.organizationId, orgId),
              eq(organizationMember.role, "owner")
            ),
          });

          if (owners.length === 1) {
            throw new Error("Невозможно изменить роль последнего владельца");
          }
        }
      }

      const [updated] = await tx
        .update(organizationMember)
        .set({ role })
        .where(
          and(
            eq(organizationMember.organizationId, orgId),
            eq(organizationMember.userId, userId)
          )
        )
        .returning();

      if (!updated) {
        throw new Error("Не удалось обновить роль участника");
      }

      return updated;
    });
  }

  /**
   * Получить всех участников организации
   */
  async getMembers(orgId: string) {
    return this.db.query.organizationMember.findMany({
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
    userId: string
  ): Promise<OrganizationMember | null> {
    const member = await this.db.query.organizationMember.findFirst({
      where: and(
        eq(organizationMember.organizationId, orgId),
        eq(organizationMember.userId, userId)
      ),
    });

    return member ?? null;
  }

  /**
   * Получить все организации пользователя
   */
  async getUserOrganizations(userId: string) {
    const memberships = await this.db.query.organizationMember.findMany({
      where: eq(organizationMember.userId, userId),
      with: {
        organization: {
          with: {
            workspaces: true,
            members: true,
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      workspaceCount: m.organization.workspaces.length,
      memberCount: m.organization.members.length,
    }));
  }

  // ==================== Управление приглашениями ====================

  /**
   * Создать приглашение в организацию
   */
  async createInvite(
    data: Omit<NewOrganizationInvite, "token">
  ): Promise<OrganizationInvite> {
    // Генерируем уникальный токен
    const token = nanoid(32);

    // Проверяем дубликаты приглашений по email
    if (data.invitedEmail) {
      const existingInvite = await this.db.query.organizationInvite.findFirst({
        where: and(
          eq(organizationInvite.organizationId, data.organizationId),
          eq(organizationInvite.invitedEmail, data.invitedEmail),
          gt(organizationInvite.expiresAt, new Date())
        ),
      });

      if (existingInvite) {
        throw new Error("Активное приглашение для этого email уже существует");
      }
    }

    const [invite] = await this.db
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
   * Получить приглашение по ID
   */
  async getInviteById(inviteId: string): Promise<OrganizationInvite | null> {
    const invite = await this.db.query.organizationInvite.findFirst({
      where: eq(organizationInvite.id, inviteId),
    });

    return invite ?? null;
  }

  /**
   * Получить приглашение по токену
   */
  async getInviteByToken(token: string): Promise<OrganizationInvite | null> {
    const invite = await this.db.query.organizationInvite.findFirst({
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
    return this.db.query.organizationInvite.findMany({
      where: and(
        eq(organizationInvite.organizationId, orgId),
        gt(organizationInvite.expiresAt, new Date())
      ),
      orderBy: (invite, { desc }) => [desc(invite.createdAt)],
    });
  }

  /**
   * Удалить приглашение
   */
  async deleteInvite(inviteId: string): Promise<void> {
    await this.db
      .delete(organizationInvite)
      .where(eq(organizationInvite.id, inviteId));
  }

  // ==================== Управление воркспейсами ====================

  /**
   * Получить все воркспейсы организации
   */
  async getWorkspaces(orgId: string) {
    return this.db.query.workspace.findMany({
      where: eq(workspace.organizationId, orgId),
      orderBy: (ws, { asc }) => [asc(ws.createdAt)],
    });
  }

  /**
   * Получить воркспейс по slug в рамках организации
   */
  async getWorkspaceBySlug(orgId: string, slug: string) {
    return this.db.query.workspace.findFirst({
      where: and(eq(workspace.organizationId, orgId), eq(workspace.slug, slug)),
    });
  }

  /**
   * Получить воркспейсы организации, доступные пользователю
   * Если пользователь имеет доступ к организации, возвращает все воркспейсы.
   * Если нет, возвращает только те воркспейсы, к которым у него есть прямой доступ.
   */
  async getUserWorkspacesInOrganization(orgId: string, userId: string) {
    // Проверяем, имеет ли пользователь доступ к организации
    const orgAccess = await this.checkAccess(orgId, userId);

    if (orgAccess) {
      // Если пользователь имеет доступ к организации, возвращаем все воркспейсы
      return this.getWorkspaces(orgId);
    }

    // Если нет доступа к организации, возвращаем только воркспейсы с прямым доступом
    const userWorkspaceMembers = await this.db.query.workspaceMember.findMany({
      where: eq(workspaceMember.userId, userId),
      with: {
        workspace: true,
      },
    });

    // Фильтруем воркспейсы: оставляем только те, которые принадлежат указанной организации
    const accessibleWorkspaces = userWorkspaceMembers
      .map((member) =>
        Array.isArray(member.workspace) ? member.workspace[0] : member.workspace
      )
      .filter((ws) => Boolean(ws) && ws.organizationId === orgId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

    return accessibleWorkspaces;
  }
}
