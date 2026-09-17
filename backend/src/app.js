const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/auth");
const issueRoutes = require("./routes/issues");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(value => value.trim())
    : true
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "teamflow-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || (err.code === "ER_DUP_ENTRY" ? 409 : 500);
  res.status(status).json({
    message: status === 500 ? "Internal server error" : (
      status === 409 ? "A record with the same unique value already exists" : err.message
    )
  });
});

module.exports = app;
