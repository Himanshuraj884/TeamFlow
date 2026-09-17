const router = require("express").Router();
const { body, query, validationResult } = require("express-validator");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const allowedStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const issueId = [
  query("status").optional().isIn(allowedStatuses),
  query("priority").optional().isIn(allowedPriorities),
  query("search").optional().isString().trim().isLength({ max: 100 }),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 100 }).toInt()
];

const createIssueValidation = [
  body("title").trim().isLength({ min: 3, max: 200 }),
  body("description").optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body("priority").optional().isIn(allowedPriorities),
  body("assignee_id").optional({ nullable: true }).isInt({ min: 1 })
];

const updateIssueValidation = [
  body("title").optional().trim().isLength({ min: 3, max: 200 }),
  body("description").optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body("priority").optional().isIn(allowedPriorities),
  body("status").optional().isIn(allowedStatuses),
  body("assignee_id").optional({ nullable: true }).isInt({ min: 1 })
];

function sendValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true;
  }
  return false;
}

async function assigneeExists(assigneeId) {
  if (assigneeId === null || assigneeId === undefined) return true;
  const [rows] = await pool.query("SELECT id FROM users WHERE id = ?", [assigneeId]);
  return rows.length > 0;
}

router.get("/", requireAuth, issueId, async (req, res, next) => {
  try {
    if (sendValidationErrors(req, res)) return;

    const { status, priority, search } = req.query;
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 20;
    const clauses = [];
    const params = [];

    if (status) {
      clauses.push("i.status = ?");
      params.push(status);
    }
    if (priority) {
      clauses.push("i.priority = ?");
      params.push(priority);
    }
    if (search) {
      // Escape LIKE wildcards in user input so a literal % or _ in a search
      // term is matched literally instead of behaving as a wildcard.
      const escaped = search.replace(/[\\%_]/g, m => `\\${m}`);
      clauses.push("(i.title LIKE ? ESCAPE '\\\\' OR i.description LIKE ? ESCAPE '\\\\')");
      params.push(`%${escaped}%`, `%${escaped}%`);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM issues i ${where}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT i.id, i.title, i.description, i.priority, i.status,
              i.reporter_id, i.assignee_id, i.created_at, i.updated_at,
              u.name AS reporter, a.name AS assignee
       FROM issues i
       JOIN users u ON u.id = i.reporter_id
       LEFT JOIN users a ON a.id = i.assignee_id
       ${where}
       ORDER BY i.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    res.json({ items: rows, total: countRows[0].total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, createIssueValidation, async (req, res, next) => {
  try {
    if (sendValidationErrors(req, res)) return;

    const { title, description = "", priority = "MEDIUM", assignee_id = null } = req.body;

    if (!(await assigneeExists(assignee_id))) {
      return res.status(400).json({ message: "Assignee does not exist" });
    }

    const [result] = await pool.query(
      `INSERT INTO issues (title, description, priority, reporter_id, assignee_id)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, priority, req.user.id, assignee_id]
    );

    const [rows] = await pool.query(
      "SELECT * FROM issues WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, updateIssueValidation, async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ message: "Issue id must be an integer" });
    }
    if (sendValidationErrors(req, res)) return;

    const [existing] = await pool.query(
      "SELECT reporter_id FROM issues WHERE id = ?",
      [req.params.id]
    );

    if (!existing.length) return res.status(404).json({ message: "Issue not found" });

    if (existing[0].reporter_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this issue" });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "assignee_id")) {
      if (!(await assigneeExists(req.body.assignee_id))) {
        return res.status(400).json({ message: "Assignee does not exist" });
      }
    }

    const fields = [];
    const params = [];
    for (const key of ["title", "description", "priority", "status", "assignee_id"]) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        fields.push(`${key} = ?`);
        params.push(req.body[key]);
      }
    }

    if (!fields.length) return res.status(400).json({ message: "No fields to update" });

    params.push(req.params.id);
    await pool.query(
      `UPDATE issues SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    const [rows] = await pool.query(
      "SELECT * FROM issues WHERE id = ?",
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(400).json({ message: "Issue id must be an integer" });
    }

    const [existing] = await pool.query(
      "SELECT reporter_id FROM issues WHERE id = ?",
      [req.params.id]
    );

    if (!existing.length) return res.status(404).json({ message: "Issue not found" });

    if (existing[0].reporter_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this issue" });
    }

    await pool.query("DELETE FROM issues WHERE id = ?", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
