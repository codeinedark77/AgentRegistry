━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AGENTREGISTRY — 5-MINUTE ACADEMIC DEFENSE SCRIPT
  "The Killer Demo"
  
  Audience:    University professors / academic evaluators
  Duration:    5 minutes (strictly timed — practice until smooth)
  Prepared by: Principal Software Architect
  Format:      [STAGE DIRECTION] followed by exact spoken words in quotes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


════════════════════════════════════════════════════════════════════════════════
  PRE-DEMO CHECKLIST  (Complete 10 minutes before evaluation)
════════════════════════════════════════════════════════════════════════════════

□ Terminal 1 open → run: docker compose up -d
□ Terminal 2 open → run: ollama serve (if not running as a service)
□ Verify Ollama: curl http://localhost:11434/api/tags (should return model list)
□ Browser open at: http://localhost:3000/login
□ Swagger UI tab open at: http://localhost:8000/api/docs
□ Bump browser zoom to 110% for readability on projector
□ Close all notifications on your OS
□ Have a test account ready, OR be prepared to register live (more impactful)


════════════════════════════════════════════════════════════════════════════════
  SEGMENT 0 — OPENING STATEMENT  [00:00 – 00:30]  (30 seconds)
  NO screen interaction. Face the panel. Speak with authority.
════════════════════════════════════════════════════════════════════════════════

[Stand upright. Make eye contact with the panel before speaking.]

"AgentRegistry is a production-grade, full-stack Multi-Agent Orchestration
platform built entirely on open-source technology. It allows you to design,
deploy, and monitor multiple local Large Language Model agents — without
any external API dependency.

The architecture follows strict enterprise patterns: a normalized PostgreSQL
relational schema, an async FastAPI service layer using the Service-Repository
pattern, and a Next.js 14 App Router frontend. Everything is containerized
with Docker Compose, and the entire project is secured with JWT Role-Based
Authentication.

I'll walk you through five live demonstrations in the next four and a half
minutes — each one directly mapping to a mandatory technical requirement."

[Turn to the screen. Open the browser at http://localhost:3000/login]


════════════════════════════════════════════════════════════════════════════════
  SEGMENT 1 — GLASSMORPHISM UI + REGISTER  [00:30 – 01:15]  (45 seconds)
  Screen: http://localhost:3000/login
  Requirement: Frontend Aesthetic + Forms
════════════════════════════════════════════════════════════════════════════════

[Point to the screen broadly before diving into specifics.]

"The first thing to notice is the visual architecture of this interface.
This is a custom dark-mode Glassmorphism design system — built entirely
with Tailwind CSS, without any component library like MUI or Shadcn.

What you're seeing here: the translucent panels use backdrop-blur with
a white opacity surface — that's the glass effect. Those slowly drifting
color orbs in the background are CSS keyframe animations I defined in
the Tailwind config. The entire animation system — page transitions,
card hover states, and loading skeletons — is driven by Framer Motion.

Now — for the authentication flow."

[Click the "Register" tab on the login card.]

"I'll register a new account live. Notice this form is built with
React Hook Form and validated client-side using a Zod schema. If I
try to submit with a weak password..."

[Type in username: "demo_prof" and password: "123" — hit submit]

"...the Zod validator intercepts it immediately — no network call made.
That's client-side schema validation working correctly."

[Now type a valid password: "securepass123" and submit.]

"On the backend, FastAPI hashes this password with bcrypt via passlib,
stores it in the users table, and the system automatically logs me in
by calling the token endpoint and returning a signed JWT."

[You should now be redirected to the dashboard.]


════════════════════════════════════════════════════════════════════════════════
  SEGMENT 2 — JWT AUTHENTICATION  [01:15 – 01:45]  (30 seconds)
  Screen: Browser DevTools → Application → Cookies
  Requirement: JWT Auth + Session Handling + RBAC
════════════════════════════════════════════════════════════════════════════════

[Open DevTools: F12 → Application tab → Cookies → localhost:3000]

"Let me show you the authentication mechanism under the hood.
You can see the JWT access token stored as an HTTP cookie — named
'ar_token'. This is a signed HS256 JSON Web Token."

[Copy the token value. Open a new tab to https://jwt.io. Paste it in.]

"If I decode this token at jwt.io, you can see the payload contains
the user's database ID as the 'sub' claim, their role as the 'role'
claim, and the expiry timestamp. The signature is verified on every
protected API request using our 32-byte secret key.

On the backend, there's a FastAPI dependency called get_current_user
that decodes this token, queries the database, and injects the full
User object into every protected route. There's also a require_admin
dependency that checks the role claim — that's our Role-Based Access
Control."

[Close DevTools. Return to the dashboard.]


════════════════════════════════════════════════════════════════════════════════
  SEGMENT 3 — WORKSPACE + INSERT AGENT  [01:45 – 02:45]  (60 seconds)
  Screen: http://localhost:3000/dashboard
  Requirement: INSERT CRUD operation + Forms + Database constraints
════════════════════════════════════════════════════════════════════════════════

[The dashboard should be visible. If no workspace exists, you'll see an
 empty state. Either create one first, or have one pre-created.]

"This is the Command Center — the main dashboard. It fetches all agent
configurations from the database dynamically using TanStack Query, which
handles caching, background refetching, and loading states.

Let me demonstrate the INSERT operation — creating a new agent configuration."

[Click the "New Agent" button in the top right. The AddAgentModal opens.]

"This modal uses React Hook Form with a Zod validation schema that mirrors
the Pydantic schema on the backend — so validation is enforced at both layers.

I'll select the llama3 model, write a domain-specific system prompt..."

[Select "llama3" from the model dropdown.]
[In the system prompt field, type: "You are an expert agricultural data
analyst. Provide precise, data-driven insights."]

"...and set the temperature. This slider maps to a PostgreSQL CHECK
constraint I defined on the agent_configs table — the database itself
will reject any temperature outside the range of 0.0 to 2.0, not just
the application."

[Set temperature slider to around 0.4]

[Click "Create Agent"]

"The request goes from the React form to our Axios client, which injects
the Bearer token, hits POST /api/v1/agents/ on FastAPI, which passes through
the auth dependency, validates the workspace ownership, executes the INSERT
via SQLAlchemy's async ORM, and returns the created record as a Pydantic
schema serialized to JSON."

[The new AgentCard should appear in the grid with a Framer Motion animation.]

"Notice the card appeared with an animation — TanStack Query invalidated
the cache and refetched the agent list automatically after the mutation."


════════════════════════════════════════════════════════════════════════════════
  SEGMENT 4 — TASK EXECUTION VIA OLLAMA  [02:45 – 03:45]  (60 seconds)
  Screen: Click "Run Task" on the AgentCard → /tasks page
  Requirement: Ollama LLM integration + UPDATE operation + state machine
════════════════════════════════════════════════════════════════════════════════

[Click "Run Task" on the AgentCard you just created. You'll land on /tasks.]

"This is the Task Runner. It's a full conversational interface for executing
prompts against local LLMs. On the left, I've selected my llama3 agent.
Let me submit a prompt."

[In the text area, type: "What are the key indicators of healthy soil
composition for wheat farming?"]

[Press Cmd+Enter or click the Send button.]

"Watch what happens on the backend right now — in order:

First, a row is written to the task_queue table with status PENDING.
Then the status transitions to RUNNING.
Then our agent_service uses an httpx AsyncClient to POST this prompt to
the local Ollama API running at localhost:11434 — this is the LLM executing
on your local hardware, no cloud required.
We measure the wall-clock execution time in nanoseconds using Python's
perf_counter_ns for precision."

[The typing indicator with animated dots should be visible while Ollama runs.]

"While Ollama generates the response, notice this typing indicator — a pure
CSS and Framer Motion animation communicating the async state to the user.

Once Ollama responds..."

[When the response appears, point to it.]

"...the backend writes the response text and execution time in milliseconds
to the execution_logs table, and atomically updates the task_queue status
to COMPLETED. That's a state machine — five states: PENDING, RUNNING,
COMPLETED, FAILED — enforced by a PostgreSQL ENUM type.

This UPDATE operation is the third CRUD requirement demonstrated.
The database now contains a complete execution record I can query in analytics."


════════════════════════════════════════════════════════════════════════════════
  SEGMENT 5 — ANALYTICS PAGE + 3-TABLE JOIN  [03:45 – 04:45]  (60 seconds)
  Screen: Navigate to /analytics via the Sidebar
  Requirement: Complex JOIN + Filtered Search + SELECT aggregations
════════════════════════════════════════════════════════════════════════════════

[Click "Analytics" in the left sidebar. The analytics page loads.]

"This is the most technically significant page in the application —
it demonstrates the complex JOIN requirement.

The data you see in this table and chart is not a simple SELECT. It is
produced by a single SQLAlchemy query that performs a 3-table INNER JOIN
across agent_configs, task_queue, and execution_logs — the three tables
at the bottom of the cascade chain."

[Point to the bar chart first, then the table.]

"The bar chart renders average execution time per model using Recharts.
The table below shows the full aggregation: total tasks dispatched, how
many completed successfully, how many failed, and min/max/average response
times in milliseconds.

Let me show you the filtered search."

[Type "llama" into the search bar on the analytics page.]

"This text filter operates on the model_name field, narrowing the JOIN
results in real time via a useMemo pipeline on the client."

[Click the "degraded" status filter pill.]

"This filter shows only models with a sub-80% success rate — a meaningful
business metric derived from the completed_tasks to total_tasks ratio.

And notice these column headers are sortable."

[Click on "Avg (ms)" column header to sort.]

"Clicking any column triggers ASC/DESC sorting — the evaluator can
dynamically reorder the JOIN results any way they need."

[Point to the animated progress bars in the Success Rate column.]

"Those animated progress bars are driven by Framer Motion, with color
coding: emerald for healthy models, orange for degraded ones — a
visual representation of the completion rate."

[Point at the chart subtitle.]

"And this subtitle line explicitly states: 'Aggregated 3-table JOIN
report — agent_configs × task_queue × execution_logs'. That's by design,
for evaluation transparency."


════════════════════════════════════════════════════════════════════════════════
  SEGMENT 6 — CLOSING STATEMENT  [04:45 – 05:00]  (15 seconds)
  NO screen interaction. Face the panel.
════════════════════════════════════════════════════════════════════════════════

[Turn away from screen. Face the evaluation panel directly.]

"To summarize: AgentRegistry demonstrates a complete, normalized relational
schema with all five mandatory tables, Primary Keys, Foreign Keys with cascade
deletion, and constraint enforcement. All four CRUD operations are live.
The 3-table JOIN analytics endpoint is live. JWT Role-Based Auth is live.
The filtered search is live. And everything is containerized with Docker Compose
and deployable with a single command.

I'm happy to take any questions — including a live look at the FastAPI Swagger
documentation, the Alembic migration history, or the SQLAlchemy ORM source code."

[Smile. Stop talking. Let the silence work for you.]


════════════════════════════════════════════════════════════════════════════════
  ANTICIPATED PANEL QUESTIONS — WITH EXACT ANSWERS
════════════════════════════════════════════════════════════════════════════════

Q: "Why did you choose FastAPI over Django or Flask?"

A: "FastAPI is built on Starlette and Pydantic, giving us native async/await
support throughout the request lifecycle. This is critical because our most
expensive operation — the Ollama LLM call — is a network-bound I/O operation
that could block for 10-120 seconds. With asyncio, the Uvicorn server continues
handling other requests during that wait. Django's ORM is synchronous by default,
and Flask requires significant bolting-on to achieve the same result. FastAPI
also auto-generates OpenAPI documentation from our Pydantic schemas, which you
can see live at port 8000."

────────────────────────────────────────────────────────────────────────────────

Q: "What is the difference between your models and schemas? Why have both?"

A: "This is the Service-Repository pattern. SQLAlchemy models are the persistence
layer — they define the database table structure, column types, constraints, and
relationships. Pydantic schemas are the API contract layer — they define what JSON
the client sends in and what JSON we return. They're intentionally separate because
what you store and what you expose are different concerns. For example, the User
model has a password_hash field — our UserRead Pydantic schema deliberately omits
it so it's never serialized to a response. One layer, one responsibility."

────────────────────────────────────────────────────────────────────────────────

Q: "How does the cascade delete work exactly?"

A: "It's implemented at two levels. In the SQLAlchemy ORM, the relationships use
cascade='all, delete-orphan' on the Python side, and the ForeignKey declarations
use ondelete='CASCADE' on the SQL side. When I delete a workspace, PostgreSQL
automatically removes all child agent_configs rows, which triggers removal of all
task_queue rows, which triggers removal of all execution_logs rows — in a single
database transaction. The application doesn't need to issue four separate DELETE
statements — the relational engine handles referential integrity atomically."

────────────────────────────────────────────────────────────────────────────────

Q: "Explain the 3-table JOIN in more detail."

A: "The analytics endpoint in analytics_service.py constructs a SQLAlchemy Core
query that joins agent_configs to task_queue on agent_id, then joins task_queue
to execution_logs on task_id. It applies six aggregate functions in a single
GROUP BY query: COUNT of total tasks, COUNT with a CASE expression for completed
and failed tasks separately — which is a conditional aggregation pattern —
then AVG, MIN, and MAX on execution_time_ms. The result is ordered by average
execution time ascending, so the fastest model appears first. This is all
executed as a single round-trip to the database, not multiple queries."

────────────────────────────────────────────────────────────────────────────────

Q: "What happens if Ollama is not running when a task is submitted?"

A: "The agent_service catches the httpx.ConnectError that asyncpg raises when
the connection to localhost:11434 is refused. It then sets the task_queue row's
status to FAILED and raises our custom OllamaConnectionError domain exception.
This exception is registered with a FastAPI exception handler in core/exceptions.py
that returns a structured JSON error with HTTP 503 Service Unavailable — the
semantically correct status code for a downstream dependency being offline.
The frontend displays this as a styled error banner in the Task Runner."

────────────────────────────────────────────────────────────────────────────────

Q: "Why PostgreSQL over MongoDB for this use case?"

A: "The relational nature of the data made PostgreSQL the correct choice.
We have a well-defined, hierarchical entity model: users own workspaces,
workspaces contain agent_configs, agent_configs produce tasks, tasks produce
execution logs. That's a strict 1-to-many cascade chain — exactly the type of
relationship that relational databases with foreign key constraints and JOIN
operations are optimized for. The analytics requirement specifically asks for
aggregated JOIN queries across multiple entities — that's a natural fit for SQL.
A document store like MongoDB would require either denormalization, which
introduces update anomalies, or application-side joins, which are less efficient."

────────────────────────────────────────────────────────────────────────────────

Q: "How is the JWT secured?"

A: "The JWT is signed with HMAC-SHA256 using a 32-byte cryptographically random
secret key generated with openssl rand -hex 32. The token contains three claims:
sub — the user's database integer ID, role — their access level, and exp —
the expiry timestamp. On every protected request, the get_current_user dependency
decodes and verifies the signature, checks the expiry, and queries the database
to confirm the user still exists. If the secret key is not known to an attacker,
the token cannot be forged. Passwords are hashed with bcrypt using passlib, with
a work factor that makes brute-force computationally infeasible."

────────────────────────────────────────────────────────────────────────────────

Q: "What does Alembic do and why not just use create_all()?"

A: "Alembic is a database migration tool — it versions schema changes the same
way Git versions source code. SQLAlchemy's create_all() is a one-shot operation
that creates tables if they don't exist but cannot modify existing ones. In a
production system, when you add a column, change a type, or add a constraint,
you need to apply that change to a live database without dropping it. Alembic
generates migration scripts using --autogenerate by comparing the current ORM
models against the database's actual schema and generating the precise ALTER TABLE
statements needed. The entrypoint.sh script runs 'alembic upgrade head' on every
container start — making deployment idempotent and schema-consistent by design."

════════════════════════════════════════════════════════════════════════════════
  TECHNICAL VOCABULARY CHEAT SHEET
  Use these exact terms — they signal senior engineering expertise.
════════════════════════════════════════════════════════════════════════════════

BACKEND
  → "async/await with asyncio event loop"
  → "ASGI server (Uvicorn) vs WSGI (Gunicorn)"
  → "Dependency Injection via FastAPI Depends()"
  → "Service-Repository pattern — separation of concerns"
  → "Pydantic v2 schema serialization"
  → "SQLAlchemy ORM with mapped_column() — Python 3.10+ typed syntax"
  → "Alembic migration — idempotent schema versioning"
  → "bcrypt work factor — computational cost of password hashing"
  → "HS256 HMAC — symmetric JWT signing algorithm"
  → "ON DELETE CASCADE — referential integrity at the database layer"
  → "CHECK constraint — domain integrity on temperature column"
  → "asyncpg — low-level, high-performance PostgreSQL wire protocol driver"
  → "perf_counter_ns() — nanosecond-precision wall-clock timing"
  → "Structured JSON logging — machine-parseable log format"
  → "503 Service Unavailable — semantically correct for Ollama being offline"
  → "ENUM type in PostgreSQL — TaskStatus state machine"
  → "Conditional aggregation — COUNT(CASE WHEN status='completed')"

FRONTEND
  → "Next.js App Router — React Server Components by default"
  → "TanStack Query v5 — server state management with staleTime and cache invalidation"
  → "Optimistic UI — mutation triggers cache invalidation"
  → "React Hook Form with Zod resolver — two-layer validation"
  → "Axios interceptor — automatic Bearer token injection"
  → "Zustand — lightweight atomic state management"
  → "Framer Motion AnimatePresence — declarative exit animations"
  → "backdrop-filter: blur() — CSS glassmorphism effect"
  → "CSS keyframe animation — floating orb background"
  → "useMemo() — memoized filter/sort pipeline"
  → "Next.js middleware — edge-runtime route protection"
  → "Standalone output mode — Docker-optimized Next.js build"

DATABASE
  → "Normalized to Third Normal Form (3NF)"
  → "Composite UNIQUE constraint — UniqueConstraint('user_id', 'name')"
  → "1-to-1 relationship — UNIQUE FK on execution_logs.task_id"
  → "3-table INNER JOIN with GROUP BY aggregation"
  → "Naming convention — deterministic Alembic constraint names"
  → "Connection pool — pool_size=10, max_overflow=20"
  → "pool_pre_ping — stale connection detection"

DEPLOYMENT
  → "Multi-stage Docker build — builder vs runtime stages"
  → "Non-root container user — security best practice"
  → "Healthcheck — service readiness before downstream starts"
  → "depends_on with condition: service_healthy — deterministic startup order"
  → "host.docker.internal — container-to-host networking for Ollama"
  → "Docker named volume — persistent PostgreSQL data"
  → "entrypoint.sh — migration runner before server start"
  → "12-Factor App methodology — config via environment variables"

════════════════════════════════════════════════════════════════════════════════
  TIMING REFERENCE CARD
════════════════════════════════════════════════════════════════════════════════

  00:00 → 00:30  Opening statement (30s)     — face the panel, no screen
  00:30 → 01:15  Glassmorphism UI + Register (45s)
  01:15 → 01:45  JWT decode demonstration (30s)
  01:45 → 02:45  INSERT agent via modal (60s)
  02:45 → 03:45  Task Runner + Ollama execution (60s)
  03:45 → 04:45  Analytics page + 3-table JOIN (60s)
  04:45 → 05:00  Closing statement (15s)     — face the panel, stop talking

  TOTAL: 5:00 exactly.

  Practice tip: Run through this at least 3 times with a timer.
  The Ollama response time is your biggest variable — account for it.
  If Ollama is slow, narrate the backend state machine while it runs.
  If Ollama is very fast, add: "That 2.1 second response time you see
  is now permanently recorded in our execution_logs table and will appear
  in the analytics report immediately."

════════════════════════════════════════════════════════════════════════════════
  BACKUP PLAN — IF DOCKER OR OLLAMA FAILS
════════════════════════════════════════════════════════════════════════════════

If the stack is down: Open http://localhost:8000/api/docs (Swagger UI)
→ Demonstrate each endpoint interactively via the Swagger "Try it out" button
→ Show the JWT lock icon, the request schema, and the response schema
→ Execute a real INSERT, SELECT, and the analytics endpoint from Swagger
→ This is actually a strong fallback — it shows API design rigor

If Ollama is down but DB + backend are up:
→ The POST /agents/{id}/run endpoint will return a clean 503 JSON error
→ Say: "This demonstrates our error handling — OllamaConnectionError maps
   to HTTP 503 via a custom FastAPI exception handler — the semantically
   correct response code for a downstream service being unavailable."
→ This actually demonstrates error handling — use it as a feature.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  You built something a senior engineer would be proud to ship.
  Walk in there and own it.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━