import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/push-send.handler.js";
export const onRequest = netlifyToCf(handler);
