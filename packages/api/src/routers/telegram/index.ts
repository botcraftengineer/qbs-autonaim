import {
  checkPasswordRouter,
  clearAuthErrorRouter,
  deleteSessionRouter,
  getSessionsRouter,
  getSessionStatusRouter,
  reauthorizeSessionRouter,
  sendCodeRouter,
  signInRouter,
} from "./auth";
import { getConversationRouter } from "./get-conversation";
import { getFileUrlRouter } from "./get-file-url";
import { getMessagesRouter } from "./get-messages";
import { sendMessageRouter } from "./send-message";
import {
  sendUserMessageByPhoneRouter,
  sendUserMessageRouter,
} from "./send-user-message";
import { transcribeVoiceRouter } from "./transcribe-voice";

export const telegramRouter = {
  conversation: getConversationRouter,
  messages: getMessagesRouter,
  sendMessage: sendMessageRouter,
  file: getFileUrlRouter,
  transcribeVoice: transcribeVoiceRouter,
  // Auth
  sendCode: sendCodeRouter,
  signIn: signInRouter,
  checkPassword: checkPasswordRouter,
  getSessions: getSessionsRouter,
  deleteSession: deleteSessionRouter,
  getSessionStatus: getSessionStatusRouter,
  clearAuthError: clearAuthErrorRouter,
  reauthorizeSession: reauthorizeSessionRouter,
  // User messages
  sendUserMessage: sendUserMessageRouter,
  sendUserMessageByPhone: sendUserMessageByPhoneRouter,
};
