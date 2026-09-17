import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

class AuthError extends Error {}

async function request(path, options = {}) {
  const token = localStorage.getItem("teamflow_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  if (res.status === 401) {
    throw new AuthError(data?.message || "Session expired, please log in again");
  }
  if (!res.ok) throw new Error(data?.message || "Request failed");
  return data;
}

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await request(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(form)
      });
      localStorage.setItem("teamflow_token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth">
      <section className="card auth-card">
        <h1>TeamFlow</h1>
        <p className="muted">Issue and task management platform</p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <input
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password (8+ characters)"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />
          <button type="submit">{mode === "login" ? "Login" : "Create account"}</button>
        </form>
        {error && <div className="error">{error}</div>}
        <button
          className="link"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Create an account" : "Back to login"}
        </button>
      </section>
    </main>
  );
}

function IssueForm({ users, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    assignee_id: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        assignee_id: form.assignee_id ? Number(form.assignee_id) : null
      };
      await request("/issues", { method: "POST", body: JSON.stringify(payload) });
      onCreated();
    } catch (err) {
      setError(err instanceof AuthError ? "Your session expired — please log in again." : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="card modal">
        <div className="modal-head">
          <h2>New issue</h2>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            minLength="3"
            maxLength="200"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            maxLength="5000"
          />
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
          </select>
          <select value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create issue"}</button>
        </form>
      </section>
    </div>
  );
}

function IssueEditForm({ issue, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: issue.title || "",
    description: issue.description || "",
    priority: issue.priority || "MEDIUM",
    status: issue.status || "OPEN",
    assignee_id: issue.assignee_id ? String(issue.assignee_id) : ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await request(`/issues/${issue.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          priority: form.priority,
          status: form.status,
          assignee_id: form.assignee_id ? Number(form.assignee_id) : null
        })
      });
      onSaved();
    } catch (err) {
      setError(err instanceof AuthError ? "Your session expired — please log in again." : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="card modal">
        <div className="modal-head">
          <h2>Edit issue</h2>
          <button type="button" className="secondary" onClick={onClose}>Close</button>
        </div>
        <form className="form-grid" onSubmit={submit}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            minLength="3"
            maxLength="200"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            maxLength="5000"
          />
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option>
          </select>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
          </select>
          <select value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</button>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({ status: "", priority: "", search: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  function logout() {
    localStorage.removeItem("teamflow_token");
    setUser(null);
  }

  async function load() {
    try {
      setError("");
      const query = new URLSearchParams(
        Object.entries({ ...filter, page, pageSize }).filter(([, v]) => v !== "" && v !== undefined)
      );
      const [issuePage, dashboard, userList] = await Promise.all([
        request(`/issues?${query}`),
        request("/dashboard/stats"),
        request("/users")
      ]);
      setIssues(issuePage.items);
      setTotal(issuePage.total);
      setStats(dashboard);
      setUsers(userList);
    } catch (err) {
      if (err instanceof AuthError) {
        logout();
        return;
      }
      setError(err.message);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user, filter.status, filter.priority, filter.search, page]);

  useEffect(() => {
    setPage(1);
  }, [filter.status, filter.priority, filter.search]);

  if (!user) return <Login onLogin={setUser} />;

  async function deleteIssue(issue) {
    if (!window.confirm(`Delete "${issue.title}"?`)) return;
    try {
      await request(`/issues/${issue.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      if (err instanceof AuthError) {
        logout();
        return;
      }
      setError(err.message);
    }
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>TeamFlow</h1>
          <span className="muted">Signed in as {user.name} · {user.role}</span>
        </div>
        <button className="secondary" onClick={logout}>Logout</button>
      </header>

      {error && <div className="error banner">{error}</div>}

      <section className="stats">
        {[
          ["Total", stats.total],
          ["Open", stats.open_count],
          ["In progress", stats.in_progress_count],
          ["Resolved", stats.resolved_count],
          ["Critical", stats.critical_count]
        ].map(([label, value]) => (
          <div className="card stat" key={label}>
            <strong>{value ?? 0}</strong><span>{label}</span>
          </div>
        ))}
      </section>

      <section className="toolbar card">
        <input
          placeholder="Search issues..."
          value={filter.search}
          onChange={e => setFilter({ ...filter, search: e.target.value })}
        />
        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All statuses</option>
          <option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>CLOSED</option>
        </select>
        <select value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })}>
          <option value="">All priorities</option>
          <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
        </select>
        <button onClick={() => setShowForm(true)}>+ New issue</button>
      </section>

      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th><th>Status</th><th>Priority</th>
              <th>Reporter</th><th>Assignee</th><th>Updated</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => (
              <tr key={issue.id}>
                <td><strong>{issue.title}</strong><br/><span className="muted">{issue.description}</span></td>
                <td><span className="badge">{issue.status}</span></td>
                <td>{issue.priority}</td>
                <td>{issue.reporter}</td>
                <td>{issue.assignee || "Unassigned"}</td>
                <td>{new Date(issue.updated_at).toLocaleString()}</td>
                <td className="actions">
                  {(issue.reporter_id === user.id || user.role === "admin") && (
                    <>
                      <button className="secondary" onClick={() => setEditingIssue(issue)}>Edit</button>
                      <button className="danger" onClick={() => deleteIssue(issue)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!issues.length && <tr><td colSpan="7" className="empty">No issues found.</td></tr>}
          </tbody>
        </table>
        <div className="pagination">
          <button
            className="secondary"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="muted">
            Page {page} of {Math.max(1, Math.ceil(total / pageSize))} ({total} issues)
          </span>
          <button
            className="secondary"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </section>

      {showForm && (
        <IssueForm
          users={users}
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load(); }}
        />
      )}
      {editingIssue && (
        <IssueEditForm
          issue={editingIssue}
          users={users}
          onClose={() => setEditingIssue(null)}
          onSaved={() => { setEditingIssue(null); load(); }}
        />
      )}
    </main>
  );
}

export default App;
