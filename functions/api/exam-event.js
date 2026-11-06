import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/exam-event.handler.js";
export const onRequest = netlifyToCf(handler);
