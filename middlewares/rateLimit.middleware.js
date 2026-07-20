import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes 
	limit: 6, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	message: {
        success: false,
        message: "Too many attempts. Please try again after 15 minutes.",
    },
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // generous - real usage patterns need room
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
});

export { authLimiter , apiLimiter}