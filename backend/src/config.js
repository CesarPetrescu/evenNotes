require('dotenv').config();

const DEFAULT_PORT = 3212;
const REQUESTED_PORT = Number(process.env.PORT) || DEFAULT_PORT;
const FALLBACK_PORTS = [3212, 3213, 3002, 4321];

module.exports = { DEFAULT_PORT, REQUESTED_PORT, FALLBACK_PORTS };
