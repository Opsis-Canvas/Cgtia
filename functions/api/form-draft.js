import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/form-draft.handler.js";
export const onRequest = netlifyToCf(handler);
