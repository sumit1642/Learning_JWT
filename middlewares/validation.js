// middlewares/validation.js
import prisma from "../db.js";

export function validatePostInput(req, res, next) {
	const { title, content } = req.body;

	if (
		typeof title !== "string" ||
		title.trim().length < 3 ||
		typeof content !== "string" ||
		content.trim().length < 10
	) {
		return res.status(400).json({
			error: "Title must be ≥ 3 chars, content ≥ 10 chars",
		});
	}

	req.body.title = title.trim();
	req.body.content = content.trim();
	next();
}

export function validatePostUpdateInput(req, res, next) {
	const { title, content } = req.body;

	if (
		(title && typeof title !== "string") ||
		(content && typeof content !== "string")
	) {
		return res.status(400).json({
			error: "Invalid input: title/content must be strings",
		});
	}

	if (title && title.trim().length < 3) {
		return res.status(400).json({ error: "Title too short" });
	}
	if (content && content.trim().length < 10) {
		return res.status(400).json({ error: "Content too short" });
	}

	if (title) req.body.title = title.trim();
	if (content) req.body.content = content.trim();

	next();
}

export async function isOwner(req, res, next) {
	const postId = Number(req.params.id);
	if (isNaN(postId))
		return res.status(400).json({ error: "Invalid post ID" });

	const post = await prisma.post.findUnique({ where: { id: postId } });

	if (!post) return res.status(404).json({ error: "Post not found" });

	const user = await prisma.user.findUnique({
		where: { username: req.user.username },
	});

	if (!user || post.authorId !== user.id) {
		return res.status(403).json({ error: "Not authorized" });
	}

	req.post = post;
	next();
}
