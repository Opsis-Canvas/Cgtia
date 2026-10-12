const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/paystack-webhook.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
