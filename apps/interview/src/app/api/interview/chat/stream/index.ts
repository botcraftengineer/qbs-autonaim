import {
  createGetInterviewSettingsTool,
  createGetInterviewStateTool,
  createUpdateInterviewStateTool,
  createGetInterviewPolicyTool,
  createGetInterviewQuestionBankTool,
  createGetScoringRubricTool,
  createGetInterviewProfileTool,
  createSaveInterviewNoteTool,
  createSaveQuestionAnswerTool,
} from "./tools";
import { createSystemPrompt } from "./prompts";
import type { InterviewRuntimeParams, EntityType } from "./types";

export function createWebInterviewRuntime(params: InterviewRuntimeParams) {
  const {
    model,
    sessionId,
    db,
    gig,
    vacancy,
    interviewContext,
    isFirstResponse,
  } = params;

  const entityType: EntityType = gig ? "gig" : vacancy ? "vacancy" : "unknown";

  const tools = {
    getInterviewSettings: createGetInterviewSettingsTool(
      gig,
      vacancy,
      interviewContext,
      entityType,
    ),
    getInterviewState: createGetInterviewStateTool(sessionId),
    updateInterviewState: createUpdateInterviewStateTool(sessionId),
    getInterviewPolicy: createGetInterviewPolicyTool(entityType),
    getInterviewQuestionBank: createGetInterviewQuestionBankTool(
      model,
      sessionId,
      gig,
      vacancy,
      entityType,
    ),
    getScoringRubric: createGetScoringRubricTool(sessionId, entityType),
    getInterviewProfile: createGetInterviewProfileTool(sessionId, db),
    saveInterviewNote: createSaveInterviewNoteTool(sessionId),
    saveQuestionAnswer: createSaveQuestionAnswerTool(sessionId),
  };

  const systemPrompt = createSystemPrompt(entityType, isFirstResponse);

  return {
    tools,
    systemPrompt,
  };
}