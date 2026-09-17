# TeamFlow API Quick Reference

Base URL: `http://localhost:5000/api`

## Public

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`

## Authenticated

Send:

```text
Authorization: Bearer <JWT>
```

### Issues

- `GET /issues`
- `POST /issues`
- `PATCH /issues/:id`
- `DELETE /issues/:id`

Query filters for `GET /issues`:
- `status=OPEN|IN_PROGRESS|RESOLVED|CLOSED`
- `priority=LOW|MEDIUM|HIGH|CRITICAL`
- `search=<text>`

### Other

- `GET /users`
- `GET /dashboard/stats`

## Permissions

- A normal user can update/delete issues they reported.
- An admin can update/delete all issues.
- Authentication is required for protected endpoints.
