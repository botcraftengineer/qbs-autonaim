import { env, paths } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  organization,
  telegramSession,
  user,
  userWorkspace,
  workspace,
} from "@qbs-autonaim/db/schema";
import { TelegramAuthErrorEmail } from "@qbs-autonaim/emails";
import { sendEmail } from "@qbs-autonaim/emails/send";
import { inngest } from "../../client";

/**
 * Inngest function to notify workspace admins when Telegram authorization fails
 */
export const notifyTelegramAuthErrorFunction = inngest.createFunction(
  {
    id: "notify-telegram-auth-error",
    name: "Notify Telegram Auth Error",
    retries: 3,
  },
  { event: "telegram/auth.error" },
  async ({ event, step }) => {
    const { sessionId, workspaceId, errorType, errorMessage, phone } =
      event.data;

    // Get workspace info and admin emails
    const workspaceData = await step.run("get-workspace-data", async () => {
      const [ws] = await db
        .select({
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          organizationId: workspace.organizationId,
        })
        .from(workspace)
        .where(eq(workspace.id, workspaceId))
        .limit(1);

      if (!ws) {
        throw new Error(`Workspace not found: ${workspaceId}`);
      }

      // Get organization slug for the reauthorize link
      let organizationSlug: string | undefined;
      if (ws.organizationId) {
        const [org] = await db
          .select({ slug: organization.slug })
          .from(organization)
          .where(eq(organization.id, ws.organizationId))
          .limit(1);
        organizationSlug = org?.slug;
      }

      // Get all admins and owners of the workspace
      const members = await db
        .select({
          userId: userWorkspace.userId,
          role: userWorkspace.role,
          email: user.email,
          name: user.name,
        })
        .from(userWorkspace)
        .innerJoin(user, eq(user.id, userWorkspace.userId))
        .where(eq(userWorkspace.workspaceId, workspaceId));

      // Filter to admins and owners only
      const admins = members.filter(
        (m) => m.role === "owner" || m.role === "admin",
      );

      return {
        workspace: ws,
        organizationSlug,
        admins,
      };
    });

    // Update session with error notification timestamp
    await step.run("update-session", async () => {
      await db
        .update(telegramSession)
        .set({
          authErrorNotifiedAt: new Date(),
        })
        .where(eq(telegramSession.id, sessionId));
    });

    // Send email to each admin in separate idempotent steps
    const emailSettledResults = await Promise.allSettled(
      workspaceData.admins
        .filter((admin) => admin.email)
        .map((admin) =>
          step.run(`send-email-${admin.userId}`, async () => {
            if (!workspaceData.organizationSlug) {
              const error = new Error(
                `Missing organizationSlug for workspace ${workspaceData.workspace.slug} (ID: ${workspaceId})`,
              );
              console.error("❌ Cannot build reauthorize link:", error.message);
              throw error;
            }

            const reauthorizeLink = `${env.APP_URL}${paths.workspace.settings.telegram(workspaceData.organizationSlug, workspaceData.workspace.slug)}`;

            await sendEmail({
              to: [admin.email],
              subject: `⚠️ Telegram авторизация слетела: ${workspaceData.workspace.name}`,
              react: TelegramAuthErrorEmail({
                workspaceName: workspaceData.workspace.name,
                phone,
                errorType,
                errorMessage,
                reauthorizeLink,
              }),
            });

            console.log(`✅ Email sent to ${admin.email}`);
            return { email: admin.email, success: true };
          }),
        ),
    );

    // Map settled results to success/failure records
    const emailResults = emailSettledResults.map((result, index) => {
      const admin = workspaceData.admins.filter((a) => a.email)[index];
      if (result.status === "fulfilled") {
        return result.value;
      }
      const errorMsg =
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown error";
      console.error(
        `❌ Failed to send email to ${admin?.email}:`,
        result.reason,
      );
      return {
        email: admin?.email || "unknown",
        success: false,
        error: errorMsg,
      };
    });

    const successCount = emailResults.filter((r) => r.success).length;
    const failCount = emailResults.filter((r) => !r.success).length;

    console.log(
      `📧 Telegram auth error notification sent: ${successCount} success, ${failCount} failed`,
    );

    return {
      success: true,
      sessionId,
      workspaceId,
      emailsSent: successCount,
      emailsFailed: failCount,
      recipients: emailResults,
    };
  },
);
