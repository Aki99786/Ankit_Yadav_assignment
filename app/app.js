const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.send("CI/CD Pipeline Working Successfully");
});

app.get("/health", (req, res) => {
    res.send("Healthy");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

module.exports = app;
