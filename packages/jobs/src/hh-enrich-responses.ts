import { env } from "@selectio/config";
import { runEnricher } from "./parsers/hh/enricher";

const userId = env.USER_ID || "system";
runEnricher(userId).catch(console.error);
