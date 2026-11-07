import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/submit-form.handler.js";
export const onRequest = netlifyToCf(handler);
