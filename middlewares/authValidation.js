// middlewares/authValidation.js
export function validateUserInput(req, res, next) {
	const { username, password } = req.body;
	if (
		typeof username !== "string" ||
		username.trim().length < 3 ||
		typeof password !== "string" ||
		password.length < 6
	) {
		return res.status(400).json({
			error: "Invalid input: username min 3 chars, password min 6 chars",
		});
	}
	req.body.username = username.trim();
	next();
}
