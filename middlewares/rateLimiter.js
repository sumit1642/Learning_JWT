// middlewares/rateLimiter.js
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 5,
	message: { error: "Too many login attempts, try later." },
	standardHeaders: true,
	legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	message: { error: "Too many refresh attempts, try later." },
	standardHeaders: true,
	legacyHeaders: false,
});
