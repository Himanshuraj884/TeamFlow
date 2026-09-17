const router = require("express").Router();
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id,name,email,role FROM users ORDER BY name ASC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
