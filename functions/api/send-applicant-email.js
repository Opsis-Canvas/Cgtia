import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/send-applicant-email.handler.js";
export const onRequest = netlifyToCf(handler);
