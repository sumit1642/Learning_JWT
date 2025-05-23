// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import prisma from "../db.js"; // shared Prisma client

import { validateUserInput } from "../middlewares/authValidation.js";
import {
	generateAccessToken,
	generateRefreshToken,
} from "../utils/tokenUtils.js";
import { loginLimiter, refreshLimiter } from "../middlewares/rateLimiter.js";
import { refreshTokenHandler } from "../middlewares/refreshTokenHandler.js";

dotenv.config();
const router = express.Router();
const isProd = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	console.error("FATAL: Missing JWT_SECRET");
	process.exit(1);
}

// REGISTER
router.post("/register", validateUserInput, async (req, res) => {
	try {
		const { username, password } = req.body;
		const userExists = await prisma.user.findUnique({
			where: { username },
		});

		if (userExists)
			return res.status(409).json({ error: "User already exists" });

		const passwordHash = await bcrypt.hash(password, 12);
		await prisma.user.create({ data: { username, passwordHash } });

		res.status(201).json({ message: "User registered successfully" });
	} catch {
		res.status(500).json({ error: "Internal server error" });
	}
});

// LOGIN
router.post("/login", loginLimiter, validateUserInput, async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await prisma.user.findUnique({ where: { username } });

		if (!user)
			return res.status(401).json({ error: "Invalid credentials" });

		const validPassword = await bcrypt.compare(password, user.passwordHash);
		if (!validPassword)
			return res.status(401).json({ error: "Invalid credentials" });

		const accessToken = generateAccessToken(user);
		const refreshToken = generateRefreshToken(user);

		await prisma.refreshToken.create({
			data: { token: refreshToken, userId: user.id },
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: isProd,
			sameSite: "strict",
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		res.json({ accessToken });
	} catch {
		res.status(500).json({ error: "Internal server error" });
	}
});

// REFRESH TOKEN
router.post("/refresh", refreshLimiter, refreshTokenHandler);

// LOGOUT
router.post("/logout", async (req, res) => {
	try {
		const token = req.cookies.refreshToken;
		if (token) await prisma.refreshToken.deleteMany({ where: { token } });

		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: isProd,
			sameSite: "strict",
		});
		res.json({ message: "Logged out successfully" });
	} catch {
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
