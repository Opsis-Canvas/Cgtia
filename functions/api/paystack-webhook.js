import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/paystack-webhook.handler.js";
export const onRequest = netlifyToCf(handler);
