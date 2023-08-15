const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const path = require("path");

require("dotenv").config();

const authRouter = require("./routes/auth");
const jsonpRouter = require("./routes/jsonp");
const app = express();
const port = process.env.PORT || 3001;

app.engine('pug', require('pug').__express);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser(process.env.COOKIE_SECRET));

(async () => {
  /* mock DB store */
  const userStore = new Map();
  const hash = await bcrypt.hash(process.env.SAMPLE_USER_PASSWORD, 10);

  const userSample = {
    uid: "75a14c71-5d3a-4749-87cb-f15cc840575d",
    email: "sample@email.com",
    password: {
      hash,
    },
  };

  userStore.set(userSample.email, userSample);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.use("/auth", authRouter(userStore));
  app.use("/jsonp", jsonpRouter());

  app.listen(port, () => {
    console.log(`Identity provider server listening on http://localhost:${port}`);
  });
})();
