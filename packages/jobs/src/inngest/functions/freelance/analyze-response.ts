import { screenResponse, unwrap } from "../../../services/response";
import { inngest } from "../../client";

/**
 * Inngest function for AI analysis of freelance responses
 * Triggers when a freelance response is imported
 * Reuses existing screenResume logic adapted for response text
 */
export const analyzeFreelanceResponseFunction = inngest.createFunction(
  {
    id: "freelance-response-analyze",
    name: "Analyze Freelance Response",
    retries: 3,
  },
  { event: "freelance/response.analyze" },
  async ({ event, step }) => {
    const { responseId } = event.data;

    const result = await step.run("analyze-freelance-response", async () => {
      console.log("🎯 AI-анализ отклика фрилансера", {
        responseId,
      });

      try {
        const resultWrapper = await screenResponse(responseId);
        const result = unwrap(resultWrapper);

        console.log("✅ Анализ завершен", {
          responseId,
          score: result.score,
          detailedScore: result.detailedScore,
        });

        return {
          success: true,
          responseId,
          result,
        };
      } catch (error) {
        console.error("❌ Ошибка анализа отклика фрилансера", {
          responseId,
          error,
        });
        throw error;
      }
    });

    // Trigger invitation generation after successful analysis
    await step.sendEvent("trigger-invitation-generation", {
      name: "freelance/invitation.generate",
      data: {
        responseId,
      },
    });

    return result;
  },
);
