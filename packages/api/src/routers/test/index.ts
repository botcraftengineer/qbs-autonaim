import { cleanupTestUser, setupTestUser } from "./setup";

export const testRouter = {
  setup: setupTestUser,
  cleanup: cleanupTestUser,
};
