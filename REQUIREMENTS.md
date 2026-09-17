# TeamFlow requirements mapping

This document describes the functional and engineering requirements implemented in TeamFlow.

## Functional requirements
1. Users can register and log in.
2. Authenticated users can create and view issues.
3. Issue records support title, description, priority, status, reporter and assignee.
4. Users can search and filter issues.
5. Authorized users can update and delete their issues; admins can manage all issues.
6. A dashboard exposes issue counts by status and critical priority.
7. The frontend communicates with the backend only through REST/JSON APIs.

## Engineering requirements
- React frontend components are separated from API/data access.
- Express routes handle REST endpoints and server-side validation.
- MySQL stores normalized relational data with foreign keys and indexes.
- Passwords are hashed with bcrypt; JWTs protect API routes.
- Unit/API-level tests cover health, validation and authentication middleware behavior; a separate integration suite covers full issue CRUD and permission checks against a real MySQL database.
- Parameterized SQL queries are used for user-controlled values.
- Central error handling returns controlled HTTP responses.
- Git/GitHub is used for version control and project development.

