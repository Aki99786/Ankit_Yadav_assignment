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

// CPU Intensive Task Endpoint
app.get("/heavy-cpu", (req, res) => {
    let result = 0;
    // Perform 20 million operations to spike CPU
    for (let i = 0; i < 20000000; i++) {
        result += Math.sqrt(Math.random() * 100);
    }
    res.send(`CPU Intensive Task Done! Result: ${result}`);
});

// Memory Intensive Task Endpoint
let memoryLeakArray = [];
app.get("/heavy-memory", (req, res) => {
    // Allocate ~50MB of memory by pushing heavy strings
    for (let i = 0; i < 100000; i++) {
        memoryLeakArray.push(`Heavy memory data item #${i} - ` + "X".repeat(50));
    }
    res.send(`Allocated more heap memory. Current array size: ${memoryLeakArray.length}`);
});

// Clear Memory Endpoint
app.get("/clear-memory", (req, res) => {
    memoryLeakArray = [];
    res.send("Memory cleared!");
});

// Dummy Products Endpoint
app.get("/products", (req, res) => {
    const dummyProducts = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: parseFloat((Math.random() * 100).toFixed(2)),
        category: i % 2 === 0 ? "Electronics" : "Clothing"
    }));
    res.json(dummyProducts);
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});

module.exports = app;
