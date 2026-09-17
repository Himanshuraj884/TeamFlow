# TeamFlow — Full-Stack Issue & Task Management Platform

TeamFlow is a full-stack issue and task management application developed by Himanshu Raj during his Software Development Engineer (SDE) internship at FireLLama Technology Private Limited from 3 May 2026 to 3 July 2026.

The project was developed as part of the internship work and involved practical software-development activities including application development, feature implementation, debugging, testing, REST APIs, relational SQL/MySQL, authentication, and performance-conscious database design.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL 8.x
- Authentication: JWT + bcrypt
- API: REST/JSON
- Validation: express-validator
- Testing: Jest + Supertest
- Version control: Git/GitHub

## Features
- User registration and login
- JWT authentication
- Rate limiting on login/register to slow brute-force attempts
- Security response headers via Helmet
- Role-aware users (`user`, `admin`)
- Issue creation and viewing
- Full issue update/edit and deletion
- Status and priority management
- Assignee support
- Search and filtering, with LIKE-wildcard escaping on user input
- Paginated issue list (`page` / `pageSize`, returned with a total count)
- Dashboard statistics
- Server-side validation
- Parameterized SQL queries
- MySQL foreign keys and indexes
- Central error handling
- Automatic logout on the frontend when a session/token expires
- Health endpoint
- API-level tests
- Dockerfile + docker-compose for one-command local setup
- GitHub Actions CI running backend tests and the frontend build

## Architecture

React UI
   |
   | HTTP/JSON
   v
Express REST API
   |
   +--> Authentication middleware
   +--> Server-side validation
   +--> REST routes
   |
   v
MySQL

## Run locally

### 1. Database

Open MySQL Workbench and execute:

```sql
SOURCE /absolute/path/to/database/schema.sql;
```

This creates the `teamflow` database and its tables.

### 2. Backend configuration

Copy:

```text
backend/.env.example
```

to:

```text
backend/.env
```

Set your local MySQL password and a random JWT secret of at least 32 characters.

### 3. Backend

```bash
cd backend
npm install
npm test
npm start
```

API:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 4. Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL printed by the terminal, normally:

```text
http://localhost:5173
```

The frontend defaults to:

```text
http://localhost:5000/api
```

To use another API URL, create `frontend/.env` with:

```text
VITE_API_URL=http://localhost:5000/api
```

## Verification

The included backend tests cover:
- API health
- request validation
- authentication protection

A second suite (`issues.integration.test.js`) covers real create/list/update/delete behavior — including cross-user permission checks — against an actual MySQL database. It runs automatically in CI (which starts a MySQL service container) and locally whenever `DB_HOST` is set; otherwise it's skipped automatically instead of failing.

## Project Context

TeamFlow was developed by Himanshu Raj during his Software Development Engineer (SDE) internship at FireLLama Technology Private Limited from 3 May 2026 to 3 July 2026. The project provided hands-on experience across frontend development, backend REST APIs, database integration, authentication, testing, debugging, and software-development practices.
