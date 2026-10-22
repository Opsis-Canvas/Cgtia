import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/create-virtual-account.handler.js";
export const onRequest = netlifyToCf(handler);
