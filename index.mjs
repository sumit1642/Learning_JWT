// index.mjs
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import authRouter from "./routes/auth.js";
import postsRouter from "./routes/posts.js";
import prisma from "./db.js"; // shared Prisma client

import { startTokenCleanupScheduler } from "./services/tokenCleanup.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
	res.send("API is up and running");
});

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);

app.use((req, res) => {
	res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Internal Server Error" });
});

// Start the token cleanup scheduler on server start
startTokenCleanupScheduler();

// Graceful shutdown handler
async function shutdown() {
	console.log("Shutting down server gracefully...");
	await prisma.$disconnect();
	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(port, () => {
	console.log(
		`Server running on http://localhost:${port} in ${process.env.NODE_ENV} mode`,
	);
});
