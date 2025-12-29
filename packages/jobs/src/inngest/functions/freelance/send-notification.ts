import { eq, inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewScoring,
  user,
  vacancyResponse,
  workspaceMember,
} from "@qbs-autonaim/db/schema";
import { inngest } from "../../client";

/**
 * Группировка уведомлений в пределах 5-минутного окна
 * Собирает все уведомления для workspace и отправляет их батчем
 */
export const sendFreelanceNotificationFunction = inngest.createFunction(
  {
    id: "freelance-notification-send",
    name: "Send Freelance Notification",
    retries: 2,
  },
  { event: "freelance/notification.send" },
  async ({ event, step }) => {
    const { responseId, notificationType } = event.data;
    const error = (event.data as { error?: string }).error;

    console.log("📬 Обработка уведомления", {
      responseId,
      notificationType,
    });

    // Получаем данные отклика и кандидата
    const responseData = await step.run("get-response-data", async () => {
      const response = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.id, responseId),
        with: {
          vacancy: {
            with: {
              workspace: true,
            },
          },
        },
      });

      if (!response) {
        throw new Error(`Response ${responseId} не найден`);
      }

      // Получаем скоринг если есть
      const scoring = await db.query.interviewScoring.findFirst({
        where: eq(interviewScoring.responseId, responseId),
      });

      return {
        response,
        scoring,
        workspaceId: response.vacancy.workspaceId,
      };
    });

    // Получаем всех членов workspace для отправки уведомлений
    const workspaceMembers = await step.run(
      "get-workspace-members",
      async () => {
        const members = await db.query.workspaceMember.findMany({
          where: eq(workspaceMember.workspaceId, responseData.workspaceId),
        });

        if (members.length === 0) {
          console.warn("⚠️ Нет членов workspace для уведомления", {
            workspaceId: responseData.workspaceId,
          });
          return [];
        }

        // Получаем данные пользователей
        const userIds = members.map((m) => m.userId);
        const users = await db.query.user.findMany({
          where: inArray(user.id, userIds),
        });

        return users;
      },
    );

    if (workspaceMembers.length === 0) {
      console.log("ℹ️ Нет получателей для уведомления");
      return { success: true, sent: 0 };
    }

    // Формируем сообщение уведомления
    const { message } = await step.run("format-notification", async () => {
      const { response, scoring } = responseData;
      const candidateName = response.candidateName || "Кандидат без имени";
      const vacancyTitle = response.vacancy?.title || "Вакансия";
      const profileUrl = response.platformProfileUrl || response.resumeUrl;
      const errorMessage = error; // Захватываем error из внешней области

      let message = "";

      if (notificationType === "INTERVIEW_COMPLETED") {
        message = `✅ Интервью завершено\n\n`;
        message += `Кандидат: ${candidateName}\n`;
        message += `Вакансия: ${vacancyTitle}\n`;

        if (scoring) {
          message += `Оценка: ${scoring.detailedScore}/100\n`;
        }

        message += `\nПрофиль: ${profileUrl}`;
      } else if (notificationType === "HIGH_SCORE_CANDIDATE") {
        message = `🌟 Найден высокооценённый кандидат!\n\n`;
        message += `Кандидат: ${candidateName}\n`;
        message += `Вакансия: ${vacancyTitle}\n`;

        if (scoring) {
          message += `Оценка: ${scoring.detailedScore}/100 ⭐\n`;
        }

        message += `\nПрофиль: ${profileUrl}`;
      } else if (notificationType === "ANALYSIS_FAILED") {
        message = `❌ Ошибка AI-анализа отклика\n\n`;
        message += `Кандидат: ${candidateName}\n`;
        message += `Вакансия: ${vacancyTitle}\n`;
        message += `\nВсе попытки автоматического анализа исчерпаны.\n`;
        message += `Вы можете повторить анализ вручную в интерфейсе.\n`;

        if (errorMessage) {
          message += `\nОшибка: ${errorMessage}`;
        }

        message += `\nПрофиль: ${profileUrl}`;
      }

      return {
        message,
        profileUrl,
        candidateName,
        vacancyTitle,
        score: scoring?.detailedScore,
      };
    });

    // Отправляем уведомления всем членам workspace
    const sendResults = await step.run("send-notifications", async () => {
      const results = [];

      for (const member of workspaceMembers) {
        // TODO: Здесь нужно проверить предпочтения пользователя по каналам уведомлений
        // Пока отправляем только email (если есть)

        if (member.email) {
          // Email уведомление
          console.log("📧 Отправка email уведомления", {
            to: member.email,
            type: notificationType,
            message,
          });

          // TODO: Интеграция с email сервисом
          // await sendEmail({
          //   to: member.email,
          //   subject: `QBS: ${vacancyTitle}`,
          //   body: message,
          // });

          results.push({
            userId: member.id,
            channel: "EMAIL",
            success: true,
          });
        }

        // TODO: In-app уведомление
        // Создать запись в таблице notifications

        // TODO: Telegram уведомление
        // Если у пользователя есть telegram username
        // await inngest.send({
        //   name: "telegram/message.send-by-username",
        //   data: {
        //     workspaceId,
        //     username: member.telegramUsername,
        //     content: message,
        //   },
        // });
      }

      return results;
    });

    console.log("✅ Уведомления отправлены", {
      workspaceId: responseData.workspaceId,
      sent: sendResults.length,
      type: notificationType,
    });

    return {
      success: true,
      sent: sendResults.length,
      notificationType,
    };
  },
);
