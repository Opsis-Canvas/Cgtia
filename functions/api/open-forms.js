import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/open-forms.handler.js";
export const onRequest = netlifyToCf(handler);
