import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/get-open-form.handler.js";
export const onRequest = netlifyToCf(handler);
