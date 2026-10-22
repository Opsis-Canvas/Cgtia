import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/confirm-transfer.handler.js";
export const onRequest = netlifyToCf(handler);
