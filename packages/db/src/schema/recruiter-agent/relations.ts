/**
 * Relations для recruiter-agent схем
 */

import { relations } from "drizzle-orm";
import { agentFeedback } from "./agent-feedback";

/**
 * Relations для agentFeedback
 * Пока без связей с другими таблицами, но готово для расширения
 */
export const agentFeedbackRelations = relations(agentFeedback, () => ({}));
