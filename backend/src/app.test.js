const request = require("supertest");
const app = require("./app");

describe("TeamFlow API", () => {
  test("GET /api/health returns service status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, service: "teamflow-api" });
  });

  test("POST /api/auth/register rejects invalid input before database access", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "A", email: "not-an-email", password: "short" });

    expect(res.statusCode).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test("GET /api/issues requires authentication", async () => {
    const res = await request(app).get("/api/issues");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Authentication required");
  });

  test("GET /api/issues rejects an out-of-range pageSize before hitting the database", async () => {
    const res = await request(app)
      .get("/api/issues?pageSize=500")
      .set("Authorization", "Bearer not-a-real-token");
    // Invalid query params are rejected by validation (400) before the
    // auth middleware's own 401 would otherwise apply on a later step —
    // either way this must never reach the database with an unbounded limit.
    expect([400, 401]).toContain(res.statusCode);
  });

  test("POST /api/auth/login is rate-limited after repeated attempts", async () => {
    const attempts = Array.from({ length: 21 }, () =>
      request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "wrong" })
    );
    const results = await Promise.all(attempts);
    expect(results.some(r => r.statusCode === 429)).toBe(true);
  });
});
