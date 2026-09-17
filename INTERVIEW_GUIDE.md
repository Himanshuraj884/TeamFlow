# TeamFlow interview guide

## 60-second explanation
"During my FireLLama SDE internship, I developed TeamFlow as a full-stack issue and task management application. The frontend uses React, the backend is Node.js with Express, and the data layer is MySQL. I designed REST endpoints for authentication and issue CRUD, added JWT authentication and server-side validation, and built search, filtering, assignee support and a dashboard for issue statistics. I separated the UI, API, middleware and persistence layers, and added both unit-level tests for health/validation/auth and an integration suite that runs full CRUD and permission checks against a real MySQL database in CI."

## Architecture
React -> REST/JSON -> Express -> middleware/routes -> MySQL.

## Why REST?
"It gives the frontend a simple HTTP interface to resources such as issues, using standard methods like GET, POST, PATCH and DELETE."

## Why MySQL?
"The application has structured entities and relationships: users report issues and can be assigned issues. A relational database provides foreign keys, constraints and indexed queries."

## Why indexes?
"I added indexes on status, priority, assignee and created_at because those columns are likely to be used for filtering, assignment and sorting. Indexes can reduce lookup cost, while adding some storage and write overhead."

## Authentication
"Passwords are hashed with bcrypt and are never stored as plaintext. After login the server signs a short-lived JWT. Protected routes verify the token before allowing access. I also added Helmet to set standard security response headers."

## Validation
"I validate input on the server instead of trusting the browser. This catches malformed data before it reaches the database and keeps API behavior consistent."

## SQL safety
"User-controlled values are passed through parameterized MySQL queries rather than concatenated into SQL. Dynamic filtering only changes fixed SQL fragments from an allowlisted set of columns."

## Debugging approach
"I separate failures by layer: first reproduce the issue, then check the browser request, API status/body, server logs and database query. I fix the root cause and add or update a test where practical."

## Requirements-to-implementation
"I break a feature into UI, API and data requirements. For example, assignee support requires a UI selection, an API field with validation, and a foreign-key relationship in MySQL."

## If asked about scalability
"First I would measure. Then I would inspect query plans, indexes, pagination, connection-pool limits, caching for read-heavy endpoints, and service separation only if traffic and operational complexity justify it."

## What would you improve?
- More complete role-based authorization (currently just user/admin)
- Refresh-token strategy (access tokens currently expire after 2h with no refresh flow)
- Email verification and improved account-registration security
- Better UI component structure (App.jsx currently holds most of the frontend logic)
- Structured logs and metrics
- Database migrations instead of a single schema script
- Committed dependency lockfiles for fully reproducible installs

