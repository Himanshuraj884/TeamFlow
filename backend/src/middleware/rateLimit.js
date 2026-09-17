const rateLimit = require("express-rate-limit");

// Limits brute-force attempts against login/register. 20 requests per
// 15 minutes per IP is generous for a real user but slows down guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." }
});

module.exports = { authLimiter };
