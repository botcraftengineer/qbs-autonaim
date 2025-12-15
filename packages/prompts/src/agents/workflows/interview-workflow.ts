/**
 * Workflow для проведения интервью с использованием AI SDK
 */

import type { LanguageModel } from "ai";
import { generateText } from "ai";
import { InterviewOrchestrator } from "../orchestrator";
import { getConversationContext, getVoiceMessagesInfo } from "../tools";
import type { BaseAgentContext, WorkflowState } from "../types";

export interface InterviewWorkflowConfig {
  model: LanguageModel;
  maxSteps?: number;
  maxVoiceMessages?: number;
}

export class InterviewWorkflow {
  private orchestrator: InterviewOrchestrator;
  private config: InterviewWorkflowConfig;

  constructor(config: InterviewWorkflowConfig) {
    this.orchestrator = new InterviewOrchestrator({
      model: config.model,
    });
    this.config = {
      maxSteps: 20,
      maxVoiceMessages: 2,
      ...config,
    };
  }

  /**
   * Выполнение одного шага интервью
   */
  async executeStep(
    message: string,
    currentState: WorkflowState,
    context: BaseAgentContext,
  ) {
    const result = await this.orchestrator.execute(
      {
        message,
        currentState,
        customQuestions: null,
      },
      context,
    );

    return result;
  }

  /**
   * Генерация ответа с использованием AI SDK
   */
  async generateResponse(
    prompt: string,
    _context: BaseAgentContext,
  ): Promise<string> {
    const result = await generateText({
      model: this.config.model,
      prompt,
      tools: {
        getVoiceMessagesInfo,
        getConversationContext,
      },
    });

    return result.text;
  }

  /**
   * Полный цикл интервью с агентами
   */
  async runInterview(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    context: BaseAgentContext,
    initialState: WorkflowState,
  ) {
    let currentState = initialState;
    const steps: Array<{
      message: string;
      response: string;
      state: WorkflowState;
      timestamp: Date;
    }> = [];

    for (const msg of messages) {
      if (msg.role !== "user") continue;

      const result = await this.executeStep(msg.content, currentState, context);

      if (result.decision.action === "ESCALATE") {
        return {
          status: "ESCALATED",
          reason: result.decision.reason,
          steps,
          finalState: result.updatedState,
        };
      }

      if (result.decision.action === "SKIP") {
        continue;
      }

      steps.push({
        message: msg.content,
        response: result.response || "",
        state: result.updatedState,
        timestamp: new Date(),
      });

      currentState = result.updatedState;

      if (result.decision.action === "COMPLETE") {
        break;
      }
    }

    return {
      status: "COMPLETED",
      steps,
      finalState: currentState,
    };
  }
}
