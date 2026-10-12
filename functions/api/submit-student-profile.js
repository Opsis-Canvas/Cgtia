const { netlifyToCf } = require("../lib/cfAdapter");
const mod = require("../lib/submit-student-profile.handler");
const handler = mod.handler || mod;
exports.onRequest = netlifyToCf(handler);
