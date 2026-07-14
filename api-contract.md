# StudentOS — API Contract (shared reference)

Both the frontend and the Antigravity backend must conform to this contract exactly.
If either side needs a change, update this file first, then update both builds to match.

Base URL (dev): `http://localhost:8000/api/v1`
Auth: Bearer JWT in `Authorization: Bearer <access_token>` header on all endpoints except `/auth/register` and `/auth/login`.

All error responses: `{ "detail": "human readable message" }` with standard HTTP status codes.

---

## Auth

| Method | Path           | Body                        | Response                                |
| ------ | -------------- | --------------------------- | --------------------------------------- |
| POST   | /auth/register | `{ name, email, password }` | `{ access_token, refresh_token, user }` |
| POST   | /auth/login    | `{ email, password }`       | `{ access_token, refresh_token, user }` |
| POST   | /auth/refresh  | `{ refresh_token }`         | `{ access_token }`                      |
| GET    | /auth/me       | —                           | `{ id, name, email }`                   |

## Subjects

| Method | Path           | Body                       | Response                      |
| ------ | -------------- | -------------------------- | ----------------------------- |
| GET    | /subjects      | —                          | `[{ id, name, code, color }]` |
| POST   | /subjects      | `{ name, code, color }`    | `{ id, name, code, color }`   |
| PUT    | /subjects/{id} | `{ name?, code?, color? }` | `{ id, name, code, color }`   |
| DELETE | /subjects/{id} | —                          | `204`                         |

## Timetable

| Method | Path            | Body                                                          | Response                                                            |
| ------ | --------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | /timetable      | —                                                             | `[{ id, subject_id, day_of_week, start_time, end_time, location }]` |
| POST   | /timetable      | `{ subject_id, day_of_week, start_time, end_time, location }` | entry object                                                        |
| PUT    | /timetable/{id} | partial fields                                                | entry object                                                        |
| DELETE | /timetable/{id} | —                                                             | `204`                                                               |

`day_of_week`: 0=Mon..6=Sun. `start_time`/`end_time`: `"HH:MM"` 24h strings.
Backend returns `409` on overlap conflict for the same subject owner: `{ detail: "Time conflict with <entry title>" }`.

## Notes

| Method | Path               | Body                             | Response                                                          |
| ------ | ------------------ | -------------------------------- | ----------------------------------------------------------------- |
| GET    | /notes?subject_id= | —                                | `[{ id, subject_id, title, updated_at }]` (list view, no content) |
| GET    | /notes/{id}        | —                                | `{ id, subject_id, title, content, created_at, updated_at }`      |
| POST   | /notes             | `{ subject_id, title, content }` | full note object                                                  |
| PUT    | /notes/{id}        | `{ title?, content? }`           | full note object (re-triggers embedding)                          |
| DELETE | /notes/{id}        | —                                | `204`                                                             |

## Assignments

| Method | Path                             | Body                                                     | Response                                                               |
| ------ | -------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| GET    | /assignments?status=&subject_id= | —                                                        | `[{ id, subject_id, title, description, due_date, status, priority }]` |
| POST   | /assignments                     | `{ subject_id, title, description, due_date, priority }` | assignment object (`status` defaults `"todo"`)                         |
| PUT    | /assignments/{id}                | partial fields incl. `status`                            | assignment object                                                      |
| DELETE | /assignments/{id}                | —                                                        | `204`                                                                  |

`status` enum: `"todo" | "in_progress" | "done"`. `priority` enum: `"low" | "medium" | "high"`.

## Attendance

| Method | Path                    | Body                           | Response                                                |
| ------ | ----------------------- | ------------------------------ | ------------------------------------------------------- |
| GET    | /attendance?subject_id= | —                              | `[{ id, subject_id, date, status }]`                    |
| POST   | /attendance             | `{ subject_id, date, status }` | attendance record                                       |
| GET    | /attendance/summary     | —                              | `[{ subject_id, percentage, total_classes, attended }]` |

`status` enum: `"present" | "absent" | "excused"`.

## AI Assistant

| Method | Path                 | Body                       | Response                                                       |
| ------ | -------------------- | -------------------------- | -------------------------------------------------------------- |
| POST   | /assistant/chat      | `{ session_id?, message }` | `{ session_id, answer, citations: [{ note_id, note_title }] }` |
| POST   | /assistant/summarize | `{ subject_id }`           | `{ summary }`                                                  |
| POST   | /assistant/quiz      | `{ subject_id, topic? }`   | `{ questions: [{ question, options?, answer }] }`              |

## Analytics

| Method | Path                       | Body | Response                                                                                           |
| ------ | -------------------------- | ---- | -------------------------------------------------------------------------------------------------- |
| GET    | /analytics/attendance-risk | —    | `[{ subject_id, risk_score, reason }]`                                                             |
| GET    | /analytics/study-patterns  | —    | `{ notes_per_subject: [...], assignment_completion_rate: [...], note_frequency_over_time: [...] }` |

---

## Notes for integration

- Frontend stores `access_token`/`refresh_token` and sends the access token on every request; on `401`, call `/auth/refresh` once, then retry.
- Backend must enable CORS for the preview domain and `localhost` dev origins (configurable via `ALLOWED_ORIGINS` env var).
- Dates: ISO 8601 strings throughout (`"2026-07-11"` for dates, `"2026-07-11T14:30:00Z"` for timestamps).
