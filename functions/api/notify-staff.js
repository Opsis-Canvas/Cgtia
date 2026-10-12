const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/notify-staff.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
