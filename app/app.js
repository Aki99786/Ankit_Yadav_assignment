const express = require("express");
const client = require("prom-client");

// Collect default system metrics (CPU, memory, etc.)
client.collectDefaultMetrics();

const app = express();

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
});


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
