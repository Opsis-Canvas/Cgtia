import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/submit-licensing-packet.handler.js";
export const onRequest = netlifyToCf(handler);
