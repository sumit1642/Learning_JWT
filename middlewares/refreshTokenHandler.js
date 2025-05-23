// middlewares/refreshTokenHandler.js
import jwt from "jsonwebtoken";
import prisma from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === "production";

export async function refreshTokenHandler(req, res) {
	try {
		const token = req.cookies.refreshToken;
		if (!token)
			return res.status(401).json({ error: "No refresh token found" });

		const storedToken = await prisma.refreshToken.findUnique({
			where: { token },
			include: { user: true },
		});
		if (!storedToken)
			return res.status(403).json({ error: "Invalid refresh token" });

		const payload = jwt.verify(token, JWT_SECRET);
		if (!payload || payload.userId !== storedToken.userId)
			return res.status(403).json({ error: "Invalid refresh token" });

		await prisma.refreshToken.delete({ where: { id: storedToken.id } });

		const user = storedToken.user;
		const newAccessToken = jwt.sign(
			{ userId: user.id, username: user.username },
			JWT_SECRET,
			{ expiresIn: "15m" },
		);
		const newRefreshToken = jwt.sign(
			{ userId: user.id, username: user.username },
			JWT_SECRET,
			{ expiresIn: "30d" },
		);

		await prisma.refreshToken.create({
			data: { token: newRefreshToken, userId: user.id },
		});

		res.cookie("refreshToken", newRefreshToken, {
			httpOnly: true,
			secure: isProd,
			sameSite: "strict",
			maxAge: 30 * 24 * 60 * 60 * 1000,
		});

		res.json({ accessToken: newAccessToken });
	} catch {
		return res
			.status(403)
			.json({ error: "Invalid or expired refresh token" });
	}
}
