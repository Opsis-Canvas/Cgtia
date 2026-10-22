import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/submit-student-profile.handler.js";
export const onRequest = netlifyToCf(handler);
