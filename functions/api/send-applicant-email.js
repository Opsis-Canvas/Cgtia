const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/send-applicant-email.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
