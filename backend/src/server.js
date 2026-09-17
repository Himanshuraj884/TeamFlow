require("dotenv").config();
const app = require("./app");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a random secret of at least 32 characters");
}

const requiredDbVars = ["DB_HOST", "DB_USER", "DB_NAME"];
const missing = requiredDbVars.filter(name => !process.env[name]);
if (missing.length) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(", ")}. Copy backend/.env.example to backend/.env and fill it in.`
  );
}

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`TeamFlow API listening on http://localhost:${port}`);
});
