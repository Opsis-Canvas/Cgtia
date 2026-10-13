import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/validate-student-invite.handler.js";
export const onRequest = netlifyToCf(handler);
