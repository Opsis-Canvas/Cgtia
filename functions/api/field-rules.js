import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/field-rules.handler.js";
export const onRequest = netlifyToCf(handler);
