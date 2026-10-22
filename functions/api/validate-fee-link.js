import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/validate-fee-link.handler.js";
export const onRequest = netlifyToCf(handler);
