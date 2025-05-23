// services/tokenCleanup.js
import prisma from "../db.js";

export async function cleanupExpiredTokens() {
	try {
		// Fetch all refresh tokens from DB
		const tokens = await prisma.refreshToken.findMany();

		const now = Math.floor(Date.now() / 1000);

		// Filter expired tokens by decoding JWT expiry
		const expiredTokens = tokens.filter(({ token }) => {
			try {
				const payload = JSON.parse(
					Buffer.from(token.split(".")[1], "base64").toString("utf8"),
				);
				return payload.exp < now;
			} catch {
				// If token format invalid, consider expired to delete
				return true;
			}
		});

		if (expiredTokens.length > 0) {
			const idsToDelete = expiredTokens.map((t) => t.id);
			await prisma.refreshToken.deleteMany({
				where: { id: { in: idsToDelete } },
			});
			console.log(
				`Cleanup: Deleted ${idsToDelete.length} expired tokens`,
			);
		} else {
			console.log("Cleanup: No expired tokens found");
		}
	} catch (error) {
		console.error("Cleanup error:", error);
	}
}

// Run cleanup immediately, then every hour
export function startTokenCleanupScheduler() {
	cleanupExpiredTokens();

	setInterval(() => {
		cleanupExpiredTokens();
	}, 60 * 60 * 1000);
}
