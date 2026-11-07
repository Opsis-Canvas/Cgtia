import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/exam-start.handler.js";
export const onRequest = netlifyToCf(handler);
