import { netlifyToCf } from "../lib/cfAdapter.js";
import { handler } from "../lib/batch.handler.js";
export const onRequest = netlifyToCf(handler);
