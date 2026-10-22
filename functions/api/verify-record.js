import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/verify-record.handler.js";
export const onRequest = netlifyToCf(handler);
