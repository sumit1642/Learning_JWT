// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import prisma from "../db.js"; // shared Prisma client

const JWT_SECRET = process.env.JWT_SECRET;

export async function verifyToken(req, res, next) {
	const authHeader = req.headers.authorization;
	console.log("Auth header:", authHeader); 
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Access token missing" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, JWT_SECRET);

		const user = await prisma.user.findUnique({
			where: { username: decoded.username },
		});
		if (!user) return res.status(401).json({ error: "User not found" });

		req.user = decoded;
		next();
	} catch {
		return res.status(403).json({ error: "Invalid or expired token" });
	}
}
