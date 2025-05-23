// utils/tokenUtils.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "30d";

export function generateAccessToken(user) {
	return jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
		expiresIn: ACCESS_TOKEN_EXPIRES_IN,
	});
}

export function generateRefreshToken(user) {
	return jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
		expiresIn: REFRESH_TOKEN_EXPIRES_IN,
	});
}
