const request = require("supertest");

// These tests exercise real CRUD behavior against an actual MySQL database
// (unlike app.test.js, which only covers validation/auth logic in isolation).
// They run only when DB_HOST is configured, so the suite still passes in
// environments with no database available (e.g. a laptop with no MySQL
// running) instead of failing with a connection error.
const hasDb = Boolean(process.env.DB_HOST);
const describeIfDb = hasDb ? describe : describe.skip;

describeIfDb("TeamFlow API — issue CRUD (integration)", () => {
  let app;
  let pool;
  let token;
  let userId;

  const email = `test.${Date.now()}@example.com`;
  const password = "correct horse battery";

  beforeAll(async () => {
    app = require("./app");
    pool = require("./db");

    const registerRes = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password });

    token = registerRes.body.token;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    if (userId) {
      await pool.query("DELETE FROM issues WHERE reporter_id = ?", [userId]);
      await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    }
    await pool.end();
  });

  test("creates an issue", async () => {
    const res = await request(app)
      .post("/api/issues")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Integration test issue", priority: "HIGH" });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Integration test issue");
    expect(res.body.status).toBe("OPEN");
  });

  test("lists issues with the created issue included", async () => {
    const res = await request(app)
      .get("/api/issues?search=Integration test issue")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].title).toBe("Integration test issue");
  });

  test("updates an issue's status", async () => {
    const created = await request(app)
      .post("/api/issues")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Issue to update" });

    const res = await request(app)
      .patch(`/api/issues/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "IN_PROGRESS" });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("IN_PROGRESS");
  });

  test("rejects updates from a user who did not report the issue", async () => {
    const otherEmail = `other.${Date.now()}@example.com`;
    const otherRes = await request(app)
      .post("/api/auth/register")
      .send({ name: "Other User", email: otherEmail, password });
    const otherToken = otherRes.body.token;

    const created = await request(app)
      .post("/api/issues")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Owned by first user" });

    const res = await request(app)
      .patch(`/api/issues/${created.body.id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ status: "CLOSED" });

    expect(res.statusCode).toBe(403);

    await pool.query("DELETE FROM issues WHERE reporter_id = ?", [otherRes.body.user.id]);
    await pool.query("DELETE FROM users WHERE id = ?", [otherRes.body.user.id]);
  });

  test("deletes an issue", async () => {
    const created = await request(app)
      .post("/api/issues")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Issue to delete" });

    const del = await request(app)
      .delete(`/api/issues/${created.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(del.statusCode).toBe(204);

    const list = await request(app)
      .get("/api/issues?search=Issue to delete")
      .set("Authorization", `Bearer ${token}`);

    expect(list.body.items.length).toBe(0);
  });
});
