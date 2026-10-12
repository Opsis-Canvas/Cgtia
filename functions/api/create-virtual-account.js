const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/create-virtual-account.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
