import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/exam-link.handler.js";
export const onRequest = netlifyToCf(handler);
