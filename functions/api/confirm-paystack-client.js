import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { netlifyToCf } = require("../lib/cfAdapter.cjs");
const mod = require("../lib/confirm-paystack-client.handler.js");
const handler = mod.handler || mod;
export const onRequest = netlifyToCf(handler);
