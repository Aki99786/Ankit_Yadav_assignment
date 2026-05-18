const express = require("express");
const { collectDefaultMetrics, register, Histogram } = require("prom-client");

// Collect default system metrics
collectDefaultMetrics({ register, timeout: 5000 });

const app = express();

const httpRequestDurationSeconds = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "path", "status_code", "status"],
    buckets: [0.1, 0.3, 0.5, 0.9, 1.5, 3, 5, 10]
});

function normalizePath(path) {
    let normalized = path.replace(/\/$/, "");
    if (!normalized) return "/";

    const staticKeywords = new Set([
        "api", "customers", "subscription", "add", "customer-technical", "config", "info", "detail",
        "list", "byCustomer", "status", "update", "namesbySearch", "invoices", "invoice-number",
        "routers", "router-queue", "bull-ui", "queue", "transaction-queue", "ryze-sorting-queue",
        "mikrotik-sq-queue", "get", "all", "auth", "me", "login"
    ]);

    const segments = normalized.split("/");
    const mappedSegments = segments.map(seg => {
        if (!seg) return "";
        if (staticKeywords.has(seg)) {
            return seg;
        }
        return "#val";
    });

    return mappedSegments.join("/");
}

// Request interceptor middleware to record metrics
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const durationInSeconds = (Date.now() - start) / 1000;

        if (req.path !== "/metrics") {
            const normalizedPath = normalizePath(req.path);
            const statusCodeStr = res.statusCode.toString();

            httpRequestDurationSeconds.labels(
                req.method,
                normalizedPath,
                statusCodeStr,
                statusCodeStr
            ).observe(durationInSeconds);
        }
    });
    next();
});

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
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

// Simulator Endpoint to generate real-time metrics for all the Grafana panels
app.get("/api/simulate", (req, res) => {
    const paths = [
        "/api/customers/123/subscription/add",
        "/api/customer-technical/config",
        "/api/auth/me",
        "/api/internets/456",
        "/api/internets/get/all",
        "/api/customer-technical/config/789",
        "/api/customer-technical/info/abc",
        "/api/customers/123/subscription/detail/999",
        "/api/customers/123/subscription/list/byCustomer",
        "/api/customers/status/update",
        "/api/customers/namesbySearch",
        "/api/invoices",
        "/api/invoices/invoice-number/INV-100",
        "/api/routers",
        "/api/routers/router-1",
        "/api/routers/list",
        "/api/customers",
        "/api/routers/router-1/router-queue",
        "/bull-ui/queue/mikrotik-sq-queue",
        "/bull-ui/queue/transaction-queue",
        "/bull-ui/queue/ryze-sorting-queue",
        "/bull-ui/api/queues",
        "/api/auth/login"
    ];

    const methods = ["GET", "POST", "PUT"];
    const statuses = [200, 201, 304, 400, 401, 404, 500, 503];

    // Simulate 50 random requests
    for (let i = 0; i < 50; i++) {
        const randomPath = paths[Math.floor(Math.random() * paths.length)];
        let randomMethod = methods[Math.floor(Math.random() * methods.length)];
        if (randomPath.includes("add") || randomPath.includes("config") || randomPath.includes("login") || randomPath.includes("update")) {
            randomMethod = "POST";
        }
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

        // Random latency between 10ms and 2000ms
        const latency = Math.floor(Math.random() * 2000);

        const normalized = normalizePath(randomPath);
        const statusStr = randomStatus.toString();

        httpRequestDurationSeconds.labels(randomMethod, normalized, statusStr, statusStr).observe(latency / 1000);
    }

    res.send("Simulated 50 requests across multiple dashboard endpoints successfully!");
});


app.listen(3000, () => {
    console.log("Server running on port 3000");
});

module.exports = app;
