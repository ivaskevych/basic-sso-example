const express = require("express");

const jsonpRouter = () => {
    const router = express.Router();

    router.get("/", (req, res) => {
        const { callback } = req.query;

        const data = {
            some: "data",
            from: "jsonp endpoint"
        };

        res.contentType("application/javascript");
        res.send(`${callback}(${JSON.stringify(data)})`);
    });

    return router;
};

module.exports = jsonpRouter;
