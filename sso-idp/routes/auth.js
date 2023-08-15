const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const csrf = require("csurf");

const csrfProtection = csrf({
	cookie: {
		sameSite: "strict",
	},
})

const authRouter = (userStore) => {
	const router = express.Router();

	router.get("/login", csrfProtection, function (req, res, next) {
		res.render("login", {
			action: "/auth/login",
			error: req.query?.redirectUrl ? "" : "missing required `redirectUrl` query parameter",
			redirectUrl: req.query?.redirectUrl,
			csrfToken: req.csrfToken(),
		})
		return;
	});

	router.post("/login", csrfProtection, async (req, res, next) => {
		const { email, password, redirectUrl } = req.body;
		const user = userStore.get(email);

		if (!user) {
			res.render("login", {
				action: "/auth/login",
				error: "Looks like you need to register first",
				redirectUrl,
				csrfToken: req.csrfToken(),
			})

			return;
		}
		const validPassword = await bcrypt.compare(password, user.password.hash);
		if (!validPassword) {
			res.render("login", {
				action: "/auth/login",
				error: "Invalid password",
				redirectUrl,
				csrfToken: req.csrfToken(),
			})

			return;
		}

		const token = jwt.sign({ uid: user.uid }, process.env.JWT_SECRET_AUTHORIZATION, {
			expiresIn: "1d",
		});

		res.cookie("Authorization", token, {
			expires: new Date(new Date().setDate(new Date().getDate() + 1)),
			httpOnly: true,
			signed: true,
			secure: true,
			sameSite: 'strict',
		});

		res.redirect(redirectUrl);

		return;
	});

	router.get("/authenticate", (req, res) => {
		const authToken = req.signedCookies["Authorization"];
		const { redirectUrl } = req.query;
		if (!authToken) {
			return res.redirect(`/auth/login?redirectUrl=${redirectUrl}`);
		}

		try {
			const { uid } = jwt.verify(authToken, process.env.JWT_SECRET_AUTHORIZATION);
			const foundUser = [...userStore.values()].find(u => u.uid === uid);
			if (foundUser) {
				const indentificationToken = jwt.sign({ uid }, process.env.JWT_SECRET_IDENTIFICATION, {
					expiresIn: "10s",
				});

				res.cookie("IndentificationToken", indentificationToken, {
					expires: new Date(new Date().getTime() + 10 * 1000), // +10s
					httpOnly: true,
					signed: true,
					secure: true,
					sameSite: 'strict',
				});
				return res.redirect(
					`${redirectUrl}`
				);
			}
		} catch (err) {
			return res.redirect(`/auth/login?redirectUrl=${redirectUrl}`);
		}
	});


	router.get("/get-identity", (req, res, next) => {
		const { indentificationToken } = req.query;

		try {
			const { uid } = jwt.verify(indentificationToken, process.env.JWT_SECRET_IDENTIFICATION);
			const foundUser = [...userStore.values()].find(u => u.uid === uid);
			if (foundUser) {
				res.json({ uid });
			}
		} catch {
			res.status(401).send();
		}

		res.status(401).send();
	});

	return router;
};

module.exports = authRouter;
