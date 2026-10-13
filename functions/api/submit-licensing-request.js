import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/submit-licensing-request.handler.js";
export const onRequest = netlifyToCf(handler);
