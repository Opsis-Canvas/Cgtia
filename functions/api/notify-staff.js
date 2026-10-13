import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/notify-staff.handler.js";
export const onRequest = netlifyToCf(handler);
