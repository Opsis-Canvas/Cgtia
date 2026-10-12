const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/submit-licensing-packet.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
