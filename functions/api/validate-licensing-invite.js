import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/validate-licensing-invite.handler.js";
export const onRequest = netlifyToCf(handler);
