// routes/posts.js
import express from "express";
import prisma from "../db.js"; // Use shared Prisma client
import { verifyToken } from "../middlewares/authVerifyToken.js";
import {
	validatePostInput,
	isOwner,
	validatePostUpdateInput,
} from "../middlewares/validation.js";

const router = express.Router();

router.get("/", async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;
	const skip = (page - 1) * limit;

	const posts = await prisma.post.findMany({
		skip,
		take: limit,
		include: { author: { select: { username: true } } },
		orderBy: { id: "desc" },
	});

	const total = await prisma.post.count();

	res.json({
		data: posts,
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	});
});

router.post("/", verifyToken, validatePostInput, async (req, res) => {
	const { title, content } = req.body;

	const user = await prisma.user.findUnique({
		where: { username: req.user.username },
	});

	const existingPost = await prisma.post.findFirst({
		where: {
			title,
			authorId: user.id,
		},
	});

	if (existingPost)
		return res.status(409).json({ error: "Post with same title exists" });

	const newPost = await prisma.post.create({
		data: {
			title,
			content,
			authorId: user.id,
		},
	});

	res.status(201).json(newPost);
});

router.put(
	"/:id",
	verifyToken,
	isOwner,
	validatePostUpdateInput,
	async (req, res) => {
		const postId = Number(req.params.id);
		const { title, content } = req.body;

		const post = await prisma.post.findFirst({
			where: {
				title,
				authorId: req.post.authorId,
				NOT: { id: postId },
			},
		});

		if (post)
			return res
				.status(409)
				.json({ error: "Post with same title exists" });

		const updatedPost = await prisma.post.update({
			where: { id: postId },
			data: { title, content },
		});

		res.json(updatedPost);
	},
);

router.delete("/:id", verifyToken, isOwner, async (req, res) => {
	const postId = Number(req.params.id);

	await prisma.post.delete({ where: { id: postId } });

	res.json({ message: "Post deleted successfully" });
});

export default router;
