import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/exam-status.handler.js";
export const onRequest = netlifyToCf(handler);
