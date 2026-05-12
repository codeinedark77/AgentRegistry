# AgentRegistry — REST API Contract Specification
> Base URL: `http://localhost:8000/api/v1`  
> Auth: All protected routes require `Authorization: Bearer <JWT>` header  
> Content-Type: `application/json` (except `/auth/token` which is `application/x-www-form-urlencoded`)

---

## Authentication

### POST `/auth/register`
Creates a new user account.

**Request Body**
```json
{
  "username": "john_doe",
  "password": "securepass123",
  "role": "standard"
}
```
**Response `201`**
```json
{
  "id": 1,
  "username": "john_doe",
  "role": "standard",
  "created_at": "2024-01-15T10:30:00Z"
}
```
**Errors:** `409 DUPLICATE_RESOURCE` if username already exists.

---

### POST `/auth/token`
OAuth2-compatible login. Returns a signed JWT.

**Request Body** (form-urlencoded)
```
username=john_doe&password=securepass123
```
**Response `200`**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```
**Errors:** `401 INVALID_CREDENTIALS`

---

### GET `/auth/me`
Returns the profile of the currently authenticated user.

**Response `200`**
```json
{
  "id": 1,
  "username": "john_doe",
  "role": "standard",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Workspaces

### POST `/workspaces/`
**CRUD: INSERT**  
Creates a new workspace owned by the authenticated user.

**Request Body**
```json
{
  "name": "Agri-Analytics Workspace",
  "description": "LLM agents for agricultural data analysis"
}
```
**Response `201`**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Agri-Analytics Workspace",
  "description": "LLM agents for agricultural data analysis"
}
```
**Constraints:** `UNIQUE(user_id, name)` — duplicate workspace names per user return `409`.

---

### GET `/workspaces/`
**CRUD: SELECT**  
Returns all workspaces owned by the authenticated user. Supports pagination.

**Query Parameters**
| Param  | Type | Default | Description     |
|--------|------|---------|-----------------|
| `skip` | int  | 0       | Offset (rows to skip) |
| `limit`| int  | 20      | Page size (max 100) |

**Response `200`** — Array of workspace objects.

---

### GET `/workspaces/{id}`
**CRUD: SELECT (single)**  
Returns a single workspace. Returns `403` if not owned by caller.

---

### PATCH `/workspaces/{id}`
**CRUD: UPDATE**  
Partial update. Only provided fields are changed.

**Request Body**
```json
{
  "name": "Renamed Workspace",
  "description": "Updated description"
}
```

---

### DELETE `/workspaces/{id}`
**CRUD: DELETE (Cascade)**  
Hard-deletes a workspace. Database `ON DELETE CASCADE` automatically removes:
- All `agent_configs` in the workspace
- All `task_queue` entries for those agents
- All `execution_logs` for those tasks

**Response `204 No Content`**

---

## Agent Configurations

### POST `/agents/`
**CRUD: INSERT**  
Creates a new agent configuration within a workspace.

**Request Body**
```json
{
  "workspace_id": 1,
  "model_name": "llama3",
  "system_prompt": "You are an expert agricultural data analyst...",
  "temperature": 0.7
}
```
**Response `201`**
```json
{
  "id": 1,
  "workspace_id": 1,
  "model_name": "llama3",
  "system_prompt": "You are an expert agricultural data analyst...",
  "temperature": 0.7
}
```
**Constraints:** `CHECK(temperature >= 0.0 AND temperature <= 2.0)` enforced at DB + Pydantic level.

---

### GET `/agents/`
**CRUD: SELECT**  
Returns all agent configs in a workspace. Paginated.

**Query Parameters**
| Param          | Type | Required | Description              |
|----------------|------|----------|--------------------------|
| `workspace_id` | int  | ✅       | Filter by workspace      |
| `skip`         | int  |          | Pagination offset        |
| `limit`        | int  |          | Page size (max 100)      |

**Response `200`** — Array of AgentConfig objects.

---

### GET `/agents/{id}`
**CRUD: SELECT (single)**  
Returns a single agent config.

---

### PATCH `/agents/{id}`
**CRUD: UPDATE**  
Partial update — updates only the provided fields.

**Request Body** (all fields optional)
```json
{
  "system_prompt": "You are now a risk assessment specialist...",
  "temperature": 0.3
}
```
**Response `200`** — Updated AgentConfig object.

---

### DELETE `/agents/{id}`
**CRUD: DELETE (Cascade)**  
Hard-deletes an agent and all dependent tasks + logs.

**Response `204 No Content`**

---

### POST `/agents/{id}/run`
**Ollama Integration**  
Creates a task and executes it synchronously against the local Ollama instance.

**Request Body**
```json
{
  "agent_id": 1,
  "prompt_text": "Analyse crop yield trends for Punjab region in 2023."
}
```

**Execution Workflow:**
```
INSERT task_queue (status=PENDING)
  → UPDATE status=RUNNING
    → POST Ollama /api/generate {model, prompt, stream:false}
      → INSERT execution_logs (response_text, execution_time_ms)
        → UPDATE task_queue status=COMPLETED
```

**Response `201`**
```json
{
  "id": 1,
  "task_id": 1,
  "response_text": "Crop yield analysis for Punjab 2023 shows...",
  "execution_time_ms": 4823,
  "timestamp": "2024-01-15T10:35:00Z"
}
```
**Errors:** `503 OLLAMA_UNAVAILABLE` if Ollama is not running.

---

## Analytics (Complex JOIN Endpoint)

### GET `/analytics/model-report`
**Complex 3-Table JOIN**  
Executes the following aggregation query and returns per-model performance statistics:

```sql
SELECT
    ac.model_name,
    COUNT(tq.id)                                             AS total_tasks,
    COUNT(tq.id) FILTER (WHERE tq.status = 'completed')     AS completed_tasks,
    COUNT(tq.id) FILTER (WHERE tq.status = 'failed')        AS failed_tasks,
    AVG(el.execution_time_ms)                               AS avg_execution_time_ms,
    MIN(el.execution_time_ms)                               AS min_execution_time_ms,
    MAX(el.execution_time_ms)                               AS max_execution_time_ms
FROM agent_configs ac
JOIN task_queue    tq  ON tq.agent_id  = ac.id
JOIN execution_logs el ON el.task_id   = tq.id
[WHERE ac.workspace_id = :workspace_id]   -- optional filter
GROUP BY ac.model_name
ORDER BY avg_execution_time_ms ASC;
```

**Query Parameters**
| Param          | Type | Required | Description                  |
|----------------|------|----------|------------------------------|
| `workspace_id` | int  |          | Scope to one workspace       |

**Response `200`**
```json
[
  {
    "model_name":           "llama3",
    "total_tasks":          42,
    "completed_tasks":      38,
    "failed_tasks":         4,
    "avg_execution_time_ms": 3241.7,
    "min_execution_time_ms": 892,
    "max_execution_time_ms": 12047
  },
  {
    "model_name":           "mistral",
    "total_tasks":          17,
    "completed_tasks":      17,
    "failed_tasks":         0,
    "avg_execution_time_ms": 2104.3,
    "min_execution_time_ms": 1102,
    "max_execution_time_ms": 5988
  }
]
```

---

## Unified Error Envelope

All errors return a consistent JSON envelope:

```json
{
  "error":  "NOT_FOUND",
  "detail": "AgentConfig with id=99 not found."
}
```

| HTTP Code | Error Key             | Trigger                                  |
|-----------|-----------------------|------------------------------------------|
| 400       | `VALIDATION_ERROR`    | Pydantic schema violation                |
| 401       | `INVALID_CREDENTIALS` | Bad login / expired token                |
| 403       | `PERMISSION_DENIED`   | Accessing another user's resources       |
| 404       | `NOT_FOUND`           | Resource does not exist                  |
| 409       | `DUPLICATE_RESOURCE`  | Unique constraint violation              |
| 503       | `OLLAMA_UNAVAILABLE`  | Local Ollama API unreachable             |
| 422       | `UNPROCESSABLE_ENTITY`| FastAPI request validation error         |