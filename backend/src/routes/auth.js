const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
const { authLimiter } = require("../middleware/rateLimit");

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().isLength({ min: 2, max: 100 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8, max: 100 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { name, email, password } = req.body;
      const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length) return res.status(409).json({ message: "Email already registered" });

      const hash = await bcrypt.hash(password, 12);
      const [result] = await pool.query(
        "INSERT INTO users (name,email,password_hash) VALUES (?,?,?)",
        [name, email, hash]
      );

      const token = jwt.sign(
        { id: result.insertId, email, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.status(201).json({
        token,
        user: { id: result.insertId, name, email, role: "user" }
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  authLimiter,
  [body("email").isEmail().normalizeEmail(), body("password").isString()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const [rows] = await pool.query(
        "SELECT id,name,email,password_hash,role FROM users WHERE email = ?",
        [req.body.email]
      );

      if (!rows.length || !(await bcrypt.compare(req.body.password, rows[0].password_hash))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const user = {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        role: rows[0].role
      };

      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "2h" });
      res.json({ token, user });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
