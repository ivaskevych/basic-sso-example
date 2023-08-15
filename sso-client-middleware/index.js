const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const IDP_SERVER = "http://localhost:3001";
const AUTH_SERVER = `${IDP_SERVER}/auth`;

require("dotenv").config();

app.use("/public", express.static(path.join(__dirname, 'public')));

app.engine('pug', require('pug').__express);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

app.use(cookieParser(process.env.COOKIE_SECRET));

const authMiddleware = async (req, res, next) => {
  const indentificationToken = req.signedCookies["IndentificationToken"];
  const { href: target } = new URL(
    req.originalUrl || "",
    `http://${req.headers.host}`
  );

  if (indentificationToken) {
    const fetchRes = await fetch(
      `${AUTH_SERVER}/get-identity?indentificationToken=${indentificationToken}`
    );

    if (fetchRes.status === 200) {
      const { uid } = await fetchRes.json();
      req.uid = uid;
      return next();
    }
  }

  res.redirect(`${AUTH_SERVER}/authenticate?redirectUrl=${target}`);
  return;
};

app.use(authMiddleware);

app.get("/", (req, res) => {
  res.render('home', {
    uid: req.uid,
  });
});

app.get("/jsonp", (req, res) => {
  res.render('jsonp', {
    jsonpPath: `${IDP_SERVER}/jsonp?callback=myJsonpFunction`
  });
});

app.listen(port, () => {
  console.log(`Client server listening on http://localhost:${port}`);
});
