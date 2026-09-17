const router = require("express").Router();
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

router.get("/stats", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(status = 'OPEN'), 0) AS open_count,
        COALESCE(SUM(status = 'IN_PROGRESS'), 0) AS in_progress_count,
        COALESCE(SUM(status = 'RESOLVED'), 0) AS resolved_count,
        COALESCE(SUM(status = 'CLOSED'), 0) AS closed_count,
        COALESCE(SUM(priority = 'CRITICAL'), 0) AS critical_count
      FROM issues
    `);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
