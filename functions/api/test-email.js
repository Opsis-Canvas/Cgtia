import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/test-email.handler.js";
export const onRequest = netlifyToCf(handler);
