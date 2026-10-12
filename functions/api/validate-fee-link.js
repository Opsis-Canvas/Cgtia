const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/validate-fee-link.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
