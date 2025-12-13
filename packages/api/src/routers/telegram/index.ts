import type { TRPCRouterRecord } from "@trpc/server";

import {
  checkPasswordRouter,
  clearAuthErrorRouter,
  deleteSessionRouter,
  getSessionStatusRouter,
  getSessionsRouter,
  reauthorizeSessionRouter,
  sendCodeRouter,
  signInRouter,
} from "./auth";
import { getConversationRouter } from "./conversation";
import { getFileUrlRouter } from "./file";
import { getMessagesRouter } from "./messages";
import { sendMessageRouter } from "./send";
import {
  sendUserMessageByPhoneRouter,
  sendUserMessageRouter,
} from "./send-user";
import { transcribeVoiceRouter } from "./transcribe";

export const telegramRouter = {
  conversation: getConversationRouter,
  messages: getMessagesRouter,
  send: sendMessageRouter,
  file: getFileUrlRouter,
  transcribe: transcribeVoiceRouter,
  sendCode: sendCodeRouter,
  signIn: signInRouter,
  checkPassword: checkPasswordRouter,
  getSessions: getSessionsRouter,
  deleteSession: deleteSessionRouter,
  getSessionStatus: getSessionStatusRouter,
  clearAuthError: clearAuthErrorRouter,
  reauthorizeSession: reauthorizeSessionRouter,
  sendUserMessage: sendUserMessageRouter,
  sendUserMessageByPhone: sendUserMessageByPhoneRouter,
} satisfies TRPCRouterRecord;
