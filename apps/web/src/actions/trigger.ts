"use server";

import { auth, tasks } from "@trigger.dev/sdk";

export async function createTriggerPublicToken(taskId: string) {
  try {
    const publicToken = await auth.createPublicToken({
      scopes: {
        read: {
          tasks: [taskId],
        },
        write: {
          tasks: [taskId],
        },
        trigger: {
          tasks: [taskId],
        },
      },
      expirationTime: "15m",
    });

    return { success: true, token: publicToken };
  } catch (error) {
    console.error("Failed to create Trigger.dev public token:", error);
    return { success: false, error: "Failed to create token" };
  }
}

export async function triggerScreenResponse(responseId: string) {
  try {
    const handle = await tasks.trigger("screen-response", { responseId });
    return { success: true as const, runId: handle.id };
  } catch (error) {
    console.error("Failed to trigger screen-response:", error);
    return { success: false as const, error: "Failed to trigger task" };
  }
}
