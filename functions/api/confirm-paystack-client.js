import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/confirm-paystack-client.handler.js";
export const onRequest = netlifyToCf(handler);
