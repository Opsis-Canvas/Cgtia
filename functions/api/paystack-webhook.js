import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { netlifyToCf } = require("../lib/cfAdapter.cjs");
const mod = require("../lib/paystack-webhook.handler.js");
const handler = mod.handler || mod;
export const onRequest = netlifyToCf(handler);
