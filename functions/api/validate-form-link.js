import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/validate-form-link.handler.js";
export const onRequest = netlifyToCf(handler);
