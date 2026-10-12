const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/validate-licensing-invite.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
