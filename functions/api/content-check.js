import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/content-check.handler.js";
export const onRequest = netlifyToCf(handler);
