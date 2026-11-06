import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/exam-submit.handler.js";
export const onRequest = netlifyToCf(handler);
