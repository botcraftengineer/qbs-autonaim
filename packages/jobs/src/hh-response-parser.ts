import { env } from "@selectio/config";
import { runHHParser } from "./parsers/hh";

const userId = env.USER_ID || "system";
runHHParser(userId).catch(console.error);
