const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/confirm-paystack-client.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
