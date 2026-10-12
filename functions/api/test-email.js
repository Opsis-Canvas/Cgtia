const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/test-email.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
