import { createTRPCRouter } from "../../trpc";
import { addComment } from "./add-comment";
import { inviteCandidate } from "./invite";
import { list } from "./list";
import { listActivities } from "./list-activities";
import { listComments } from "./list-comments";
import { listMessages } from "./list-messages";
import { refreshResume } from "./refresh-resume";
import { rejectCandidate } from "./reject";
import { sendGreeting } from "./send-greeting";
import { sendOffer } from "./send-offer";
import { updateSalaryExpectations } from "./update-salary";
import { updateStage } from "./update-stage";

export const candidatesRouter = createTRPCRouter({
  list,
  updateStage,
  updateSalaryExpectations,
  listActivities,
  listMessages,
  listComments,
  addComment,
  sendOffer,
  sendGreeting,
  inviteCandidate,
  rejectCandidate,
  refreshResume,
});
